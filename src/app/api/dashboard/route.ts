import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BARBERS, getBarberById } from '@/lib/barbers';
import { 
  getAppointmentsForDate, 
  getAllStoredAppointments, 
  updateStoredAppointmentStatus, 
  updateStoredAppointment,
  getStoredAppointmentById,
  getLocalDateString 
} from '@/lib/appointments-store';
import { parseBrazilDateTime } from '@/lib/timezone';
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
        if (!map.has(a.id)) map.set(a.id, a);
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

    // CÁLCULO MENSAL INDIVIDUALIZADO (PRODUÇÃO BRUTA, LÍQUIDA, DESPESAS E LUCRO DO MÊS)
    const monthParam = (searchParams.get("month") || dateParam.slice(0, 7));
    const [mYear, mMonth] = monthParam.split("-").map(Number);
    const lastDayOfMonth = new Date(mYear, mMonth, 0).getDate();
    const startOfMonth = new Date(`${monthParam}-01T00:00:00-03:00`);
    const endOfMonth = new Date(`${monthParam}-${String(lastDayOfMonth).padStart(2, "0")}T23:59:59-03:00`);

    let monthCompletedApts: any[] = [];
    let monthExpensesList: ReturnType<typeof parseExpenseRecord>[] = [];

    try {
      const dbMonthApts = await prisma.appointment.findMany({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
          status: "COMPLETED",
        },
        include: { service: true },
      });

      const memMonthApts = getAllStoredAppointments().filter((a: any) => {
        if (a.status !== "COMPLETED") return false;
        const d = new Date(a.date);
        return d >= startOfMonth && d <= endOfMonth;
      });

      const monthMap = new Map<string, any>();
      (dbMonthApts || []).forEach((a: any) => monthMap.set(a.id, a));
      (memMonthApts || []).forEach((a: any) => {
        if (!monthMap.has(a.id)) monthMap.set(a.id, a);
      });
      monthCompletedApts = Array.from(monthMap.values()).filter(
        (a: any) => !a.id?.includes("almir") && !a.user?.name?.toLowerCase().includes("almir")
      );

      const dbMonthExpenses = await prisma.expense.findMany({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      });
      monthExpensesList = (dbMonthExpenses || []).map(parseExpenseRecord);
    } catch (_) {
      monthCompletedApts = getAllStoredAppointments().filter((a: any) => {
        if (a.status !== "COMPLETED") return false;
        const d = new Date(a.date);
        return d >= startOfMonth && d <= endOfMonth && !a.id?.includes("almir") && !a.user?.name?.toLowerCase().includes("almir");
      });
    }

    const noahMonthApts = monthCompletedApts.filter(
      (apt) => apt.barberId === "barbeiro-noah" || apt.barberId === "barbeiro-dono" || !apt.barberId
    );
    const adrianMonthApts = monthCompletedApts.filter((apt) => apt.barberId === "barbeiro-adrian");

    const noahMonthGross = Math.round(noahMonthApts.reduce((acc, a) => acc + (a.service?.price || 0), 0) * 100) / 100;
    const adrianMonthGross = Math.round(adrianMonthApts.reduce((acc, a) => acc + (a.service?.price || 0), 0) * 100) / 100;
    const adrianMonthCommission = Math.round(adrianMonthGross * ADRIAN_RATE * 100) / 100;
    const adrianMonthHouseShare = Math.round(adrianMonthGross * OWNER_RATE * 100) / 100;

    const studioMonthExpenses = Math.round(
      monthExpensesList
        .filter((e) => e.barberId !== "barbeiro-adrian")
        .reduce((acc, e) => acc + e.amount, 0) * 100
    ) / 100;
    const adrianMonthVales = Math.round(
      monthExpensesList
        .filter((e) => e.barberId === "barbeiro-adrian")
        .reduce((acc, e) => acc + e.amount, 0) * 100
    ) / 100;

    const studioMonthGross = Math.round((noahMonthGross + adrianMonthGross) * 100) / 100;
    const noahMonthNetProduction = Math.round((noahMonthGross + adrianMonthHouseShare) * 100) / 100;
    const studioMonthNetProfit = Math.round((noahMonthNetProduction - studioMonthExpenses) * 100) / 100;
    const noahOwnNetProfit = Math.round((noahMonthGross - studioMonthExpenses) * 100) / 100;
    const adrianMonthNetProfit = Math.round((adrianMonthCommission - adrianMonthVales) * 100) / 100;

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
          grossRevenue: adrianMonthGross,
          netProduction: adrianMonthCommission,
          expenses: adrianMonthVales,
          netProfit: adrianMonthNetProfit,
          completedCount: adrianMonthApts.length,
          ticketMedio: adrianMonthApts.length > 0 ? adrianMonthGross / adrianMonthApts.length : 0,
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

      // Resumo Mensal Completo do Dono + Individualizado (Noah & Adrian)
      monthlySummary: {
        month: monthParam,
        studioGross: studioMonthGross,
        noahNetProduction: noahMonthNetProduction,
        studioExpenses: studioMonthExpenses,
        studioNetProfit: studioMonthNetProfit,
        totalCompletedCount: monthCompletedApts.length,
        noah: {
          gross: noahMonthGross,
          netProduction: noahMonthGross,
          ownPlusHouseShare: noahMonthNetProduction,
          expenses: studioMonthExpenses,
          netProfit: noahOwnNetProfit,
          completedCount: noahMonthApts.length,
          ticketMedio: noahMonthApts.length > 0 ? noahMonthGross / noahMonthApts.length : 0,
        },
        adrian: {
          gross: adrianMonthGross,
          commission: adrianMonthCommission,
          houseShare: adrianMonthHouseShare,
          vales: adrianMonthVales,
          netProfit: adrianMonthNetProfit,
          completedCount: adrianMonthApts.length,
          ticketMedio: adrianMonthApts.length > 0 ? adrianMonthGross / adrianMonthApts.length : 0,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar dados do dashboard" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, date, time, serviceId, action } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do agendamento é obrigatório" }, { status: 400 });
    }

    if (action === "APPROVE_RESCHEDULE") {
      let currentApt: any = null;
      try {
        currentApt = await prisma.appointment.findUnique({ where: { id } });
      } catch (_) {
        currentApt = getStoredAppointmentById(id);
      }

      if (!currentApt || !currentApt.requestedDate) {
        return NextResponse.json({ error: "Nenhuma solicitação de reagendamento encontrada." }, { status: 400 });
      }

      const newDate = new Date(currentApt.requestedDate);

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
      try {
        const updated = await prisma.appointment.update({
          where: { id },
          data: {
            date: parsedNewDate,
            ...(serviceId ? { serviceId } : {}),
            status: status || "CONFIRMED",
          } as any,
        });
        updateStoredAppointment(id, {
          date: parsedNewDate.toISOString(),
          status: status || "CONFIRMED",
        });
        return NextResponse.json({ success: true, appointment: updated });
      } catch (dbErr) {
        updateStoredAppointment(id, {
          date: parsedNewDate.toISOString(),
          status: status || "CONFIRMED",
        });
        return NextResponse.json({ success: true, message: "Agendamento alterado com sucesso." });
      }
    }

    if (status) {
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
