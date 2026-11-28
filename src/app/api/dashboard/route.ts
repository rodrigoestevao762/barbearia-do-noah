import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BARBERS, getBarberById } from '@/lib/barbers';
import { OFFICIAL_SERVICES } from '@/lib/services';
import { 
  getAppointmentsForDate, 
  getAllStoredAppointments, 
  updateStoredAppointmentStatus, 
  updateStoredAppointment,
  getStoredAppointmentById,
  getLocalDateString 
} from '@/lib/appointments-store';
import { parseBrazilDateTime, getBrazilDateAndTimeString } from '@/lib/timezone';
import { parseExpenseRecord } from '@/lib/expenses';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Acesso não autorizado. Faça login para continuar." }, { status: 401 });
    }

    const userRole = (session.user as any)?.role || "CLIENT";
    const userBarberId = (session.user as any)?.barberId;
    const userId = (session.user as any)?.id;

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date") || getLocalDateString();
    const barberFilterParam = searchParams.get("barberId") || "all";

    // 1. FLUXO DO CLIENTE
    if (userRole === "CLIENT") {
      const userEmail = session?.user?.email?.trim().toLowerCase();
      const userPhone = (session?.user as any)?.phone?.replace(/\D/g, "");

      try {
        const clientUser: any = await prisma.user.findFirst({
          where: {
            OR: [
              ...(userId ? [{ id: userId }] : []),
              ...(userEmail ? [{ email: { equals: userEmail, mode: "insensitive" as const } }] : []),
              ...(userPhone ? [
                { phone: userPhone },
                { phone: userPhone.startsWith("55") ? userPhone.slice(2) : `55${userPhone}` },
              ] : []),
            ],
          },
          include: {
            appointments: {
              include: { service: true, barber: true },
              orderBy: { date: "desc" },
            },
          },
        });

        const dbApts: any[] = clientUser?.appointments || [];

        const memApts: any[] = getAllStoredAppointments().filter(
          (a: any) =>
            (clientUser && a.user?.id === clientUser.id) ||
            (userId && a.user?.id === userId) ||
            (userEmail && a.user?.email?.toLowerCase() === userEmail) ||
            (userPhone && a.user?.phone?.replace(/\D/g, "").includes(userPhone)) ||
            (userPhone && a.user?.phone && userPhone.includes(a.user.phone.replace(/\D/g, "")))
        );

        const map = new Map<string, any>();
        dbApts.forEach((a: any) => map.set(a.id, a));
        memApts.forEach((a: any) => {
          if (!map.has(a.id)) map.set(a.id, a);
        });

        const appointments = Array.from(map.values())
          .filter((a) => !a.id?.includes("almir") && !a.user?.name?.toLowerCase().includes("almir"))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const effectiveClient = {
          id: clientUser?.id || userId || "client-id",
          name: clientUser?.name || session?.user?.name || "Cliente VIP",
          email: clientUser?.email || session?.user?.email || "",
          phone: clientUser?.phone || (session?.user as any)?.phone || "",
        };

        return NextResponse.json({
          isClient: true,
          client: effectiveClient,
          appointments,
        });
      } catch (dbErr) {
        const allApts = getAllStoredAppointments();
        const clientApts = allApts.filter(
          (a) =>
            (userId && a.user?.id === userId) ||
            (userEmail && a.user?.email?.toLowerCase() === userEmail) ||
            (userPhone && a.user?.phone?.replace(/\D/g, "").includes(userPhone)) ||
            (userPhone && a.user?.phone && userPhone.includes(a.user.phone.replace(/\D/g, "")))
        ).filter((a) => !a.id?.includes("almir") && !a.user?.name?.toLowerCase().includes("almir"));

        return NextResponse.json({
          isClient: true,
          client: {
            id: userId || "client-fallback",
            name: session?.user?.name || "Cliente VIP",
            email: session?.user?.email || "",
            phone: (session?.user as any)?.phone || "",
          },
          appointments: clientApts,
        });
      }
    }

    // 2. FLUXO DO DONO / ADMINISTRADOR (NOAH BARBER STUDIO - 100% STUDIO)
    const startOfDay = new Date(`${dateParam}T00:00:00-03:00`);
    const endOfDay = new Date(`${dateParam}T23:59:59-03:00`);

    let allDayAppointments: any[] = [];
    let upcomingAppointments: any[] = [];

    try {
      const dbAppointments = await prisma.appointment.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
        },
        include: { service: true, user: true, barber: true },
        orderBy: { date: "asc" },
      });

      const memAppointments = getAppointmentsForDate(dateParam, null);
      
      const map = new Map<string, any>();
      (dbAppointments || []).forEach((a) => map.set(a.id, a));
      (memAppointments || []).forEach((a) => {
        const existing = map.get(a.id);
        if (!existing) {
          map.set(a.id, a);
        } else if (a.requestedDate && !existing.requestedDate) {
          map.set(a.id, { ...existing, requestedDate: a.requestedDate });
        }
      });
      allDayAppointments = Array.from(map.values()).filter(
        (a) => !a.id?.includes("almir") && !a.user?.name?.toLowerCase().includes("almir")
      );

      upcomingAppointments = await prisma.appointment.findMany({
        where: {
          date: { gte: new Date() },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        include: { service: true, user: true, barber: true },
        orderBy: { date: "asc" },
        take: 10,
      });

    } catch (dbErr) {
      allDayAppointments = getAppointmentsForDate(dateParam, null).filter(
        (a) => !a.id?.includes("almir") && !a.user?.name?.toLowerCase().includes("almir")
      );
    }

    // Garante que agendamentos confirmados em memória também alimentem os próximos agendamentos (merge completo)
    const memAll = getAllStoredAppointments();
    const minTimestamp = Date.now() - 30 * 60 * 1000;
    const memUpcoming = memAll
      .filter((a) => 
        (a.status === 'PENDING' || a.status === 'CONFIRMED') && 
        new Date(a.date).getTime() >= minTimestamp &&
        !a.id?.includes('almir') && 
        !a.user?.name?.toLowerCase().includes('almir')
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const upcomingMap = new Map<string, any>();
    (upcomingAppointments || []).forEach((a: any) => upcomingMap.set(a.id, a));
    memUpcoming.forEach((a: any) => {
      if (!upcomingMap.has(a.id)) upcomingMap.set(a.id, a);
    });
    upcomingAppointments = Array.from(upcomingMap.values())
      .filter((a: any) => !a.id?.includes('almir') && !a.user?.name?.toLowerCase().includes('almir'))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 20);

    // Modelo de Comissionamento Noah Barber Studio: 55% Noah (Dono) / 45% Adrian (Funcionário)
    const ADRIAN_RATE = 0.45;
    const OWNER_RATE = 0.55;

    // Detalhamento individual por barbeiro (Noah Ferreira & Adrian Santos)
    const breakdown = BARBERS.map((barber) => {
      const barberApts = allDayAppointments.filter((apt) => {
        if (barber.isOwner) {
          return apt.barberId === barber.id || apt.barberId === "barbeiro-dono" || !apt.barberId;
        }
        return apt.barberId === barber.id;
      });

      const completed = barberApts.filter((apt) => apt.status === "COMPLETED");
      const revenue = completed.reduce((acc, apt) => acc + (apt.service?.price || 0), 0);
      const rate = barber.isOwner ? OWNER_RATE : ADRIAN_RATE;
      const commission = Math.round(revenue * rate * 100) / 100;
      const houseShare = barber.isOwner ? revenue : Math.round(revenue * OWNER_RATE * 100) / 100;

      return {
        id: barber.id,
        name: barber.name,
        role: barber.isOwner ? "Proprietário da Barbearia" : "Barbeiro da Equipe",
        avatar: barber.avatar,
        phone: barber.phone,
        phoneDisplay: barber.phoneDisplay,
        commissionRate: rate,
        isOwner: Boolean(barber.isOwner),
        totalApts: barberApts.length,
        completedApts: completed.length,
        revenue,
        commission,
        houseShare,
      };
    });

    // Faturamento e Repasses Totais do Estúdio
    const allCompleted = allDayAppointments.filter((apt) => apt.status === "COMPLETED");
    const totalGrossShop = allCompleted.reduce((acc, apt) => acc + (apt.service?.price || 0), 0);
    const adrianBreakdownItem = breakdown.find((b) => !b.isOwner) || { revenue: 0, commission: 0, completedApts: 0, totalApts: 0 };
    const noahBreakdownItem = breakdown.find((b) => b.isOwner) || { revenue: 0, commission: 0, completedApts: 0, totalApts: 0 };
    const totalCommissionsToPay = adrianBreakdownItem.commission;
    const houseNetProfit = (noahBreakdownItem ? noahBreakdownItem.revenue : 0) + (adrianBreakdownItem ? (adrianBreakdownItem.revenue * OWNER_RATE) : 0);
    const ticketMedio = allCompleted.length > 0 ? totalGrossShop / allCompleted.length : 0;

    const userEmail = session.user.email?.toLowerCase();
    const isOwner = userRole === "ADMIN" && userEmail !== "adriansantos@gmail.com";
    const isAdrian = userRole === "BARBER" || userEmail === "adriansantos@gmail.com" || userBarberId === "barbeiro-adrian";

    // CÁLCULO MENSAL COMPLETO + DIA A DIA (PRODUÇÃO BRUTA, PREVISTO, DESPESAS POR CATEGORIA E LUCRO ACUMULADO)
    const monthParam = (searchParams.get("month") || dateParam.slice(0, 7));
    const [mYear, mMonth] = monthParam.split("-").map(Number);
    const lastDayOfMonth = new Date(mYear, mMonth, 0).getDate();
    const startOfMonth = new Date(`${monthParam}-01T00:00:00-03:00`);
    const endOfMonth = new Date(`${monthParam}-${String(lastDayOfMonth).padStart(2, "0")}T23:59:59-03:00`);

    let monthAllApts: any[] = [];
    let monthExpensesList: ReturnType<typeof parseExpenseRecord>[] = [];

    try {
      const dbMonthApts = await prisma.appointment.findMany({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
          status: { in: ["COMPLETED", "CONFIRMED", "PENDING", "RESCHEDULE_REQUESTED"] },
        },
        include: { service: true },
      });

      const memMonthApts = getAllStoredAppointments().filter((a: any) => {
        if (!["COMPLETED", "CONFIRMED", "PENDING", "RESCHEDULE_REQUESTED"].includes(a.status)) return false;
        const d = new Date(a.date);
        return d >= startOfMonth && d <= endOfMonth;
      });

      const monthMap = new Map<string, any>();
      (dbMonthApts || []).forEach((a: any) => monthMap.set(a.id, a));
      (memMonthApts || []).forEach((a: any) => {
        if (!monthMap.has(a.id)) monthMap.set(a.id, a);
      });
      monthAllApts = Array.from(monthMap.values()).filter(
        (a: any) => !a.id?.includes("almir") && !a.user?.name?.toLowerCase().includes("almir")
      );

      const dbMonthExpenses = await prisma.expense.findMany({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        orderBy: { date: "desc" },
      });
      monthExpensesList = (dbMonthExpenses || []).map(parseExpenseRecord);
    } catch (_) {
      monthAllApts = getAllStoredAppointments().filter((a: any) => {
        if (!["COMPLETED", "CONFIRMED", "PENDING", "RESCHEDULE_REQUESTED"].includes(a.status)) return false;
        const d = new Date(a.date);
        return d >= startOfMonth && d <= endOfMonth && !a.id?.includes("almir") && !a.user?.name?.toLowerCase().includes("almir");
      });
    }

    const monthCompletedApts = monthAllApts.filter((a: any) => a.status === "COMPLETED");
    const monthScheduledApts = monthAllApts.filter((a: any) => a.status !== "COMPLETED");

    const isNoahApt = (apt: any) => apt.barberId === "barbeiro-noah" || apt.barberId === "barbeiro-dono" || !apt.barberId;
    const isAdrianApt = (apt: any) => apt.barberId === "barbeiro-adrian";

    const noahMonthApts = monthCompletedApts.filter(isNoahApt);
    const adrianMonthApts = monthCompletedApts.filter(isAdrianApt);
    const noahScheduledApts = monthScheduledApts.filter(isNoahApt);
    const adrianScheduledApts = monthScheduledApts.filter(isAdrianApt);

    const round2 = (n: number) => Math.round(n * 100) / 100;

    const noahMonthGross = round2(noahMonthApts.reduce((acc, a) => acc + (a.service?.price || 0), 0));
    const adrianMonthGross = round2(adrianMonthApts.reduce((acc, a) => acc + (a.service?.price || 0), 0));
    const adrianMonthCommission = round2(adrianMonthGross * ADRIAN_RATE);
    const adrianMonthHouseShare = round2(adrianMonthGross * OWNER_RATE);

    const noahMonthExpected = round2(noahScheduledApts.reduce((acc, a) => acc + (a.service?.price || 0), 0));
    const adrianMonthExpected = round2(adrianScheduledApts.reduce((acc, a) => acc + (a.service?.price || 0), 0));
    const adrianMonthExpectedCommission = round2(adrianMonthExpected * ADRIAN_RATE);
    const studioMonthExpected = round2(noahMonthExpected + adrianMonthExpected);
    const noahMonthExpectedNet = round2(noahMonthExpected + adrianMonthExpected * OWNER_RATE);

    const studioMonthExpensesList = monthExpensesList.filter((e) => e.barberId !== "barbeiro-adrian");
    const adrianMonthValesList = monthExpensesList.filter((e) => e.barberId === "barbeiro-adrian");

    const sumCategories = (list: ReturnType<typeof parseExpenseRecord>[]) => ({
      INSUMOS: round2(list.filter((e) => e.category === "INSUMOS").reduce((a, e) => a + e.amount, 0)),
      FIXA: round2(list.filter((e) => e.category === "FIXA").reduce((a, e) => a + e.amount, 0)),
      VALE: round2(list.filter((e) => e.category === "VALE").reduce((a, e) => a + e.amount, 0)),
      OUTROS: round2(list.filter((e) => e.category === "OUTROS").reduce((a, e) => a + e.amount, 0)),
    });

    const studioExpensesByCategory = sumCategories(studioMonthExpensesList);
    const adrianExpensesByCategory = sumCategories(adrianMonthValesList);

    const studioMonthExpenses = round2(studioMonthExpensesList.reduce((acc, e) => acc + e.amount, 0));
    const adrianMonthVales = round2(adrianMonthValesList.reduce((acc, e) => acc + e.amount, 0));

    const studioMonthGross = round2(noahMonthGross + adrianMonthGross);
    const noahMonthNetProduction = round2(noahMonthGross + adrianMonthHouseShare);
    const studioMonthNetProfit = round2(noahMonthNetProduction - studioMonthExpenses);
    const noahOwnNetProfit = round2(noahMonthGross - studioMonthExpenses);
    const adrianMonthNetProfit = round2(adrianMonthCommission - adrianMonthVales);

    // Construção do Faturamento Dia a Dia (01 até o último dia do mês com acumulado)
    const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const aptsByDay = new Map<string, any[]>();
    monthAllApts.forEach((apt: any) => {
      const dStr = getBrazilDateAndTimeString(apt.date).date;
      if (!aptsByDay.has(dStr)) aptsByDay.set(dStr, []);
      aptsByDay.get(dStr)!.push(apt);
    });

    const expensesByDay = new Map<string, ReturnType<typeof parseExpenseRecord>[]>();
    monthExpensesList.forEach((exp) => {
      const dStr = getBrazilDateAndTimeString(exp.date).date;
      if (!expensesByDay.has(dStr)) expensesByDay.set(dStr, []);
      expensesByDay.get(dStr)!.push(exp);
    });

    let accStudioGross = 0;
    let accStudioNet = 0;
    let accNoahGross = 0;
    let accNoahNet = 0;
    let accAdrianGross = 0;
    let accAdrianNet = 0;

    const fullDailyBreakdown = Array.from({ length: lastDayOfMonth }, (_, idx) => {
      const dayNum = idx + 1;
      const dayPadded = String(dayNum).padStart(2, "0");
      const dateStr = `${monthParam}-${dayPadded}`;
      const weekday = WEEKDAYS_PT[new Date(`${dateStr}T12:00:00-03:00`).getDay()];

      const dayApts = aptsByDay.get(dateStr) || [];
      const dayExps = expensesByDay.get(dateStr) || [];

      const comp = dayApts.filter((a: any) => a.status === "COMPLETED");
      const sched = dayApts.filter((a: any) => a.status !== "COMPLETED");

      const nComp = comp.filter(isNoahApt);
      const aComp = comp.filter(isAdrianApt);
      const nSched = sched.filter(isNoahApt);
      const aSched = sched.filter(isAdrianApt);

      const nGross = round2(nComp.reduce((acc, a) => acc + (a.service?.price || 0), 0));
      const aGross = round2(aComp.reduce((acc, a) => acc + (a.service?.price || 0), 0));
      const aComm = round2(aGross * ADRIAN_RATE);
      const aHouse = round2(aGross * OWNER_RATE);

      const nExp = round2(nSched.reduce((acc, a) => acc + (a.service?.price || 0), 0));
      const aExp = round2(aSched.reduce((acc, a) => acc + (a.service?.price || 0), 0));

      const sOutflows = round2(dayExps.filter((e) => e.barberId !== "barbeiro-adrian").reduce((acc, e) => acc + e.amount, 0));
      const aVales = round2(dayExps.filter((e) => e.barberId === "barbeiro-adrian").reduce((acc, e) => acc + e.amount, 0));

      const sGross = round2(nGross + aGross);
      const nProd = round2(nGross + aHouse);
      const sNet = round2(nProd - sOutflows);
      const nNet = round2(nProd - sOutflows);
      const aNet = round2(aComm - aVales);

      accStudioGross = round2(accStudioGross + sGross);
      accStudioNet = round2(accStudioNet + sNet);
      accNoahGross = round2(accNoahGross + nGross);
      accNoahNet = round2(accNoahNet + nNet);
      accAdrianGross = round2(accAdrianGross + aGross);
      accAdrianNet = round2(accAdrianNet + aNet);

      return {
        date: dateStr,
        day: dayNum,
        dayStr: `${dayPadded}/${String(mMonth).padStart(2, "0")}`,
        weekday,
        studio: {
          gross: sGross,
          expected: round2(nExp + aExp),
          adrianCommission: aComm,
          noahProduction: nProd,
          expenses: sOutflows,
          net: sNet,
          grossAccumulated: accStudioGross,
          netAccumulated: accStudioNet,
          completedCount: comp.length,
          scheduledCount: sched.length,
        },
        noah: {
          gross: nGross,
          expected: nExp,
          houseShareFromAdrian: aHouse,
          netProduction: nProd,
          expenses: sOutflows,
          net: nNet,
          grossAccumulated: accNoahGross,
          netAccumulated: accNoahNet,
          completedCount: nComp.length,
          scheduledCount: nSched.length,
        },
        adrian: {
          gross: aGross,
          expected: aExp,
          expectedCommission: round2(aExp * ADRIAN_RATE),
          commission: aComm,
          vales: aVales,
          net: aNet,
          grossAccumulated: accAdrianGross,
          netAccumulated: accAdrianNet,
          completedCount: aComp.length,
          scheduledCount: aSched.length,
        },
      };
    });

    // PROTEÇÃO ESTREITA DE PRIVACIDADE:
    // Se o usuário for o funcionário Adrian Santos:
    // - NUNCA expor faturamento bruto total do estúdio
    // - NUNCA expor faturamento ou atendimentos do Noah Ferreira (Dono)
    // - NUNCA expor lucro ou conta da casa (55%)
    // - Retornar APENAS a produção de Adrian e a comissão de Adrian (45%)
    if (isAdrian) {
      const adrianApts = allDayAppointments.filter((apt) => apt.barberId === "barbeiro-adrian");
      const adrianUpcoming = upcomingAppointments.filter((apt) => apt.barberId === "barbeiro-adrian");
      const adrianCompleted = adrianApts.filter((apt) => apt.status === "COMPLETED");
      const adrianRev = adrianCompleted.reduce((acc, apt) => acc + (apt.service?.price || 0), 0);
      const adrianComm = Math.round(adrianRev * ADRIAN_RATE * 100) / 100;
      const adrianTicket = adrianCompleted.length > 0 ? adrianRev / adrianCompleted.length : 0;

      const adrianOnlyBreakdown = [{
        id: "barbeiro-adrian",
        name: "Adrian Santos",
        role: "Barbeiro da Equipe",
        avatar: "/barbers/adrian-santos.jpg",
        commissionRate: ADRIAN_RATE,
        isOwner: false,
        totalApts: adrianApts.length,
        completedApts: adrianCompleted.length,
        revenue: adrianRev,
        commission: adrianComm,
        houseShare: 0,
      }];

      return NextResponse.json({
        isClient: false,
        isOwner: false,
        userRole: "BARBER",
        currentBarber: BARBERS.find((b) => b.id === "barbeiro-adrian") || BARBERS[1],
        activeFilter: "barbeiro-adrian",
        selectedDate: dateParam,

        // Apenas dados do Adrian (zero dados do Dono)
        revenue: adrianRev,
        totalGrossShop: adrianRev,
        houseNetProfit: 0,
        totalCommissionsToPay: adrianComm,
        totalEmployeeCommissions: adrianComm,
        myCommission: adrianComm,
        houseShare: 0,
        ticketMedio: adrianTicket,

        todayCount: adrianApts.length,
        completedCount: adrianCompleted.length,
        clientsCount: adrianApts.length,
        appointments: adrianApts,
        upcomingAppointments: adrianUpcoming,
        barberBreakdown: adrianOnlyBreakdown,
        barbersList: [BARBERS.find((b) => b.id === "barbeiro-adrian") || BARBERS[1]],

        // Resumo Mensal Exclusivo do Adrian
        monthlySummary: {
          month: monthParam,
          daysInMonth: lastDayOfMonth,
          grossRevenue: adrianMonthGross,
          expectedRevenue: adrianMonthExpected,
          expectedNetRevenue: adrianMonthExpectedCommission,
          netProduction: adrianMonthCommission,
          expenses: adrianMonthVales,
          netProfit: adrianMonthNetProfit,
          completedCount: adrianMonthApts.length,
          scheduledCount: adrianScheduledApts.length,
          ticketMedio: adrianMonthApts.length > 0 ? adrianMonthGross / adrianMonthApts.length : 0,
          expensesByCategory: adrianExpensesByCategory,
          expensesList: adrianMonthValesList,
          dailyBreakdown: fullDailyBreakdown.map((d) => ({
            date: d.date,
            day: d.day,
            dayStr: d.dayStr,
            weekday: d.weekday,
            gross: d.adrian.gross,
            expected: d.adrian.expected,
            expectedCommission: d.adrian.expectedCommission,
            netProduction: d.adrian.commission,
            expenses: d.adrian.vales,
            net: d.adrian.net,
            grossAccumulated: d.adrian.grossAccumulated,
            netAccumulated: d.adrian.netAccumulated,
            completedCount: d.adrian.completedCount,
            scheduledCount: d.adrian.scheduledCount,
          })),
        },
      });
    }

    // Filtro ativo para o Dono (Todos, Noah Ferreira, ou Adrian Santos)
    let displayAppointments = allDayAppointments;
    let displayUpcoming = upcomingAppointments;

    if (barberFilterParam !== "all") {
      const targetBarber = BARBERS.find((b) => b.id === barberFilterParam);
      if (targetBarber) {
        displayAppointments = allDayAppointments.filter((apt) => {
          if (targetBarber.isOwner) {
            return apt.barberId === targetBarber.id || apt.barberId === "barbeiro-dono" || !apt.barberId;
          }
          return apt.barberId === targetBarber.id;
        });

        displayUpcoming = upcomingAppointments.filter((apt) => {
          if (targetBarber.isOwner) {
            return apt.barberId === targetBarber.id || apt.barberId === "barbeiro-dono" || !apt.barberId;
          }
          return apt.barberId === targetBarber.id;
        });
      }
    }

    const currentBarber = BARBERS.find((b) => b.id === barberFilterParam) || BARBERS[0];

    return NextResponse.json({
      isClient: false,
      isOwner: true,
      userRole,
      currentBarber,
      activeFilter: barberFilterParam,
      selectedDate: dateParam,
      
      // Totais da Casa
      revenue: totalGrossShop,
      totalGrossShop,
      houseNetProfit,
      totalCommissionsToPay,
      totalEmployeeCommissions: totalCommissionsToPay,
      myCommission: currentBarber.isOwner ? totalCommissionsToPay : (breakdown.find(b => b.id === currentBarber.id)?.commission || 0),
      houseShare: houseNetProfit,
      ticketMedio,
      
      // Contadores e Listas
      todayCount: displayAppointments.length,
      completedCount: displayAppointments.filter((a) => a.status === "COMPLETED").length,
      clientsCount: displayAppointments.length,
      appointments: displayAppointments,
      upcomingAppointments: displayUpcoming,
      barberBreakdown: breakdown,
      barbersList: BARBERS,

      // Resumo Mensal Completo do Dono + Individualizado (Noah & Adrian) + Dia a Dia
      monthlySummary: {
        month: monthParam,
        daysInMonth: lastDayOfMonth,
        studioGross: studioMonthGross,
        studioExpected: studioMonthExpected,
        noahExpectedNet: noahMonthExpectedNet,
        noahNetProduction: noahMonthNetProduction,
        studioExpenses: studioMonthExpenses,
        studioNetProfit: studioMonthNetProfit,
        totalCompletedCount: monthCompletedApts.length,
        totalScheduledCount: monthScheduledApts.length,
        expensesByCategory: studioExpensesByCategory,
        expensesList: monthExpensesList,
        noah: {
          gross: noahMonthGross,
          expected: noahMonthExpected,
          netProduction: noahMonthGross,
          ownPlusHouseShare: noahMonthNetProduction,
          expenses: studioMonthExpenses,
          netProfit: noahOwnNetProfit,
          completedCount: noahMonthApts.length,
          scheduledCount: noahScheduledApts.length,
          ticketMedio: noahMonthApts.length > 0 ? noahMonthGross / noahMonthApts.length : 0,
        },
        adrian: {
          gross: adrianMonthGross,
          expected: adrianMonthExpected,
          expectedCommission: adrianMonthExpectedCommission,
          commission: adrianMonthCommission,
          houseShare: adrianMonthHouseShare,
          vales: adrianMonthVales,
          netProfit: adrianMonthNetProfit,
          completedCount: adrianMonthApts.length,
          scheduledCount: adrianScheduledApts.length,
          ticketMedio: adrianMonthApts.length > 0 ? adrianMonthGross / adrianMonthApts.length : 0,
          expensesByCategory: adrianExpensesByCategory,
        },
        dailyBreakdown: fullDailyBreakdown,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar dados do dashboard" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    const userRole = (session.user as any)?.role || "CLIENT";
    const userEmail = session.user.email?.toLowerCase();
    const userBarberId = (session.user as any)?.barberId;
    const isAdrian = userRole === "BARBER" || userEmail === "adriansantos@gmail.com" || userBarberId === "barbeiro-adrian";

    if (userRole !== "ADMIN" && userRole !== "BARBER") {
      return NextResponse.json({ error: "Permissão insuficiente." }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, date, time, serviceId, action, extraServiceId } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do agendamento é obrigatório" }, { status: 400 });
    }

    if (action === "ADD_EXTRA_SERVICE") {
      if (!extraServiceId) {
        return NextResponse.json({ error: "Selecione o serviço extra para adicionar." }, { status: 400 });
      }

      const extraService = OFFICIAL_SERVICES.find((s) => s.id === extraServiceId);
      if (!extraService) {
        return NextResponse.json({ error: "Serviço extra não encontrado." }, { status: 404 });
      }

      let dbApt: any = null;
      try {
        dbApt = await prisma.appointment.findUnique({
          where: { id },
          include: { service: true },
        });
      } catch (_) {}

      const storedApt = getStoredAppointmentById(id);
      const currentApt = dbApt || storedApt;

      if (!currentApt) {
        return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
      }

      if (isAdrian && currentApt.barberId !== "barbeiro-adrian") {
        return NextResponse.json(
          { error: "Você só pode alterar serviços dos seus próprios agendamentos." },
          { status: 403 }
        );
      }

      const baseName = currentApt.service?.name || storedApt?.service?.name || "Serviço";
      const basePrice = Number(currentApt.service?.price ?? storedApt?.service?.price ?? 0);
      const baseDuration = Number(currentApt.service?.duration ?? storedApt?.service?.duration ?? 30);

      const newName = `${baseName} + ${extraService.name}`;
      const newPrice = Math.round((basePrice + extraService.price) * 100) / 100;
      const newDuration = baseDuration + extraService.duration;
      const customServiceId = `extra-${id}`;

      const updatedServiceObj = {
        id: customServiceId,
        name: newName,
        price: newPrice,
        duration: newDuration,
      };

      updateStoredAppointment(id, { service: updatedServiceObj });

      try {
        if (dbApt) {
          await prisma.service.upsert({
            where: { id: customServiceId },
            create: {
              id: customServiceId,
              name: newName,
              description: `Atendimento com serviço extra (${extraService.name})`,
              price: newPrice,
              duration: newDuration,
            },
            update: {
              name: newName,
              description: `Atendimento com serviço extra (${extraService.name})`,
              price: newPrice,
              duration: newDuration,
            },
          });

          await prisma.appointment.update({
            where: { id },
            data: { serviceId: customServiceId },
          });
        }
      } catch (dbErr) {
        console.warn("Aviso ao salvar serviço extra no banco:", dbErr);
      }

      return NextResponse.json({
        success: true,
        service: updatedServiceObj,
        message: `Serviço extra "${extraService.name}" adicionado! Novo total: R$ ${newPrice.toFixed(2)}.`,
      });
    }

    if (action === "APPROVE_RESCHEDULE") {
      let currentApt: any = null;
      try {
        currentApt = await prisma.appointment.findUnique({ where: { id } });
      } catch (_) {}

      const storedApt = getStoredAppointmentById(id);
      const effectiveApt = currentApt || storedApt;
      if (isAdrian && effectiveApt && effectiveApt.barberId !== "barbeiro-adrian") {
        return NextResponse.json({ error: "Você só pode aprovar agendamentos da sua própria agenda." }, { status: 403 });
      }
      const effectiveRequestedDate = storedApt?.requestedDate || currentApt?.requestedDate || body.requestedDate;

      if (!currentApt && !storedApt) {
        return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
      }
      if (!effectiveRequestedDate) {
        return NextResponse.json({ error: "Nenhuma solicitação de reagendamento encontrada." }, { status: 400 });
      }

      const newDate = new Date(effectiveRequestedDate);

      try {
        const updated = await prisma.appointment.update({
          where: { id },
          data: {
            date: newDate,
            status: "CONFIRMED",
          } as any,
        });
        updateStoredAppointment(id, { status: "CONFIRMED", date: newDate.toISOString(), requestedDate: undefined });
        return NextResponse.json({ success: true, appointment: updated });
      } catch (dbErr) {
        updateStoredAppointment(id, { status: "CONFIRMED", date: newDate.toISOString(), requestedDate: undefined });
        return NextResponse.json({ success: true, message: "Reagendamento aprovado em contingência." });
      }
    }

    if (action === "REJECT_RESCHEDULE") {
      if (isAdrian) {
        let existingApt: any = getStoredAppointmentById(id);
        if (!existingApt) {
          try {
            existingApt = await prisma.appointment.findUnique({ where: { id } });
          } catch (_) {}
        }
        if (existingApt && existingApt.barberId !== "barbeiro-adrian") {
          return NextResponse.json({ error: "Você só pode alterar agendamentos da sua própria agenda." }, { status: 403 });
        }
      }
      try {
        const updated = await prisma.appointment.update({
          where: { id },
          data: {
            status: "CONFIRMED",
          } as any,
        });
        updateStoredAppointment(id, { status: "CONFIRMED", requestedDate: undefined });
        return NextResponse.json({ success: true, appointment: updated });
      } catch (dbErr) {
        updateStoredAppointment(id, { status: "CONFIRMED", requestedDate: undefined });
        return NextResponse.json({ success: true, message: "Reagendamento recusado." });
      }
    }

    if (date && time) {
      const parsedNewDate = parseBrazilDateTime(date, time);
      const targetBarberId = isAdrian ? "barbeiro-adrian" : body.barberId;
      try {
        const updated = await prisma.appointment.update({
          where: { id },
          data: {
            date: parsedNewDate,
            ...(serviceId ? { serviceId } : {}),
            ...(targetBarberId ? { barberId: targetBarberId } : {}),
            status: status || "CONFIRMED",
          } as any,
        });
        updateStoredAppointment(id, {
          date: parsedNewDate.toISOString(),
          ...(targetBarberId ? { barberId: targetBarberId } : {}),
          status: status || "CONFIRMED",
        });
        return NextResponse.json({ success: true, appointment: updated });
      } catch (dbErr) {
        updateStoredAppointment(id, {
          date: parsedNewDate.toISOString(),
          ...(targetBarberId ? { barberId: targetBarberId } : {}),
          status: status || "CONFIRMED",
        });
        return NextResponse.json({ success: true, message: "Agendamento alterado com sucesso." });
      }
    }

    if (status) {
      if (isAdrian) {
        let existingApt: any = getStoredAppointmentById(id);
        if (!existingApt) {
          try {
            existingApt = await prisma.appointment.findUnique({ where: { id } });
          } catch (_) {}
        }
        if (existingApt && existingApt.barberId !== "barbeiro-adrian") {
          return NextResponse.json({ error: "Você só pode alterar agendamentos da sua própria agenda." }, { status: 403 });
        }
      }
      try {
        const updated = await prisma.appointment.update({
          where: { id },
          data: { status },
        });
        updateStoredAppointmentStatus(id, status);
        return NextResponse.json({ success: true, appointment: updated });
      } catch (dbErr) {
        updateStoredAppointmentStatus(id, status);
        return NextResponse.json({ success: true, message: "Status atualizado." });
      }
    }

    return NextResponse.json({ error: "Ação não informada" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar agendamento" }, { status: 500 });
  }
}
