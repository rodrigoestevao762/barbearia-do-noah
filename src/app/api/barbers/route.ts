import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BARBERS } from "@/lib/barbers";
import {
  getDayScheduleDB,
  setDateClosedDB,
  setEarlyClosingTimeDB,
  setLunchBreakTimeDB,
  getBarberDayScheduleDB,
  setBarberOffDB,
  setBarberLunchBreakTimeDB,
} from "@/lib/studio-schedule";
import { isBarberOff, setBarberOff } from "@/lib/barber-availability";
import { getBrazilNow } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date") || getBrazilNow().date;

  const studioSchedule = await getDayScheduleDB(dateParam);
  const adrianSchedule = await getBarberDayScheduleDB("barbeiro-adrian", dateParam);

  const barbersWithStatus = BARBERS.map((b) => {
    if (b.id === "barbeiro-adrian") {
      const isOff = studioSchedule.isClosed || adrianSchedule.isClosed || isBarberOff("barbeiro-adrian", dateParam);
      return {
        ...b,
        isAvailable: !isOff,
        isDateClosed: isOff,
        isDayOff: isOff,
        earlyClosingTime: studioSchedule.earlyClosingTime,
        lunchBreakTime: adrianSchedule.lunchBreakTime,
        defaultLunchBreakTime: adrianSchedule.defaultLunchBreakTime,
        isLunchBreakFixed: adrianSchedule.isLunchBreakFixed,
        hasLunchDateOverride: adrianSchedule.hasLunchDateOverride,
        lunchBreakSlots: adrianSchedule.lunchBreakSlots,
        queryDate: dateParam,
      };
    }

    return {
      ...b,
      isAvailable: !studioSchedule.isClosed,
      isDateClosed: studioSchedule.isClosed,
      isDayOff: studioSchedule.isClosed,
      earlyClosingTime: studioSchedule.earlyClosingTime,
      lunchBreakTime: studioSchedule.lunchBreakTime,
      defaultLunchBreakTime: studioSchedule.defaultLunchBreakTime,
      isLunchBreakFixed: studioSchedule.isLunchBreakFixed,
      hasLunchDateOverride: studioSchedule.hasLunchDateOverride,
      lunchBreakSlots: studioSchedule.lunchBreakSlots,
      queryDate: dateParam,
    };
  });

  return NextResponse.json(barbersWithStatus, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userEmail = session?.user?.email?.toLowerCase();
    const isOwner = userRole === "ADMIN" && userEmail !== "adriansantos@gmail.com";

    if (!session || (userRole !== "ADMIN" && userRole !== "BARBER")) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    const body = await req.json();
    const {
      barberId: requestedBarberId,
      isAvailable,
      date,
      earlyClosingTime,
      lunchBreakTime,
      lunchBreakScope,
    } = body;
    const targetDate = (date || getBrazilNow().date).substring(0, 10);

    // Se for o funcionário Adrian Santos:
    // - NÃO pode fechar o estúdio
    // - NÃO pode alterar horário de saída antecipada do estúdio
    // - NÃO pode pausar o almoço do Noah
    // - PODE apenas marcar folga dele nesta data e pausar o almoço dele
    if (!isOwner) {
      const barberId = "barbeiro-adrian";

      if (typeof isAvailable === "boolean") {
        const isOff = !isAvailable;
        setBarberOff(barberId, targetDate, isOff);
        await setBarberOffDB(barberId, targetDate, isOff);
      }

      if (lunchBreakTime !== undefined) {
        const scope = lunchBreakScope === "date" ? "date" : "default";
        await setBarberLunchBreakTimeDB(barberId, targetDate, lunchBreakTime || null, scope);
      }

      const schedule = await getBarberDayScheduleDB(barberId, targetDate);
      const isOff = isBarberOff(barberId, targetDate) || schedule.isClosed;

      return NextResponse.json({
        success: true,
        barberId,
        date: targetDate,
        isAvailable: !isOff,
        isDateClosed: isOff,
        isDayOff: isOff,
        lunchBreakTime: schedule.lunchBreakTime,
        message: isOff
          ? `Folga confirmada para Adrian Santos no dia ${targetDate.split("-").reverse().join("/")}. O estúdio permanecerá aberto com Noah.`
          : `Adrian Santos disponível para atendimentos no dia ${targetDate.split("-").reverse().join("/")}.`,
      });
    }

    // Se for o Dono Noah Ferreira:
    const barberId = requestedBarberId || "barbeiro-noah";

    if (barberId === "barbeiro-adrian") {
      // Dono gerenciando folga ou almoço do Adrian
      if (typeof isAvailable === "boolean") {
        setBarberOff("barbeiro-adrian", targetDate, !isAvailable);
        await setBarberOffDB("barbeiro-adrian", targetDate, !isAvailable);
      }
      if (lunchBreakTime !== undefined) {
        const scope = lunchBreakScope === "date" ? "date" : "default";
        await setBarberLunchBreakTimeDB("barbeiro-adrian", targetDate, lunchBreakTime || null, scope);
      }
    } else {
      // Dono gerenciando o estúdio e sua própria agenda
      if (typeof isAvailable === "boolean") {
        await setDateClosedDB(targetDate, !isAvailable);
      }

      if (earlyClosingTime !== undefined) {
        await setEarlyClosingTimeDB(targetDate, earlyClosingTime || null);
      }

      if (lunchBreakTime !== undefined) {
        const scope = lunchBreakScope === "date" ? "date" : "default";
        await setLunchBreakTimeDB(targetDate, lunchBreakTime || null, scope);
      }
    }

    const schedule = await getDayScheduleDB(targetDate);

    return NextResponse.json({
      success: true,
      barberId,
      date: targetDate,
      isAvailable: !schedule.isClosed,
      isDateClosed: schedule.isClosed,
      earlyClosingTime: schedule.earlyClosingTime,
      lunchBreakTime: schedule.lunchBreakTime,
      defaultLunchBreakTime: schedule.defaultLunchBreakTime,
      isLunchBreakFixed: schedule.isLunchBreakFixed,
      hasLunchDateOverride: schedule.hasLunchDateOverride,
      lunchBreakSlots: schedule.lunchBreakSlots,
      message: schedule.isClosed
        ? `Studio marcado como FECHADO para o dia ${targetDate.split("-").reverse().join("/")}. Os demais dias permanecem normais.`
        : `Escala do Studio atualizada com sucesso em ${targetDate.split("-").reverse().join("/")}.`,
    });
  } catch (error) {
    console.error("Erro ao atualizar escala do studio:", error);
    return NextResponse.json({ error: "Erro ao atualizar status do barbeiro" }, { status: 500 });
  }
}
