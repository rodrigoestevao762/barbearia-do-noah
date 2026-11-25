"use server"

import prisma from "@/lib/prisma";
import { BARBERS, BARBER_COMMISSION_RATE, HOUSE_COMMISSION_RATE } from "@/lib/barbers";
import { 
  getAppointmentsForDate, 
  getStoredClosingsForDate, 
  addStoredClosing,
  getLocalDateString 
} from "@/lib/appointments-store";

export async function getFechamentoData(dateStr?: string) {
  try {
    const targetDateStr = dateStr || getLocalDateString();
    const start = new Date(`${targetDateStr}T00:00:00-03:00`);
    const end = new Date(`${targetDateStr}T23:59:59.999-03:00`);

    let appointments: any[] = [];
    let closings: any[] = [];

    try {
      appointments = await prisma.appointment.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
          status: "COMPLETED",
        },
        include: {
          service: true,
          barber: true,
        }
      });

      closings = await prisma.cashClosing.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (dbErr) {
      const storedApts = getAppointmentsForDate(targetDateStr, null);
      appointments = storedApts.filter(a => a.status === "COMPLETED" || a.status === "CONFIRMED");
      closings = getStoredClosingsForDate(targetDateStr);
    }

    let totalRevenue = 0;

    // Detalhamento individual por profissional (55% Noah Dono / 45% Adrian Funcionário)
    const barberRevenues = BARBERS.map((barber) => {
      const bApts = appointments.filter((app) => {
        if (barber.isOwner) {
          return app.barberId === barber.id || app.barberId === "barbeiro-dono" || !app.barberId;
        }
        return app.barberId === barber.id;
      });

      const total = bApts.reduce((acc, app) => acc + (app.service?.price || 0), 0);
      totalRevenue += total;

      const rate = barber.isOwner ? 0.55 : 0.45;
      const commission = Math.round(total * rate * 100) / 100;
      const ownerShare = barber.isOwner 
        ? total 
        : Math.round(total * 0.55 * 100) / 100;

      return {
        id: barber.id,
        name: barber.name,
        role: barber.isOwner ? "Proprietário da Barbearia" : "Barbeiro da Equipe",
        avatar: barber.avatar,
        total,
        commission,
        houseShare: ownerShare,
        rate,
        isOwner: Boolean(barber.isOwner),
        aptsCount: bApts.length,
      };
    });

    const adrianBarber = barberRevenues.find(b => !b.isOwner);
    const noahBarber = barberRevenues.find(b => b.isOwner);

    // Adrian recebe 45% de seus atendimentos
    const totalCommissions = adrianBarber ? adrianBarber.commission : Math.round(totalRevenue * 0.45 * 100) / 100;
    // Noah (Dono) fica com sua produção + 55% dos atendimentos de Adrian
    const noahTotalReceita = (noahBarber ? noahBarber.total : 0) + (adrianBarber ? (adrianBarber.total * 0.55) : 0);
    const houseShare = Math.round(noahTotalReceita * 100) / 100;

    const sanitizedClosings = closings.map((c: any) => ({
      ...c,
      closedBy: (!c.closedBy || c.closedBy.includes("Bastos") || c.closedBy.includes("Mr."))
        ? "Noah Ferreira (Dono)"
        : c.closedBy,
    }));

    return {
      success: true as const,
      data: {
        totalRevenue,
        totalCommissions,
        houseShare,
        commissionRate: BARBER_COMMISSION_RATE,
        houseRate: HOUSE_COMMISSION_RATE,
        barberRevenues,
        closings: sanitizedClosings
      }
    };
  } catch (error: unknown) {
    console.error("Action error:", error);
    const targetDateStr = dateStr || getLocalDateString();
    const storedApts = getAppointmentsForDate(targetDateStr, null);
    const completedApts = storedApts.filter(a => a.status === "COMPLETED" || a.status === "CONFIRMED");
    const rawClosings = getStoredClosingsForDate(targetDateStr);

    let totalRevenue = 0;
    const barberRevenues = BARBERS.map((barber) => {
      const bApts = completedApts.filter((app) => {
        if (barber.isOwner) {
          return app.barberId === barber.id || app.barberId === "barbeiro-dono" || !app.barberId;
        }
        return app.barberId === barber.id;
      });

      const total = bApts.reduce((acc, app) => acc + (app.service?.price || 0), 0);
      const rate = barber.isOwner ? 0.55 : 0.45;
      const commission = Math.round(total * rate * 100) / 100;
      const houseShare = barber.isOwner ? total : Math.round(total * 0.55 * 100) / 100;
      totalRevenue += total;

      return {
        id: barber.id,
        name: barber.name,
        role: barber.role,
        avatar: barber.avatar,
        total,
        commission,
        houseShare,
        rate,
        isOwner: Boolean(barber.isOwner),
        aptsCount: bApts.length,
      };
    });

    const adrianFallback = barberRevenues.find(b => !b.isOwner);
    const noahFallback = barberRevenues.find(b => b.isOwner);
    const totalCommissions = adrianFallback ? adrianFallback.commission : Math.round(totalRevenue * 0.45 * 100) / 100;
    const houseShare = Math.round(((noahFallback ? noahFallback.total : 0) + (adrianFallback ? adrianFallback.total * 0.55 : 0)) * 100) / 100;

    const sanitizedClosings = rawClosings.map((c: any) => ({
      ...c,
      closedBy: (!c.closedBy || c.closedBy.includes("Bastos") || c.closedBy.includes("Mr."))
        ? "Noah Ferreira (Dono)"
        : c.closedBy,
    }));

    return {
      success: true as const,
      data: {
        totalRevenue,
        totalCommissions,
        houseShare,
        commissionRate: BARBER_COMMISSION_RATE,
        houseRate: HOUSE_COMMISSION_RATE,
        barberRevenues,
        closings: sanitizedClosings
      }
    };
  }
}

export async function closeCashRegister(data: { totalRevenue: number, barberRevenues: string, closedBy: string, dateStr: string }) {
  try {
    const closingDate = new Date(`${data.dateStr}T23:59:59-03:00`);

    try {
      const closing = await prisma.cashClosing.create({
        data: {
          date: closingDate,
          totalRevenue: data.totalRevenue,
          totalExpenses: 0,
          barberRevenues: data.barberRevenues,
          closedBy: data.closedBy,
        }
      });
      return { success: true, data: closing };
    } catch (dbErr) {
      const storedClosing = addStoredClosing({
        id: `closing-${Date.now()}`,
        date: closingDate.toISOString(),
        totalRevenue: data.totalRevenue,
        totalExpenses: 0,
        barberRevenues: data.barberRevenues,
        closedBy: data.closedBy,
        createdAt: new Date().toISOString(),
      });
      return { success: true, data: storedClosing };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
