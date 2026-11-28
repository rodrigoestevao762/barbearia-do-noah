import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { BARBERS, getBarberById } from '@/lib/barbers';
import { OFFICIAL_SERVICES, getServiceById } from '@/lib/services';
import { addStoredAppointment, getAllStoredAppointments, getAppointmentsForDate } from '@/lib/appointments-store';
import { upsertStoredUser } from '@/lib/users-store';
import { getBrazilNow, getBrazilDateAndTimeString, parseBrazilDateTime, formatAptTimeToHHMM } from '@/lib/timezone';
import { checkDayStatusDB, getDayScheduleDB, getBarberDayScheduleDB } from '@/lib/studio-schedule';
import { isBarberAvailable } from '@/lib/barber-availability';
import { sendAppointmentConfirmationEmail, sendNewBookingNotificationToBarber } from '@/lib/resend';
import { toBusyInterval, hasIntervalConflict, BusyInterval } from '@/lib/scheduling';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { 
      serviceId, 
      barberId, 
      date, 
      isWalkIn, 
      clientName, 
      clientEmail, 
      clientPhone, 
      clientPassword, 
      status: reqStatus, 
      paymentMethod 
    } = body;

    const appointmentStatus = reqStatus || (isWalkIn ? "COMPLETED" : "PENDING");

    // 1. Identifica e valida o Barbeiro Oficial
    let assignedBarber = getBarberById(barberId);
    if (!assignedBarber) {
      assignedBarber = BARBERS[0];
      barberId = assignedBarber.id;
    }

    // 2. Identifica o serviço oficial correspondente (suporta IDs novos e legados)
    const matchedService = getServiceById(serviceId) || OFFICIAL_SERVICES[0];

    // Validação estrita no fuso horário do Brasil (para online e Cliente Balcão)
    const appointmentDate = parseBrazilDateTime(date);
    const requestedBrazil = getBrazilDateAndTimeString(appointmentDate);

    // 2.1 Validação de Domingo e Studio Fechado no Banco PostgreSQL
    const dayCheck = await checkDayStatusDB(requestedBrazil.date);
    if (dayCheck.isClosed) {
      return NextResponse.json({ error: dayCheck.reason }, { status: 400 });
    }

    // 2.2 Validação de Folga, Saída Antecipada e Pausa para Almoço individual no Banco PostgreSQL (com duração)
    const barberDaySchedule = await getBarberDayScheduleDB(assignedBarber.id, requestedBrazil.date);
    if (!isBarberAvailable(assignedBarber.id, requestedBrazil.date) || barberDaySchedule.isClosed) {
      return NextResponse.json(
        { error: `${assignedBarber.name} não estará atendendo nesta data selecionada.` },
        { status: 400 }
      );
    }

    const daySchedule = await getDayScheduleDB(requestedBrazil.date);
    if (daySchedule.earlyClosingTime && requestedBrazil.time > daySchedule.earlyClosingTime) {
      return NextResponse.json(
        { error: `O estúdio encerrará o expediente às ${daySchedule.earlyClosingTime} nesta data.` },
        { status: 400 }
      );
    }

    const lunchIntervals: BusyInterval[] = barberDaySchedule.lunchBreakSlots.map((slot) =>
      toBusyInterval(slot, 60)
    );
    if (hasIntervalConflict(requestedBrazil.time, matchedService.duration, lunchIntervals)) {
      return NextResponse.json(
        { error: `O horário das ${requestedBrazil.time} conflita com a pausa de almoço.` },
        { status: 400 }
      );
    }

    const brazilNow = getBrazilNow();

    const isPast =
      requestedBrazil.date < brazilNow.date ||
      (requestedBrazil.date === brazilNow.date && requestedBrazil.time <= brazilNow.time);

    if (isPast) {
      return NextResponse.json(
        { error: "Não é possível selecionar um horário que já passou. Por favor, escolha um horário futuro." },
        { status: 400 }
      );
    }

    // 2.3 Proteção matemática contra duplo agendamento / sobreposição de duração no mesmo barbeiro
    const dayStart = new Date(`${requestedBrazil.date}T00:00:00-03:00`);
    const dayEnd = new Date(`${requestedBrazil.date}T23:59:59-03:00`);
    const memAptsDay = getAppointmentsForDate(requestedBrazil.date, assignedBarber.id).filter(
      (apt) => apt.status !== "CANCELLED"
    );
    const busyIntervals: BusyInterval[] = memAptsDay.map((apt) =>
      toBusyInterval(formatAptTimeToHHMM(apt.date), apt.service?.duration)
    );
    const seenIds = new Set(memAptsDay.map((a) => a.id));

    try {
      const dbDayApts = await prisma.appointment.findMany({
        where: {
          date: { gte: dayStart, lte: dayEnd },
          status: { notIn: ["CANCELLED"] },
          OR: [
            { barberId: assignedBarber.id },
            ...(assignedBarber.id === "barbeiro-noah" ? [{ barberId: null }] : []),
          ],
        },
        include: { service: true },
      });
      (dbDayApts || []).forEach((apt) => {
        if (!seenIds.has(apt.id)) {
          busyIntervals.push(toBusyInterval(formatAptTimeToHHMM(apt.date), apt.service?.duration));
        }
      });
    } catch (_) {}

    if (hasIntervalConflict(requestedBrazil.time, matchedService.duration, busyIntervals)) {
      return NextResponse.json(
        { error: `O horário das ${requestedBrazil.time} conflita com outro agendamento na agenda de ${assignedBarber.name}. Por favor, escolha outro horário.` },
        { status: 409 }
      );
    }

    const rawPhone = (clientPhone || "").trim();
    const cleanPhone = rawPhone.replace(/\D/g, "");
    const formattedEmail = clientEmail ? clientEmail.trim().toLowerCase() : null;
    const finalPassword = clientPassword?.trim() || Math.random().toString(36).slice(-8);

    // 3. PERSISTÊNCIA GARANTIDA NO STORE RESILIENTE (Conta de Usuário + Agendamento)
    // Garante que o cliente SEMPRE tenha conta criada e possa fazer login imediatamente
    const persistentClient = upsertStoredUser({
      name: clientName?.trim() || "Cliente VIP",
      email: formattedEmail,
      phone: cleanPhone || rawPhone,
      password: finalPassword,
      role: "CLIENT",
    });

    const storedAppointment = addStoredAppointment({
      date: appointmentDate.toISOString(),
      barberId: assignedBarber.id,
      service: {
        id: matchedService.id,
        name: matchedService.name,
        price: matchedService.price,
        duration: matchedService.duration,
      },
      user: {
        id: persistentClient.id,
        name: persistentClient.name,
        phone: persistentClient.phone || rawPhone || "(27) 99999-9999",
        email: persistentClient.email || formattedEmail || undefined,
      },
      status: appointmentStatus,
      paymentMethod: paymentMethod || "PIX",
      durationSpent: appointmentStatus === "COMPLETED" ? matchedService.duration : undefined,
    });

    // 4. PERSISTÊNCIA ADICIONAL NO BANCO DE DADOS (Quando Postgres estiver acessível)
    let dbSuccess = false;
    let dbClient: any = null;
    let dbAppointment: any = null;

    try {
      // 4.1 Sincroniza Barbeiro
      try {
        await prisma.barber.upsert({
          where: { id: assignedBarber.id },
          update: { 
            name: assignedBarber.name,
            commissionRate: assignedBarber.commissionRate,
          },
          create: {
            id: assignedBarber.id,
            name: assignedBarber.name,
            commissionRate: assignedBarber.commissionRate,
          },
        });
      } catch (_) {}

      // 4.2 Sincroniza Serviço (sempre garante nome/preço/duração oficiais)
      let finalServiceId: string = matchedService.id;
      try {
        const newService = await prisma.service.upsert({
          where: { id: matchedService.id },
          update: {
            name: matchedService.name,
            description: matchedService.description,
            price: matchedService.price,
            duration: matchedService.duration,
          },
          create: {
            id: matchedService.id,
            name: matchedService.name,
            description: matchedService.description,
            price: matchedService.price,
            duration: matchedService.duration,
          },
        });
        finalServiceId = newService.id;
      } catch (_) {}

      // 4.3 Cria/Atualiza Usuário no Banco (sem nunca sobrescrever contas ADMIN/BARBER)
      const hashedPassword = await bcrypt.hash(finalPassword, 10);
      const existingDbClient = (formattedEmail || cleanPhone)
        ? await prisma.user.findFirst({
            where: {
              role: "CLIENT",
              OR: [
                ...(formattedEmail ? [{ email: formattedEmail }] : []),
                ...(cleanPhone ? [{ phone: cleanPhone }] : []),
              ],
            },
          })
        : null;

      if (existingDbClient) {
        dbClient = await prisma.user.update({
          where: { id: existingDbClient.id },
          data: {
            name: persistentClient.name,
            email: formattedEmail || existingDbClient.email,
            phone: cleanPhone || existingDbClient.phone,
            ...(!isWalkIn ? { password: hashedPassword } : {}),
          },
        });
      } else {
        dbClient = await prisma.user.create({
          data: {
            id: persistentClient.id,
            name: persistentClient.name,
            phone: cleanPhone || null,
            email: formattedEmail || null,
            password: hashedPassword,
            role: "CLIENT",
          },
        });
      }

      // 4.4 Cria Agendamento no Banco
      dbAppointment = await prisma.appointment.create({
        data: {
          id: storedAppointment.id,
          date: appointmentDate,
          serviceId: finalServiceId,
          userId: dbClient.id,
          barberId: assignedBarber.id,
          status: appointmentStatus,
        },
      });

      dbSuccess = true;
    } catch (dbErr) {
      // Postgres indisponível — o fluxo segue protegido pelo store resiliente
      console.warn("Aviso: Banco relacional em contingência, dados persistidos no storage blindado.");
    }

    // 5. DISPARO DE NOTIFICAÇÕES POR E-MAIL RESEND (CLIENTE VIP + BARBEIRO)
    try {
      const requestedBrazil = getBrazilDateAndTimeString(appointmentDate);
      const [year, month, day] = requestedBrazil.date.split("-");
      const displayDate = `${day}/${month}/${year}`;
      const displayTime = requestedBrazil.time;

      // 5.1 Envia confirmação com credenciais de acesso VIP para o cliente
      if (formattedEmail) {
        sendAppointmentConfirmationEmail({
          to: formattedEmail,
          clientName: persistentClient.name,
          barberName: assignedBarber.name,
          serviceName: matchedService.name,
          servicePrice: matchedService.price,
          serviceDuration: matchedService.duration,
          appointmentDate: displayDate,
          appointmentTime: displayTime,
          paymentMethod: paymentMethod || "PIX",
          clientEmail: formattedEmail,
          clientPassword: clientPassword || undefined,
        }).catch((err) => console.error("Erro assíncrono envio e-mail cliente:", err));
      }

      // 5.2 Envia alerta imediato de novo agendamento para o Master Barber Noah
      const barberEmail = assignedBarber.email || "noahbarberstudio@gmail.com";
      sendNewBookingNotificationToBarber({
        barberEmail,
        barberName: assignedBarber.name,
        clientName: persistentClient.name,
        clientPhone: persistentClient.phone || rawPhone,
        clientEmail: formattedEmail || undefined,
        serviceName: matchedService.name,
        servicePrice: matchedService.price,
        appointmentDate: displayDate,
        appointmentTime: displayTime,
        paymentMethod: paymentMethod || "PIX",
      }).catch((err) => console.error("Erro assíncrono envio e-mail barbeiro:", err));
    } catch (emailErr) {
      console.error("Aviso: Falha não-bloqueante no envio de notificações:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Agendamento e conta de cliente VIP criados com sucesso!",
      appointment: {
        ...(dbAppointment || storedAppointment),
        barber: assignedBarber,
        service: matchedService,
      },
      barber: assignedBarber,
      client: {
        id: persistentClient.id,
        name: persistentClient.name,
        email: persistentClient.email,
        phone: persistentClient.phone,
      },
      dbPersisted: dbSuccess,
    });

  } catch (error: any) {
    console.error("ERRO GERAL AO AGENDAR:", error);
    return NextResponse.json({ error: error.message || "Erro ao processar agendamento" }, { status: 500 });
  }
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userEmail = session?.user?.email?.toLowerCase();
    const userBarberId = (session?.user as any)?.barberId;
    const isOwner = userRole === "ADMIN" && userEmail !== "adriansantos@gmail.com";
    const isAdrian = userRole === "BARBER" || userEmail === "adriansantos@gmail.com" || userBarberId === "barbeiro-adrian";

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const whereClause: any = {};
    if (isAdrian) {
      whereClause.barberId = "barbeiro-adrian";
    } else if (isOwner) {
      whereClause.OR = [
        { barberId: "barbeiro-noah" },
        { barberId: null },
      ];
    }

    let dbApts: any[] = [];
    try {
      dbApts = await prisma.appointment.findMany({
        where: whereClause,
        take: limit,
        orderBy: { date: "desc" },
        include: { service: true, user: true, barber: true },
      });
    } catch (_) {}

    const memApts = getAllStoredAppointments().filter((a: any) => {
      if (isAdrian) return a.barberId === "barbeiro-adrian";
      if (isOwner) return a.barberId === "barbeiro-noah" || !a.barberId;
      return true;
    });

    const map = new Map<string, any>();
    memApts.forEach((a) => map.set(a.id, a));
    (dbApts || []).forEach((a) => map.set(a.id, a));

    const finalApts = Array.from(map.values())
      .filter((a) => !a.id?.includes("almir") && !a.user?.name?.toLowerCase().includes("almir"))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    return NextResponse.json(finalApts);
  } catch (error) {
    console.error("Erro ao listar agendamentos:", error);
    return NextResponse.json({ error: "Erro ao buscar agendamentos" }, { status: 500 });
  }
}
