import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  encodeExpenseDescription,
  parseExpenseRecord,
  ExpenseCategory,
} from "@/lib/expenses";
import { getBrazilNow } from "@/lib/timezone";

export const dynamic = "force-dynamic";

function resolveUserAccess(session: any) {
  const userRole = (session?.user as any)?.role || "CLIENT";
  const userEmail = session?.user?.email?.toLowerCase();
  const userBarberId = (session?.user as any)?.barberId;
  const isAdrian =
    userRole === "BARBER" ||
    userEmail === "adriansantos@gmail.com" ||
    userBarberId === "barbeiro-adrian";
  const isAdmin = !isAdrian && userRole === "ADMIN";
  return { userRole, isAdrian, isAdmin };
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { userRole, isAdrian } = resolveUserAccess(session);
    if (!session || (userRole !== "ADMIN" && userRole !== "BARBER")) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month"); // YYYY-MM
    const dateParam = searchParams.get("date"); // YYYY-MM-DD

    let whereClause: any = {};

    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      whereClause.date = {
        gte: new Date(`${dateParam}T00:00:00-03:00`),
        lte: new Date(`${dateParam}T23:59:59-03:00`),
      };
    } else if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      whereClause.date = {
        gte: new Date(`${monthParam}-01T00:00:00-03:00`),
        lte: new Date(`${monthParam}-${String(lastDay).padStart(2, "0")}T23:59:59-03:00`),
      };
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    });

    const parsed = expenses.map(parseExpenseRecord);

    // Adrian só pode ver suas próprias despesas / vales
    const filtered = isAdrian
      ? parsed.filter((e) => e.barberId === "barbeiro-adrian")
      : parsed;

    return NextResponse.json(filtered, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (error) {
    console.error("Erro ao buscar despesas:", error);
    return NextResponse.json({ error: "Erro ao buscar despesas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { userRole, isAdrian } = resolveUserAccess(session);
    if (!session || (userRole !== "ADMIN" && userRole !== "BARBER")) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { description, amount, category, barberId, date } = body;

    const parsedAmount = parseFloat(String(amount));
    if (!description || !String(description).trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Descrição e valor válido são obrigatórios." }, { status: 400 });
    }

    const validCategories: ExpenseCategory[] = ["FIXA", "INSUMOS", "VALE", "OUTROS"];
    const safeCategory: ExpenseCategory = isAdrian
      ? category === "OUTROS"
        ? "OUTROS"
        : "VALE"
      : validCategories.includes(category)
      ? category
      : "OUTROS";

    const safeBarberId: "studio" | "barbeiro-noah" | "barbeiro-adrian" = isAdrian
      ? "barbeiro-adrian"
      : barberId === "barbeiro-adrian" || barberId === "barbeiro-noah"
      ? barberId
      : "studio";

    const targetDateStr =
      date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : getBrazilNow().date;

    const expense = await prisma.expense.create({
      data: {
        description: encodeExpenseDescription(String(description), safeCategory, safeBarberId),
        amount: Math.round(parsedAmount * 100) / 100,
        date: new Date(`${targetDateStr}T12:00:00-03:00`),
      },
    });

    return NextResponse.json({
      success: true,
      expense: parseExpenseRecord(expense),
    });
  } catch (error) {
    console.error("Erro ao criar despesa:", error);
    return NextResponse.json({ error: "Erro ao criar despesa" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { userRole, isAdrian } = resolveUserAccess(session);
    if (!session || (userRole !== "ADMIN" && userRole !== "BARBER")) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID da despesa é obrigatório." }, { status: 400 });
    }

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Despesa não encontrada." }, { status: 404 });
    }

    const parsed = parseExpenseRecord(existing);
    if (isAdrian && parsed.barberId !== "barbeiro-adrian") {
      return NextResponse.json(
        { error: "Você só pode excluir seus próprios registros." },
        { status: 403 }
      );
    }

    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir despesa:", error);
    return NextResponse.json({ error: "Erro ao excluir despesa" }, { status: 500 });
  }
}
