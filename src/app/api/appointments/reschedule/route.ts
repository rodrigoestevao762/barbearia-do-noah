import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateStoredAppointment, getStoredAppointmentById, getAppointmentsForDate } from "@/lib/appointments-store";
import { checkDayStatusDB, getDayScheduleDB, getBarberDayScheduleDB } from "@/lib/studio-schedule";
import { getBrazilNow, parseBrazilDateTime, formatAptTimeToHHMM } from "@/lib/timezone";
import { toBusyInterval, hasIntervalConflict, BusyInterval } from "@/lib/scheduling";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const id = body.id;
    const requestedDate = body.requestedDate || body.date;
    const requestedTime = body.requestedTime || body.time;

    if (!id || !requestedDate || !requestedTime) {
      return NextResponse.json({ error: "Dados incompletos para reagendamento" }, { status: 400 });
    }

    // 1. Valida se a nova data está aberta e fora da pausa de almoço/saída antecipada no PostgreSQL
    const dayCheck = await checkDayStatusDB(requestedDate);
    if (dayCheck.isClosed) {
      return NextResponse.json({ error: dayCheck.reason }, { status: 400 });
    }

    const daySchedule = await getDayScheduleDB(requestedDate);
    if (daySchedule.earlyClosingTime && requestedTime > daySchedule.earlyClosingTime) {
      return NextResponse.json(
        { error: `O estúdio encerrará o expediente às ${daySchedule.earlyClosingTime} nesta data.` },
        { status: 400 }
      );
    }
    if (daySchedule.lunchBreakSlots.includes(requestedTime)) {
      return NextResponse.json(
        { error: `O horário das ${requestedTime} está bloqueado para pausa de almoço.` },
        { status: 400 }
      );
    }

    // 2. Valida se o novo horário não está no passado
    const brazilNow = getBrazilNow();
    if (requestedDate < brazilNow.date || (requestedDate === brazilNow.date && requestedTime <= brazilNow.time)) {
      return NextResponse.json({ error: "Não é possível reagendar para um horário que já passou." }, { status: 400 });
    }

    // 3. Monta data ISO com fuso brasileiro
    const newDateTime = parseBrazilDateTime(requestedDate, requestedTime);

    // 4. Busca o agendamento
    let apt: any = null;
    try {
      apt = await prisma.appointment.findUnique({
        where: { id },
        include: { barber: true, service: true, user: true },
      });
    } catch (_) {}

    if (!apt) {
      apt = getStoredAppointmentById(id);
    }

    if (!apt) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const targetBarberId = apt.barberId || "barbeiro-noah";
    const aptDuration = apt.service?.duration || 30;
    const barberDaySchedule = await getBarberDayScheduleDB(targetBarberId, requestedDate);
    if (barberDaySchedule.isClosed) {
      return NextResponse.json(
        { error: "O profissional selecionado não estará atendendo nesta data." },
        { status: 400 }
      );
    }
    const lunchIntervals: BusyInterval[] = barberDaySchedule.lunchBreakSlots.map((slot) =>
      toBusyInterval(slot, 60)
    );
    if (hasIntervalConflict(requestedTime, aptDuration, lunchIntervals)) {
      return NextResponse.json(
        { error: `O horário das ${requestedTime} conflita com a pausa de almoço.` },
        { status: 400 }
      );
    }

    // Valida conflito com outros agendamentos do mesmo barbeiro na nova data
    const dayStart = new Date(`${requestedDate}T00:00:00-03:00`);
    const dayEnd = new Date(`${requestedDate}T23:59:59-03:00`);
    const memDayApts = getAppointmentsForDate(requestedDate, targetBarberId).filter(
      (a) => a.id !== id && a.status !== "CANCELLED"
    );
    const busyIntervals: BusyInterval[] = memDayApts.map((a) =>
      toBusyInterval(formatAptTimeToHHMM(a.date), a.service?.duration)
    );
    const seenIds = new Set(memDayApts.map((a) => a.id));
    try {
      const dbDayApts = await prisma.appointment.findMany({
        where: {
          date: { gte: dayStart, lte: dayEnd },
          status: { notIn: ["CANCELLED"] },
          id: { not: id },
          OR: [
            { barberId: targetBarberId },
            ...(targetBarberId === "barbeiro-noah" ? [{ barberId: null }] : []),
          ],
        },
        include: { service: true },
      });
      (dbDayApts || []).forEach((a) => {
        if (!seenIds.has(a.id)) {
          busyIntervals.push(toBusyInterval(formatAptTimeToHHMM(a.date), a.service?.duration));
        }
      });
    } catch (_) {}

    if (hasIntervalConflict(requestedTime, aptDuration, busyIntervals)) {
      return NextResponse.json(
        { error: `O horário das ${requestedTime} já está ocupado nesta data. Escolha outro horário.` },
        { status: 409 }
      );
    }

    // Proteção de permissão: clientes só podem reagendar seus próprios agendamentos
    if (session) {
      const userRole = (session.user as any)?.role;
      const userId = (session.user as any)?.id;
      const userEmail = session.user?.email?.toLowerCase();
      const userPhone = (session.user as any)?.phone?.replace(/\D/g, "");
      const aptPhone = apt.user?.phone?.replace(/\D/g, "");
      const isOwner =
        userRole === "ADMIN" ||
        userRole === "BARBER" ||
        apt.userId === userId ||
        (apt.user?.email && apt.user.email.toLowerCase() === userEmail) ||
        (userPhone && aptPhone && (aptPhone.includes(userPhone) || userPhone.includes(aptPhone)));
      if (!isOwner) {
        return NextResponse.json({ error: "Você não tem permissão para reagendar este agendamento." }, { status: 403 });
      }
    }

    // 5. Registra a solicitação de reagendamento (status RESCHEDULE_REQUESTED)
    updateStoredAppointment(id, {
      status: "RESCHEDULE_REQUESTED",
      requestedDate: newDateTime.toISOString(),
    });

    try {
      await prisma.appointment.update({
        where: { id },
        data: {
          status: "RESCHEDULE_REQUESTED",
        },
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      status: "RESCHEDULE_REQUESTED",
      requestedDate: newDateTime.toISOString(),
      requestedDateDisplay: `${requestedDate.split("-").reverse().join("/")} às ${requestedTime}`,
      barber: apt.barber,
      appointment: apt,
      message: "Solicitação de reagendamento registrada. O barbeiro foi notificado para aprovação no painel.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao solicitar reagendamento" }, { status: 500 });
  }
}

