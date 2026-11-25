import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BARBERS } from "@/lib/barbers";
import { getAppointmentsForDate } from "@/lib/appointments-store";
import { getBrazilNow, formatAptTimeToHHMM } from "@/lib/timezone";
import { checkDayStatus } from "@/lib/holidays";
import { isBarberAvailable, getBarberLunchBreakTime, parseLunchBreakSlots } from "@/lib/barber-availability";
import { getDayScheduleDB, getBarberDayScheduleDB } from "@/lib/studio-schedule";

export const dynamic = "force-dynamic";

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

// Horários Oficiais do Noah Barber Studio:
// - Segunda a Sábado: 09:00 às 20:00
// - Domingo: Fechado
const OPERATING_HOURS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
];

const WEEKDAY_HOURS = OPERATING_HOURS;
const SATURDAY_HOURS = OPERATING_HOURS;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const barberId = searchParams.get("barberId") || "barbeiro-noah";

    if (!dateParam) {
      return NextResponse.json({ error: "Data não informada" }, { status: 400 });
    }

    const cleanDateStr = dateParam.substring(0, 10);

    // 1. Verificação de Domingo e data no passado
    const dayStatus = checkDayStatus(cleanDateStr);
    if (dayStatus.isSunday) {
      return jsonNoStore({
        availableTimes: [],
        isClosed: true,
        isSunday: true,
        isHoliday: false,
        isStudioClosed: false,
        reason: dayStatus.reason,
      });
    }

    const brazilNow = getBrazilNow();

    // 2. Se a data for no passado (antes de hoje no Brasil), não há horários livres
    if (cleanDateStr < brazilNow.date) {
      return jsonNoStore({ availableTimes: [] });
    }

    // 2.1 Busca configuração oficial da escala e pausa para almoço no PostgreSQL
    const schedule = await getDayScheduleDB(cleanDateStr);
    if (schedule.isClosed) {
      return jsonNoStore({
        availableTimes: [],
        isClosed: true,
        isSunday: false,
        isHoliday: false,
        isStudioClosed: true,
        reason: "O estúdio estará fechado nesta data pelo Master Barber Noah Ferreira.",
      });
    }

    // 2.2 Checa no PostgreSQL se o barbeiro específico selecionado está de folga nesta data
    const barberSchedule = await getBarberDayScheduleDB(barberId, cleanDateStr);
    const isBarberOffToday = !isBarberAvailable(barberId, cleanDateStr) || barberSchedule.isClosed;
    if (isBarberOffToday) {
      const barberName = barberId === "barbeiro-adrian" ? "Adrian Santos" : "Noah Ferreira";
      return jsonNoStore({
        availableTimes: [],
        isClosed: true,
        isSunday: false,
        isHoliday: false,
        isStudioClosed: false,
        reason: `${barberName} não estará atendendo nesta data selecionada.`,
      });
    }

    // 3. Determina os horários base de acordo com o dia da semana
    // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    const [yStr, mStr, dStr] = cleanDateStr.split("-");
    const dateObj = new Date(Date.UTC(parseInt(yStr, 10), parseInt(mStr, 10) - 1, parseInt(dStr, 10), 12, 0, 0));
    const dayOfWeek = dateObj.getUTCDay();

    let baseHours = dayOfWeek === 6 ? [...SATURDAY_HOURS] : [...WEEKDAY_HOURS];

    // 4. Verificação de Encerramento Antecipado (Caso o barbeiro precise sair mais cedo neste dia)
    const earlyClosingTime = schedule.earlyClosingTime;
    if (earlyClosingTime) {
      baseHours = baseHours.filter((time) => time <= earlyClosingTime);
    }

    // 4.1 Verificação de Pausa para Almoço do Barbeiro Selecionado (PostgreSQL + fallback memória)
    const barberLunchTime = barberSchedule.lunchBreakTime || getBarberLunchBreakTime(barberId, cleanDateStr);
    const lunchBreakSlots = barberSchedule.lunchBreakSlots.length > 0
      ? barberSchedule.lunchBreakSlots
      : parseLunchBreakSlots(barberLunchTime);
    if (lunchBreakSlots.length > 0) {
      baseHours = baseHours.filter((time) => !lunchBreakSlots.includes(time));
    }

    // 5. Se for o dia de hoje, remove horários que já passaram
    if (cleanDateStr === brazilNow.date) {
      baseHours = baseHours.filter((time) => time > brazilNow.time);
    }

    // Intervalo do dia no fuso horário do Brasil (UTC-3)
    const startOfDay = new Date(`${cleanDateStr}T00:00:00-03:00`);
    const endOfDay = new Date(`${cleanDateStr}T23:59:59-03:00`);

    try {
      // 6. Busca agendamentos ocupados no banco de dados para este profissional específico
      const bookedAppointments = await prisma.appointment.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          status: { notIn: ["CANCELLED"] },
          OR: [
            { barberId },
            ...(barberId === "barbeiro-noah" ? [{ barberId: null }] : []),
          ],
        },
      });

      const bookedTimes = (bookedAppointments || []).map((apt) => formatAptTimeToHHMM(apt.date));

      // Também verifica no store em memória para contingência
      const storedApts = getAppointmentsForDate(cleanDateStr, barberId);
      storedApts
        .filter((apt) => apt.status !== "CANCELLED")
        .forEach((apt) => {
          const t = formatAptTimeToHHMM(apt.date);
          if (!bookedTimes.includes(t)) {
            bookedTimes.push(t);
          }
        });

      const availableTimes = baseHours.filter((time) => !bookedTimes.includes(time));

      return jsonNoStore({
        availableTimes,
        isSaturday: dayOfWeek === 6,
        earlyClosingTime: earlyClosingTime || null,
        lunchBreakTime: barberLunchTime || null,
        lunchBreakSlots,
      });
    } catch (dbErr) {
      // Fallback em memória
      const storedApts = getAppointmentsForDate(cleanDateStr, barberId);
      const bookedTimes = storedApts
        .filter((apt) => apt.status !== "CANCELLED")
        .map((apt) => formatAptTimeToHHMM(apt.date));

      const availableTimes = baseHours.filter((time) => !bookedTimes.includes(time));

      return jsonNoStore({
        availableTimes,
        isSaturday: dayOfWeek === 6,
        earlyClosingTime: earlyClosingTime || null,
        lunchBreakTime: barberLunchTime || null,
        lunchBreakSlots,
      });
    }
  } catch (error) {
    console.error("Erro ao buscar horários disponíveis:", error);
    return NextResponse.json({ error: "Erro ao buscar horários" }, { status: 500 });
  }
}
