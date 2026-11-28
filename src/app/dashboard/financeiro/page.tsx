"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  X,
  Wallet,
  ArrowUpRight,
  Shield,
  Calendar,
  CheckCircle2,
  Trash2,
  Scissors,
  Receipt,
  Building,
  UserPlus,
  ArrowLeft,
} from "lucide-react";
import { BARBERS, BARBER_COMMISSION_RATE, HOUSE_COMMISSION_RATE } from "@/lib/barbers";
import { formatMonthLong, getBrazilNow } from "@/lib/timezone";
import WalkInModal from "@/components/WalkInModal";
import { CenterModalPortal } from "@/components/CenterModalPortal";
import { useSession } from "next-auth/react";

interface StoredExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: "FIXA" | "INSUMOS" | "VALE" | "OUTROS";
  barberId?: string;
  barberName?: string;
  date: string;
}

interface FixedExpenseItem {
  id: number;
  title: string;
  amount: number;
  category: string;
}

export default function FinanceiroPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "ADMIN";
  const userEmail = session?.user?.email?.toLowerCase();
  const userBarberId = (session?.user as any)?.barberId;
  const isAdrian = userEmail === "adriansantos@gmail.com" || userBarberId === "barbeiro-adrian" || userRole === "BARBER";
  const isAdmin = !isAdrian && userRole === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter Tabs: 'all' (VISÃO GERAL CASA), 'barbeiro-noah' (NOAH DONO), 'barbeiro-adrian' (ADRIAN 45%)
  const [activeTab, setActiveTab] = useState<string>(() => (isAdrian ? "barbeiro-adrian" : "all"));

  useEffect(() => {
    if (isAdrian) {
      setActiveTab("barbeiro-adrian");
      setExpenseCategory("VALE");
      setExpenseBarber("Adrian Santos");
    }
  }, [isAdrian]);

  // Date filter (padrão dia de hoje) e Mês selecionado
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [expenseScopeView, setExpenseScopeView] = useState<"month" | "day">("month");
  const [viewMode, setViewMode] = useState<"monthly" | "daily">("monthly");
  const [dailyFilter, setDailyFilter] = useState<"all" | "active">("all");
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  // Financial stats from API
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Saídas, Despesas Mensais e Vales (PostgreSQL)
  const [expenses, setExpenses] = useState<StoredExpenseItem[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<"FIXA" | "INSUMOS" | "VALE" | "OUTROS">("VALE");
  const [expenseBarber, setExpenseBarber] = useState("Adrian Santos");
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  // Despesas Fixas da Barbearia
  const [isFixedExpenseModalOpen, setIsFixedExpenseModalOpen] = useState(false);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseItem[]>([
    { id: 1, title: "Aluguel do Studio", amount: 1800, category: "Espaço" },
    { id: 2, title: "Energia Elétrica (Ar-condicionado)", amount: 450, category: "Utilidades" },
    { id: 3, title: "Água & Saneamento", amount: 120, category: "Utilidades" },
    { id: 4, title: "Internet Fibra Óptica & Wi-Fi", amount: 130, category: "Telecom" },
    { id: 5, title: "Insumos & Produtos do Barbeiro", amount: 350, category: "Operacional" },
  ]);
  const [newFixedTitle, setNewFixedTitle] = useState("");
  const [newFixedAmount, setNewFixedAmount] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Carrega dados da API do Dashboard (Dia + Mês) e Despesas do PostgreSQL
  const loadFinanceData = async (dateStr: string, monthStr: string) => {
    setLoading(true);
    try {
      const barberParam = isAdrian ? "barbeiro-adrian" : (activeTab !== "all" ? activeTab : "all");
      const [dashRes, expRes] = await Promise.all([
        fetch(`/api/dashboard?date=${dateStr}&month=${monthStr}&barberId=${barberParam}`, { cache: "no-store" }),
        fetch(`/api/expenses?month=${monthStr}`, { cache: "no-store" }),
      ]);

      if (dashRes.ok) {
        const data = await dashRes.json();
        setDashboardData(data);
      }

      if (expRes.ok) {
        const expData = await expRes.json();
        setExpenses(Array.isArray(expData) ? expData : []);
      }

      // Load fixed expenses template from local storage (apenas gestor precisa)
      if (isAdmin) {
        const storedFixed = localStorage.getItem("noah_fixed_expenses");
        if (storedFixed) {
          try {
            setFixedExpenses(JSON.parse(storedFixed));
          } catch {}
        }
      }
    } catch (e) {
      console.error("Erro ao carregar dados financeiros:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData(selectedDate, selectedMonth);
  }, [selectedDate, selectedMonth, activeTab, isAdrian]);

  // Adicionar saída / despesa / vale no PostgreSQL
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount || isSavingExpense) return;
    setIsSavingExpense(true);

    const targetBarberId = isAdrian
      ? "barbeiro-adrian"
      : expenseCategory === "VALE"
      ? expenseBarber === "Adrian Santos"
        ? "barbeiro-adrian"
        : "barbeiro-noah"
      : "studio";

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: expenseDesc,
          amount: parseFloat(expenseAmount),
          category: isAdrian ? "VALE" : expenseCategory,
          barberId: targetBarberId,
          date: selectedDate.startsWith(selectedMonth) ? selectedDate : `${selectedMonth}-01`,
        }),
      });

      if (res.ok) {
        setExpenseDesc("");
        setExpenseAmount("");
        setIsExpenseModalOpen(false);
        setToastMessage("Lançamento registrado no banco com sucesso!");
        await loadFinanceData(selectedDate, selectedMonth);
      } else {
        const err = await res.json();
        setToastMessage(err.error || "Erro ao registrar lançamento.");
      }
    } catch {
      setToastMessage("Erro de conexão ao salvar despesa.");
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleLaunchFixedToMonth = async (item: FixedExpenseItem) => {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: item.title,
          amount: item.amount,
          category: "FIXA",
          barberId: "studio",
          date: selectedDate.startsWith(selectedMonth) ? selectedDate : `${selectedMonth}-01`,
        }),
      });
      if (res.ok) {
        setToastMessage(`"${item.title}" lançada nas despesas de ${selectedMonth.split("-").reverse().join("/")}.`);
        await loadFinanceData(selectedDate, selectedMonth);
      }
    } catch {
      setToastMessage("Erro ao lançar despesa fixa.");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Deseja remover este registro?")) return;
    try {
      const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        setToastMessage("Registro removido.");
        await loadFinanceData(selectedDate, selectedMonth);
      }
    } catch {
      setToastMessage("Erro ao remover registro.");
    }
  };

  // Adicionar despesa fixa
  const handleAddFixedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFixedTitle || !newFixedAmount) return;

    const item: FixedExpenseItem = {
      id: Date.now(),
      title: newFixedTitle,
      amount: parseFloat(newFixedAmount),
      category: "Geral",
    };

    const updated = [...fixedExpenses, item];
    setFixedExpenses(updated);
    localStorage.setItem("noah_fixed_expenses", JSON.stringify(updated));
    setNewFixedTitle("");
    setNewFixedAmount("");
    setToastMessage(`Despesa fixa "${item.title}" adicionada.`);
  };

  const handleDeleteFixedExpense = (id: number) => {
    const updated = fixedExpenses.filter((f) => f.id !== id);
    setFixedExpenses(updated);
    localStorage.setItem("noah_fixed_expenses", JSON.stringify(updated));
  };

  // Cálculos baseados na aba ativa:
  const barberBreakdown: any[] = dashboardData?.barberBreakdown || [];
  const noahBreakdown = barberBreakdown.find((b) => b.id === "barbeiro-noah") || { revenue: 0, commission: 0, houseShare: 0 };
  const adrianBreakdown = barberBreakdown.find((b) => b.id === "barbeiro-adrian") || { revenue: 0, commission: 0, houseShare: 0 };

  const totalGrossTeam = dashboardData?.totalGrossShop ?? 0;
  const totalCommissionsToPay = dashboardData?.totalCommissionsToPay ?? (Math.round(totalGrossTeam * BARBER_COMMISSION_RATE * 100) / 100);
  const totalContaAdmin = dashboardData?.houseNetProfit ?? (Math.round(totalGrossTeam * HOUSE_COMMISSION_RATE * 100) / 100);

  // Despesas filtradas por dia vs mês
  const dayExpenses = expenses.filter((e) => e.date.slice(0, 10) === selectedDate);
  const studioDayOutflows = dayExpenses
    .filter((e) => e.barberId !== "barbeiro-adrian")
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Valores dinâmicos por aba para o Dono (Dia)
  let displayEntradas = totalGrossTeam;
  let displayComissoes = totalCommissionsToPay;
  let displayAdmin = totalContaAdmin;
  let displaySaldoLiquido = totalContaAdmin - studioDayOutflows;

  if (activeTab === "barbeiro-noah") {
    displayEntradas = noahBreakdown.revenue || 0;
    displayComissoes = 0; // Noah é dono
    displayAdmin = noahBreakdown.revenue || 0;
    displaySaldoLiquido = (noahBreakdown.revenue || 0) - studioDayOutflows;
  } else if (activeTab === "barbeiro-adrian") {
    displayEntradas = adrianBreakdown.revenue || 0;
    displayComissoes = adrianBreakdown.commission || Math.round((adrianBreakdown.revenue || 0) * 0.45 * 100) / 100;
    displayAdmin = Math.round((adrianBreakdown.revenue || 0) * 0.55 * 100) / 100;
    displaySaldoLiquido = displayAdmin;
  }

  // Cálculos exclusivos para o Adrian (sem vazamento de dados do dono)
  const scopedExpenses = expenseScopeView === "day" ? dayExpenses : expenses;
  const displayedExpenses = isAdrian
    ? scopedExpenses.filter((e) => e.barberId === "barbeiro-adrian")
    : scopedExpenses;

  const totalAdrianDayVales = dayExpenses
    .filter((e) => e.barberId === "barbeiro-adrian")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const adrianGross = adrianBreakdown.revenue || 0;
  const adrianCommission = adrianBreakdown.commission || Math.round(adrianGross * 0.45 * 100) / 100;
  const adrianNetPayout = adrianCommission - totalAdrianDayVales;

  const totalFixedMonthly = fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Balanço Mensal completo (vindo direto da API com dados reais do PostgreSQL)
  const monthly = dashboardData?.monthlySummary || null;
  let monthGross = 0;
  let monthNetProd = 0;
  let monthExpenses = 0;
  let monthNetProfit = 0;
  let monthExpected = 0;
  let monthCompletedCount = 0;
  let monthLabel = selectedMonth.split("-").reverse().join("/");
  const monthLong = formatMonthLong(selectedMonth);
  const currentBrazilMonth = getBrazilNow().date.slice(0, 7);
  const todayBrazilStr = getBrazilNow().date;
  const isCurrentMonth = selectedMonth === currentBrazilMonth;

  if (monthly) {
    if (isAdrian) {
      monthGross = monthly.grossRevenue ?? 0;
      monthNetProd = monthly.netProduction ?? 0;
      monthExpenses = monthly.expenses ?? 0;
      monthNetProfit = monthly.netProfit ?? 0;
      monthExpected = monthly.expectedNetRevenue ?? monthly.expectedRevenue ?? 0;
      monthCompletedCount = monthly.completedCount ?? 0;
    } else if (activeTab === "barbeiro-noah") {
      monthGross = monthly.noah?.gross ?? 0;
      monthNetProd = monthly.noah?.ownPlusHouseShare ?? 0;
      monthExpenses = monthly.noah?.expenses ?? 0;
      monthNetProfit = monthly.studioNetProfit ?? 0;
      monthExpected = monthly.noah?.expected ?? 0;
      monthCompletedCount = monthly.noah?.completedCount ?? 0;
    } else if (activeTab === "barbeiro-adrian") {
      monthGross = monthly.adrian?.gross ?? 0;
      monthNetProd = monthly.adrian?.commission ?? 0;
      monthExpenses = monthly.adrian?.vales ?? 0;
      monthNetProfit = monthly.adrian?.netProfit ?? 0;
      monthExpected = monthly.adrian?.expectedCommission ?? 0;
      monthCompletedCount = monthly.adrian?.completedCount ?? 0;
    } else {
      monthGross = monthly.studioGross ?? 0;
      monthNetProd = monthly.noahNetProduction ?? 0;
      monthExpenses = monthly.studioExpenses ?? 0;
      monthNetProfit = monthly.studioNetProfit ?? 0;
      monthExpected = monthly.studioExpected ?? 0;
      monthCompletedCount = monthly.totalCompletedCount ?? 0;
    }
  }

  // Gastos por Categoria no Mês
  const activeCatTotals = isAdrian
    ? monthly?.expensesByCategory || { INSUMOS: 0, FIXA: 0, VALE: 0, OUTROS: 0 }
    : activeTab === "barbeiro-adrian"
    ? monthly?.adrian?.expensesByCategory || { INSUMOS: 0, FIXA: 0, VALE: 0, OUTROS: 0 }
    : monthly?.expensesByCategory || { INSUMOS: 0, FIXA: 0, VALE: 0, OUTROS: 0 };

  const categoryCards = isAdrian || activeTab === "barbeiro-adrian"
    ? [
        { key: "VALE", label: "Vales & Adiantamentos", amount: activeCatTotals.VALE ?? 0 },
        { key: "OUTROS", label: "Outros Custos", amount: activeCatTotals.OUTROS ?? 0 },
      ]
    : [
        { key: "INSUMOS", label: "Insumos & Cosméticos", amount: activeCatTotals.INSUMOS ?? 0 },
        { key: "FIXA", label: "Custo Operacional Fixo", amount: activeCatTotals.FIXA ?? 0 },
        {
          key: "OUTROS",
          label: "Outros Custos",
          amount: (activeCatTotals.OUTROS ?? 0) + (activeCatTotals.VALE ?? 0),
        },
      ];

  // Faturamento Dia a Dia (01 até o último dia do mês)
  const rawDailyBreakdown: any[] = monthly?.dailyBreakdown || [];
  const normalizedDailyRows = rawDailyBreakdown.map((item: any) => {
    if (isAdrian) {
      return {
        date: item.date,
        day: item.day,
        dayStr: item.dayStr,
        weekday: item.weekday,
        gross: item.gross ?? 0,
        expected: item.expectedCommission ?? item.expected ?? 0,
        netProduction: item.netProduction ?? 0,
        expenses: item.expenses ?? 0,
        net: item.net ?? 0,
        grossAccumulated: item.grossAccumulated ?? 0,
        netAccumulated: item.netAccumulated ?? 0,
        completedCount: item.completedCount ?? 0,
        scheduledCount: item.scheduledCount ?? 0,
      };
    }

    const slice =
      activeTab === "barbeiro-noah"
        ? item.noah
        : activeTab === "barbeiro-adrian"
        ? item.adrian
        : item.studio;

    const sGross = slice?.gross ?? 0;
    const sExpenses = activeTab === "barbeiro-adrian" ? slice?.vales ?? 0 : slice?.expenses ?? 0;
    return {
      date: item.date,
      day: item.day,
      dayStr: item.dayStr,
      weekday: item.weekday,
      gross: sGross,
      expected: activeTab === "barbeiro-adrian" ? slice?.expectedCommission ?? 0 : slice?.expected ?? 0,
      netProduction: activeTab === "barbeiro-adrian" ? slice?.commission ?? 0 : slice?.noahProduction ?? slice?.netProduction ?? 0,
      expenses: sExpenses,
      net: slice?.net ?? 0,
      grossAccumulated: slice?.grossAccumulated ?? 0,
      netAccumulated: slice?.netAccumulated ?? 0,
      completedCount: slice?.completedCount ?? 0,
      scheduledCount: slice?.scheduledCount ?? 0,
    };
  });

  const filteredDailyRows =
    dailyFilter === "active"
      ? normalizedDailyRows.filter(
          (d) => d.gross > 0 || d.expenses > 0 || d.expected > 0 || d.completedCount > 0 || d.scheduledCount > 0
        )
      : normalizedDailyRows;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1200px] mx-auto space-y-8 pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[100] bg-[#080A0E] border border-[#DFBA73]/50 text-[#F5D799] px-5 py-3 rounded-2xl shadow-2xl shadow-black/80 flex items-center gap-3 text-xs font-mono font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-[#DFBA73]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER PADRÃO LAS BARBER STUDIO COM MENSAL / DIÁRIO + BALCÃO + DESPESAS */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 font-mono shadow-lg shadow-[#DFBA73]/20">
              <Shield className="w-3 h-3" /> {isAdmin ? "GESTÃO GERAL DO DONO • 55% Noah • 45% Adrian" : "BARBEIRO DA EQUIPE • MINHA COMISSÃO: 45%"}
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
            {isAdmin ? (
              <>
                Gestão <span className="bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] bg-clip-text text-transparent italic">Financeira</span>
              </>
            ) : (
              <>
                Meu Caixa <span className="bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] bg-clip-text text-transparent italic">& Comissões</span>
              </>
            )}
          </h2>
          <p className="text-sm text-[#F5D799] font-medium mt-1">
            {isAdmin ? "Produção Bruta, Despesas & Lucro Líquido" : "Minha Produção, Vales & Comissão Líquida (45%)"}
          </p>
          <p className="text-gray-400 mt-0.5 text-xs font-light">
            {isAdmin
              ? "Controle completo de faturamento bruto, despesas e lucro líquido mensal e diário do estúdio."
              : "Controle completo da sua produção bruta, comissão de 45%, vales e saldo líquido mensal e diário."}
          </p>
        </div>

        {/* Controles: MENSAL / DIÁRIO + Mês/Dia + Cliente Balcão + Lançar Despesa */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle MENSAL | DIÁRIO */}
          <div className="flex items-center bg-[#080A0E] border border-white/10 rounded-2xl p-1 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setViewMode("monthly");
                setExpenseScopeView("month");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono uppercase font-bold tracking-wider transition-all cursor-pointer ${
                viewMode === "monthly"
                  ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow-md shadow-[#DFBA73]/25"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              MENSAL
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("daily");
                setExpenseScopeView("day");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono uppercase font-bold tracking-wider transition-all cursor-pointer ${
                viewMode === "daily"
                  ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow-md shadow-[#DFBA73]/25"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              DIÁRIO
            </button>
          </div>

          {viewMode === "monthly" ? (
            <div className="flex items-center gap-2 bg-[#080A0E] border border-[#DFBA73]/30 rounded-2xl px-4 py-2.5 shadow-inner">
              <Calendar className="w-3.5 h-3.5 text-[#DFBA73]" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  if (e.target.value && !selectedDate.startsWith(e.target.value)) {
                    setSelectedDate(`${e.target.value}-01`);
                  }
                }}
                className="bg-transparent text-white text-xs font-mono outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#080A0E] border border-[#DFBA73]/30 rounded-2xl px-4 py-2.5 shadow-inner">
              <Calendar className="w-3.5 h-3.5 text-[#DFBA73]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (e.target.value) setSelectedMonth(e.target.value.slice(0, 7));
                }}
                className="bg-transparent text-white text-xs font-mono outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsWalkInModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-mono text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#DFBA73]/25 hover:brightness-110"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ CLIENTE BALCÃO</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isAdmin && activeTab !== "barbeiro-adrian") {
                setExpenseCategory("FIXA");
              } else {
                setExpenseCategory("VALE");
                setExpenseBarber("Adrian Santos");
              }
              setIsExpenseModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/35 font-mono text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{isAdmin ? "LANÇAR DESPESA" : "LANÇAR VALE"}</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsFixedExpenseModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-[#080A0E] hover:bg-white/5 border border-[#DFBA73]/30 text-[#DFBA73] hover:text-[#F5D799] font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
              title="Despesas fixas recorrentes do estúdio"
            >
              <Building className="w-3.5 h-3.5 text-[#DFBA73]" />
              <span>DESPESAS FIXAS</span>
            </button>
          )}
        </div>
      </div>

      {/* TABS DE PROFISSIONAIS (VISÃO GERAL ESTÚDIO / NOAH DONO 55% / ADRIAN 45%) */}
      {isAdmin ? (
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto scrollbar-hide overscroll-x-contain touch-pan-y">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-5 py-2.5 rounded-2xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow-lg shadow-[#DFBA73]/25 border border-[#DFBA73]"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            VISÃO GERAL DO ESTÚDIO
          </button>

          <button
            onClick={() => setActiveTab("barbeiro-noah")}
            className={`px-5 py-2.5 rounded-2xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "barbeiro-noah"
                ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow-lg shadow-[#DFBA73]/25 border border-[#DFBA73]"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            <span>✂️</span>
            <span>NOAH (DONO · 55%)</span>
          </button>

          <button
            onClick={() => setActiveTab("barbeiro-adrian")}
            className={`px-5 py-2.5 rounded-2xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "barbeiro-adrian"
                ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow-lg shadow-[#DFBA73]/25 border border-[#DFBA73]"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            <span>✂️</span>
            <span>ADRIAN (FUNCIONÁRIO · 45%)</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <div className="px-5 py-2.5 rounded-2xl font-mono text-xs uppercase tracking-wider font-bold bg-[#DFBA73]/20 border border-[#DFBA73]/40 text-[#F5D799] flex items-center gap-2">
            <span>✂️</span>
            <span>ADRIAN SANTOS (MEU CAIXA · 45%)</span>
          </div>
        </div>
      )}

      {/* ━━━ MODO MENSAL: FECHAMENTO PARCIAL + GASTOS POR CATEGORIA + FATURAMENTO DIA A DIA ━━━ */}
      {viewMode === "monthly" ? (
        <div className="space-y-8">
          {/* FECHAMENTO PARCIAL / MENSAL • NOVEMBRO DE 2026 */}
          <div className="bg-gradient-to-br from-[#0B0E14] via-[#080A0E] to-[#050608] border border-[#DFBA73]/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-52 h-52 bg-[#DFBA73]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-[#DFBA73] shadow-lg shadow-black/60 shrink-0">
                  <Image
                    src={
                      isAdrian || activeTab === "barbeiro-adrian"
                        ? "/barbers/adrian-santos-v2.jpg"
                        : "/barbers/noah-ferreira.jpg"
                    }
                    alt={isAdrian || activeTab === "barbeiro-adrian" ? "Adrian Santos" : "Noah Ferreira"}
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#DFBA73] font-bold">
                    CONTROLE MENSAL • {monthLong.toUpperCase()}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-serif text-white mt-0.5">
                    {isCurrentMonth ? "Fechamento Parcial" : "Fechamento do Mês"} •{" "}
                    <span className="text-[#F5D799] italic">{monthLong}</span>
                  </h3>
                  <p className="text-xs text-gray-400 font-light mt-0.5">
                    {isAdrian || activeTab === "barbeiro-adrian"
                      ? "Comissão Fixa (45%) • Controle de Produção e Vales"
                      : activeTab === "barbeiro-noah"
                      ? "Noah Ferreira (Dono · próprios + 55% Adrian) • Controle de Produção e Custos"
                      : "Equipe Noah (Dono · 55%) / Adrian (45%) • Controle de Produção e Custos"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 relative z-10">
                <div className="px-4 py-2.5 rounded-2xl bg-[#DFBA73]/15 border border-[#DFBA73]/35 font-mono text-xs">
                  <span className="text-gray-300">Previsto: </span>
                  <strong className="text-[#F5D799] text-sm">
                    R$ {monthExpected.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <span className="text-xs font-mono text-gray-400 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  {monthCompletedCount} {monthCompletedCount === 1 ? "corte" : "cortes"} concluídos
                </span>
              </div>
            </div>

            {/* Fórmula LAS: (+) PRODUÇÃO BRUTA | (-) GASTOS NO MÊS | (=) LUCRO LÍQUIDO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                  (+) PRODUÇÃO BRUTA
                </span>
                <p className="text-3xl font-serif text-white font-bold mt-2">
                  R$ {monthGross.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-white/5 font-light">
                  {isAdrian || activeTab === "barbeiro-adrian"
                    ? `Sua parte líquida (45%): R$ ${monthNetProd.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : `Produção Dono Noah (próprios + 55%): R$ ${monthNetProd.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                </p>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 flex flex-col justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-rose-300 font-bold">
                  (-) {isAdrian || activeTab === "barbeiro-adrian" ? "VALES / GASTOS NO MÊS" : "GASTOS NO MÊS"}
                </span>
                <p className="text-3xl font-serif text-rose-400 font-bold mt-2">
                  R$ {monthExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-rose-300/80 mt-2 pt-2 border-t border-rose-500/20 font-light">
                  {isAdrian || activeTab === "barbeiro-adrian"
                    ? "Total de vales e adiantamentos retirados no mês."
                    : "Soma de insumos, despesas fixas e outros custos."}
                </p>
              </div>

              <div
                className={`${
                  monthNetProfit >= 0
                    ? "bg-emerald-500/10 border-emerald-500/35"
                    : "bg-rose-500/15 border-rose-500/40"
                } border rounded-2xl p-6 flex flex-col justify-between`}
              >
                <span
                  className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                    monthNetProfit >= 0 ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  (=) {isAdrian || activeTab === "barbeiro-adrian" ? "LÍQUIDO A RECEBER" : "LUCRO LÍQUIDO"}
                </span>
                <p
                  className={`text-3xl font-serif font-bold mt-2 ${
                    monthNetProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  R$ {monthNetProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p
                  className={`text-xs mt-2 pt-2 border-t font-light ${
                    monthNetProfit >= 0 ? "text-emerald-300/80 border-emerald-500/20" : "text-rose-300/80 border-rose-500/20"
                  }`}
                >
                  {isAdrian || activeTab === "barbeiro-adrian"
                    ? "Comissão (45%) já descontando os seus vales do mês."
                    : "Lucro líquido do estúdio após despesas e repasses."}
                </p>
              </div>
            </div>

            {/* Comparativo Individualizado no Mês (Visível apenas para o Dono Noah) */}
            {isAdmin && monthly && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10 relative z-10">
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#DFBA73] font-bold">
                      NOAH FERREIRA (DONO · MÊS)
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Bruto próprio:{" "}
                      <strong className="text-white">
                        R$ {(monthly.noah?.gross ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </strong>{" "}
                      • {monthly.noah?.completedCount ?? 0} cortes
                    </p>
                    <p className="text-xs text-emerald-400 mt-0.5">
                      c/ 55% Adrian:{" "}
                      <strong>
                        R$ {(monthly.noah?.ownPlusHouseShare ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-gray-400 uppercase block">Lucro Líquido</span>
                    <span
                      className={`text-lg font-serif font-bold ${
                        (monthly.studioNetProfit ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      R$ {(monthly.studioNetProfit ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                      ADRIAN SANTOS (45% · MÊS)
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Bruto:{" "}
                      <strong className="text-white">
                        R$ {(monthly.adrian?.gross ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </strong>{" "}
                      • Comissão 45%:{" "}
                      <strong className="text-[#DFBA73]">
                        R$ {(monthly.adrian?.commission ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </strong>
                    </p>
                    <p className="text-xs text-rose-400 mt-0.5">
                      Vales no mês: - R$ {(monthly.adrian?.vales ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-gray-400 uppercase block">Líquido Adrian</span>
                    <span className="text-lg font-serif font-bold text-[#DFBA73]">
                      R$ {(monthly.adrian?.netProfit ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GASTOS POR CATEGORIA (MÊS) */}
          <div className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 md:p-7 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-serif text-white">Gastos por Categoria</h3>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-[#DFBA73]/15 border border-[#DFBA73]/30 text-[#F5D799] font-bold">
                MÊS
              </span>
            </div>

            <div className={`grid grid-cols-1 ${categoryCards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"} gap-4`}>
              {categoryCards.map((cat) => {
                const totalCatSum = categoryCards.reduce((acc, c) => acc + c.amount, 0);
                const pct = totalCatSum > 0 ? Math.round((cat.amount / totalCatSum) * 100) : 0;
                return (
                  <div
                    key={cat.key}
                    className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-300 font-medium">{cat.label}</span>
                      <span className="text-xs font-mono font-bold text-rose-300">
                        R$ {cat.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#DFBA73] to-rose-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FATURAMENTO DIA A DIA • NOVEMBRO DE 2026 (EVOLUÇÃO ACUMULADA ATÉ O FECHAMENTO FINAL) */}
          <div className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 md:p-7 space-y-5 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h3 className="text-xl md:text-2xl font-serif text-white">
                  Faturamento Dia a Dia • <span className="text-[#F5D799] italic">{monthLong}</span>
                </h3>
                <p className="text-xs text-gray-400 font-light mt-1">
                  Do dia 01 ao último dia do mês com evolução acumulada até o fechamento final. Toque em um dia para detalhar.
                </p>
              </div>

              <div className="flex items-center bg-[#050608] border border-white/10 rounded-2xl p-1 self-start lg:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setDailyFilter("all")}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-mono uppercase font-bold transition-all cursor-pointer ${
                    dailyFilter === "all"
                      ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  TODOS OS DIAS ({normalizedDailyRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDailyFilter("active")}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-mono uppercase font-bold transition-all cursor-pointer ${
                    dailyFilter === "active"
                      ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  COM MOVIMENTO
                </button>
              </div>
            </div>

            {filteredDailyRows.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm italic font-light">
                Nenhum dia com movimentação registrada neste mês.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredDailyRows.map((day) => {
                  const isToday = day.date === todayBrazilStr;
                  const hasActivity =
                    day.gross > 0 || day.expenses > 0 || day.expected > 0 || day.completedCount > 0 || day.scheduledCount > 0;

                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => {
                        setSelectedDate(day.date);
                        setViewMode("daily");
                        setExpenseScopeView("day");
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer ${
                        isToday
                          ? "bg-[#DFBA73]/10 border-[#DFBA73]/40 hover:border-[#DFBA73]"
                          : hasActivity
                          ? "bg-white/[0.03] border-white/10 hover:border-[#DFBA73]/40"
                          : "bg-white/[0.01] border-white/5 opacity-60 hover:opacity-100 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono shrink-0 border ${
                            isToday
                              ? "bg-[#DFBA73] text-black border-[#DFBA73] font-bold"
                              : "bg-[#050608] text-[#F5D799] border-[#DFBA73]/25"
                          }`}
                        >
                          <span className="text-xs font-bold leading-none">{day.dayStr.split("/")[0]}</span>
                          <span className={`text-[9px] uppercase mt-0.5 ${isToday ? "text-black/80" : "text-gray-400"}`}>
                            {day.weekday}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-serif text-white font-semibold">
                              Dia {day.dayStr}
                            </span>
                            {isToday && (
                              <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                HOJE
                              </span>
                            )}
                            {day.completedCount > 0 && (
                              <span className="text-[10px] font-mono text-gray-300 bg-white/5 px-2 py-0.5 rounded-full">
                                {day.completedCount} {day.completedCount === 1 ? "corte" : "cortes"}
                              </span>
                            )}
                            {day.expected > 0 && (
                              <span className="text-[10px] font-mono text-[#F5D799] bg-[#DFBA73]/15 border border-[#DFBA73]/30 px-2 py-0.5 rounded-full">
                                Previsto: R$ {day.expected.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                            Toque para detalhar horários e lançamentos do dia
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 text-left md:text-right border-t md:border-t-0 border-white/5 pt-2.5 md:pt-0 shrink-0 font-mono">
                        <div>
                          <span className="text-[9px] uppercase text-gray-500 block">Bruto Dia</span>
                          <span className="text-xs font-bold text-white">
                            R$ {day.gross.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-gray-500 block">Gastos Dia</span>
                          <span className={`text-xs font-bold ${day.expenses > 0 ? "text-rose-400" : "text-gray-500"}`}>
                            {day.expenses > 0
                              ? `- R$ ${day.expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                              : "R$ 0,00"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-gray-500 block">Líquido Dia</span>
                          <span className={`text-xs font-bold ${day.net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            R$ {day.net.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-[#DFBA73] block">Acumulado Mês</span>
                          <span className={`text-xs font-bold ${day.netAccumulated >= 0 ? "text-[#F5D799]" : "text-rose-400"}`}>
                            R$ {day.netAccumulated.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* BARRA DE CONTEXTO DIÁRIO COM VOLTAR PARA MENSAL */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080A0E] border border-[#DFBA73]/25 rounded-2xl px-5 py-3.5">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#DFBA73]" />
              <span className="text-xs font-mono text-gray-300">
                Detalhamento Diário de{" "}
                <strong className="text-[#F5D799]">{selectedDate.split("-").reverse().join("/")}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setViewMode("monthly");
                setExpenseScopeView("month");
              }}
              className="text-xs font-mono font-bold text-[#DFBA73] hover:text-[#F5D799] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Visão Mensal ({monthLong})
            </button>
          </div>

          {/* 4 BENTO CARDS DIÁRIOS ESTRUTURA LAS BARBER STUDIO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Entradas Brutas */}
            <div className="p-6 rounded-3xl bg-[#080A0E] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group shadow-xl">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#DFBA73]/5 rounded-full blur-2xl group-hover:bg-[#DFBA73]/10 transition-colors" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-semibold">
                  {isAdmin ? "ENTRADAS BRUTAS" : "MINHA PRODUÇÃO BRUTA"}
                </span>
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#DFBA73]">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-serif text-white tracking-tight mb-1 relative z-10">
                R$ {(isAdmin ? displayEntradas : adrianGross).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-gray-400 font-light relative z-10">
                {isAdmin
                  ? activeTab === "all"
                    ? "Produção total somada de toda a equipe."
                    : "Produção bruta deste profissional."
                  : "Total gerado pelos seus cortes nesta data."}
              </p>
            </div>

            {/* Card 2: Comissão Adrian (45%) */}
            <div className="p-6 rounded-3xl bg-[#080A0E] border border-[#DFBA73]/30 hover:border-[#DFBA73]/50 transition-all relative overflow-hidden group shadow-xl">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#DFBA73]/10 rounded-full blur-2xl group-hover:bg-[#DFBA73]/15 transition-colors" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#F5D799] font-bold">
                  {isAdmin ? "COMISSÃO ADRIAN (45%)" : "MINHA COMISSÃO (45%)"}
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#DFBA73]/15 border border-[#DFBA73]/30 flex items-center justify-center text-[#F5D799]">
                  <Scissors className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-serif text-[#F5D799] tracking-tight mb-1 relative z-10">
                R$ {(isAdmin ? displayComissoes : adrianCommission).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-[#DFBA73]/80 font-light relative z-10">
                {isAdmin
                  ? activeTab === "all"
                    ? "Comissão a pagar ao funcionário Adrian Santos (45%)."
                    : "Comissão líquida do barbeiro (45%)."
                  : "Sua comissão líquida a receber (45%)."}
              </p>
            </div>

            {/* Card 3: Noah Dono (para o gestor) OU Meus Vales (para o Adrian) */}
            {isAdmin ? (
              <div className="p-6 rounded-3xl bg-[#080A0E] border border-emerald-500/30 hover:border-emerald-500/50 transition-all relative overflow-hidden group shadow-xl">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-bold">
                    NOAH FERREIRA (DONO · 55%)
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Building className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-3xl font-serif text-emerald-400 tracking-tight mb-1 relative z-10">
                  R$ {displayAdmin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-emerald-300/70 font-light relative z-10">
                  Faturamento do Dono Noah: produção própria + 55% de Adrian.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-[#080A0E] border border-rose-500/30 hover:border-rose-500/50 transition-all relative overflow-hidden group shadow-xl">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-rose-300 font-bold">
                    MEUS VALES / ADIANTAMENTOS
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-3xl font-serif text-rose-400 tracking-tight mb-1 relative z-10">
                  - R$ {totalAdrianDayVales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-rose-300/70 font-light relative z-10">
                  Total de vales e adiantamentos retirados no dia.
                </p>
              </div>
            )}

            {/* Card 4: Saldo Líquido do Dia / Líquido a Receber Hoje */}
            <div className="p-6 rounded-3xl bg-[#080A0E] border border-white/10 hover:border-[#DFBA73]/30 transition-all relative overflow-hidden group shadow-xl">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#DFBA73]/5 rounded-full blur-2xl group-hover:bg-[#DFBA73]/10 transition-colors" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-300 font-bold">
                  {isAdmin ? "SALDO LÍQUIDO DO DIA" : "LÍQUIDO A RECEBER HOJE"}
                </span>
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <h3 className={`text-3xl font-serif tracking-tight mb-1 relative z-10 ${(isAdmin ? displaySaldoLiquido : adrianNetPayout) < 0 ? "text-rose-400" : "text-white"}`}>
                R$ {(isAdmin ? displaySaldoLiquido : adrianNetPayout).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-gray-400 font-light relative z-10">
                {isAdmin
                  ? "Receita do Dono retida menos saídas diárias."
                  : "Comissão líquida restante após desconto dos seus vales."}
              </p>
            </div>
          </div>

          {/* CARD DE DESTAQUE CENTRAL DO CAIXA DIÁRIO */}
          <div className="p-8 md:p-10 rounded-3xl border bg-gradient-to-r from-[#080A0E] via-[#0b0e14] to-[#080A0E] border-[#DFBA73]/30 shadow-xl shadow-black/60 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-52 h-52 bg-[#DFBA73]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#DFBA73] shadow-lg shadow-black/60 shrink-0">
                <Image
                  src={
                    isAdrian || activeTab === "barbeiro-adrian"
                      ? "/barbers/adrian-santos-v2.jpg"
                      : "/barbers/noah-ferreira.jpg"
                  }
                  alt={
                    isAdrian || activeTab === "barbeiro-adrian"
                      ? "Adrian Santos"
                      : "Noah Ferreira"
                  }
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#F5D799] bg-[#DFBA73]/15 border border-[#DFBA73]/30 px-2.5 py-0.5 rounded-full font-bold">
                    {isAdrian || activeTab === "barbeiro-adrian"
                      ? "Comissão Fixa • 45%"
                      : "Proprietário & Dono • 55%"}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                    Data {selectedDate.split("-").reverse().join("/")}
                  </span>
                </div>
                <h3 className="text-2xl font-serif text-white">
                  {isAdrian
                    ? "Adrian Santos — Saldo Líquido do Dia"
                    : activeTab === "barbeiro-adrian"
                    ? "Repasse Adrian Santos (Dia)"
                    : activeTab === "barbeiro-noah"
                    ? "Saldo Noah Ferreira (Dono · Dia)"
                    : "Saldo Líquido do Estúdio no Dia"}
                </h3>
                <p className="text-sm text-gray-400 mt-1 max-w-md font-light">
                  {isAdrian || activeTab === "barbeiro-adrian"
                    ? "Comissão de 45% nesta data já descontando os vales retirados no dia."
                    : "Produção própria do Dono + 55% do Adrian na data selecionada, descontando saídas do dia."}
                </p>
              </div>
            </div>

            <div className="text-center md:text-right relative z-10 shrink-0">
              <span className="text-xs font-mono uppercase tracking-widest text-[#DFBA73] block mb-1">
                {isAdrian || activeTab === "barbeiro-adrian" ? "Líquido do Dia" : "Saldo Real do Dia"}
              </span>
              <h4
                className={`text-4xl md:text-5xl font-serif ${
                  (isAdmin ? displaySaldoLiquido : adrianNetPayout) >= 0 ? "text-white" : "text-rose-400"
                }`}
              >
                R$ {(isAdmin ? displaySaldoLiquido : adrianNetPayout).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO: SAÍDAS, DESPESAS E VALES DO CAIXA (MÊS OU DIA) */}
      <div className="bg-[#080A0E] border border-white/10 rounded-3xl p-7 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-rose-400" />
            <h3 className="text-xl font-serif text-white">
              {isAdmin
                ? expenseScopeView === "month"
                  ? `Despesas & Vales do Mês (${monthLabel})`
                  : "Saídas e Vales do Dia"
                : expenseScopeView === "month"
                ? `Meus Vales e Gastos do Mês (${monthLabel})`
                : "Meus Vales e Adiantamentos (Dia)"}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[#050608] border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setExpenseScopeView("month")}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                  expenseScopeView === "month"
                    ? "bg-[#DFBA73] text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Mês ({monthLabel})
              </button>
              <button
                type="button"
                onClick={() => setExpenseScopeView("day")}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                  expenseScopeView === "day"
                    ? "bg-[#DFBA73] text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Só Dia
              </button>
            </div>

            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-rose-400" />
              <span>{isAdmin ? "Registrar Despesa / Vale" : "Registrar Vale"}</span>
            </button>
          </div>
        </div>

        {displayedExpenses.length === 0 ? (
          <div className="py-12 text-center text-gray-500 font-light text-sm italic">
            {isAdmin ? "Nenhuma despesa ou vale registrado neste período." : "Nenhum vale registrado para você neste período."}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedExpenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium text-sm">{exp.description}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {exp.category} {exp.barberName ? `• ${exp.barberName}` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {new Date(exp.date).toLocaleDateString("pt-BR")} • {new Date(exp.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-rose-400 font-serif font-bold text-base">
                    - R$ {exp.amount.toFixed(2)}
                  </span>
                  {(isAdmin || exp.barberId === "barbeiro-adrian") && (
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Excluir registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEÇÃO: FECHAMENTO DIÁRIO POR PROFISSIONAL */}
      <div className="space-y-4">
        <h3 className="text-xl font-serif text-white flex items-center gap-2">
          <span>👤</span> {isAdmin ? "Fechamento Diário por Profissional" : "Minha Produção & Fechamento Diário"}
        </h3>

        <div className="space-y-4">
          {barberBreakdown.length === 0 ? (
            <p className="text-gray-500 italic p-6 bg-white/[0.02] rounded-3xl border border-white/5 font-light">
              Nenhum dado de profissional carregado para esta data.
            </p>
          ) : (
            barberBreakdown
              .filter((barber) => (isAdmin ? true : !barber.isOwner))
              .map((barber) => (
                <div
                  key={barber.id}
                  className="bg-[#080A0E] border border-white/10 hover:border-white/20 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-white/5 flex items-center justify-center">
                      {barber.avatar ? (
                        <Image
                          src={barber.avatar}
                          alt={barber.name}
                          fill
                          className="object-cover object-top"
                          sizes="56px"
                        />
                      ) : (
                        <Shield className="w-6 h-6 text-[#DFBA73]" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="text-white font-serif font-bold text-lg">
                          {barber.name} {barber.isOwner ? "(Dono)" : ""}
                        </h4>
                        <span className={`text-[10px] uppercase font-bold font-mono tracking-wider px-2.5 py-0.5 rounded-full ${
                          barber.isOwner
                            ? "bg-[#DFBA73]/20 border border-[#DFBA73]/40 text-[#F5D799]"
                            : "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                        }`}>
                          {barber.isOwner ? "DONO · 55%" : "FUNCIONÁRIO · 45%"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 font-light">
                        {barber.isOwner ? "Proprietário da Barbearia" : "Barbeiro da Equipe"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 md:gap-8 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">
                        PRODUÇÃO BRUTA: R$ {barber.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      {barber.isOwner ? (
                        <h5 className="text-xl font-serif text-emerald-400 font-bold mt-0.5">
                          Produção do Dono: R$ {barber.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </h5>
                      ) : (
                        <h5 className="text-xl font-serif text-[#DFBA73] font-bold mt-0.5">
                          Comissão (45%): R$ {barber.commission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </h5>
                      )}
                      {!barber.isOwner && isAdmin && (
                        <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                          Repasse Dono Noah (55%): + R$ {barber.houseShare.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* MODAL: REGISTRAR SAÍDA OU VALE */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <CenterModalPortal onBackdropClick={() => setIsExpenseModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="my-auto bg-[#080A0E] border border-[#DFBA73]/30 rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[calc(100dvh-7.5rem)] overflow-y-auto shadow-2xl relative font-sans text-white"
            >
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-serif text-white mb-1">Registrar Saída ou Vale</h3>
              <p className="text-xs text-gray-400 font-light mb-6">
                Lançamento imediato de adiantamento, insumo ou custo operacional do caixa.
              </p>

              <form onSubmit={handleAddExpense} className="space-y-4">
                {isAdmin ? (
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1.5">
                      Tipo de Lançamento
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(["FIXA", "INSUMOS", "VALE", "OUTROS"] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setExpenseCategory(cat)}
                          className={`py-2 text-xs font-mono font-semibold uppercase rounded-xl border transition-all ${
                            expenseCategory === cat
                              ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold border-[#DFBA73]"
                              : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1.5">
                      Tipo de Lançamento
                    </label>
                    <div className="py-2.5 px-4 rounded-xl bg-[#DFBA73]/15 border border-[#DFBA73]/30 text-[#F5D799] font-mono text-xs font-bold uppercase">
                      VALE / ADIANTAMENTO
                    </div>
                  </div>
                )}

                {expenseCategory === "VALE" && (
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1.5">
                      Profissional
                    </label>
                    {isAdmin ? (
                      <select
                        value={expenseBarber}
                        onChange={(e) => setExpenseBarber(e.target.value)}
                        className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none"
                      >
                        <option value="Adrian Santos">Adrian Santos</option>
                        <option value="Noah Ferreira">Noah Ferreira (Dono)</option>
                      </select>
                    ) : (
                      <div className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2.5 text-[#DFBA73] font-mono text-xs font-semibold">
                        Adrian Santos (Você)
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1.5">
                    Descrição do Lançamento
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Vale semanal, Gelo para bebidas, Lâminas..."
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#DFBA73]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1.5">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#DFBA73]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold uppercase font-mono tracking-wider text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-[#DFBA73]/25 hover:brightness-110 cursor-pointer"
                  >
                    Confirmar Saída
                  </button>
                </div>
              </form>
            </motion.div>
          </CenterModalPortal>
        )}
      </AnimatePresence>

      {/* MODAL: DESPESAS FIXAS DA BARBEARIA */}
      <AnimatePresence>
        {isFixedExpenseModalOpen && (
          <CenterModalPortal onBackdropClick={() => setIsFixedExpenseModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="my-auto bg-[#080A0E] border border-[#DFBA73]/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[calc(100dvh-7.5rem)] overflow-y-auto shadow-2xl relative font-sans text-white"
            >
              <button
                onClick={() => setIsFixedExpenseModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <Building className="w-5 h-5 text-[#DFBA73]" />
                <h3 className="text-xl font-serif text-white">Despesas Fixas da Barbearia</h3>
              </div>
              <p className="text-xs text-gray-400 font-light mb-6">
                Custos mensais estruturais mantidos pelo faturamento da barbearia.
              </p>

              {/* Lista de Despesas Fixas */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 mb-6">
                {fixedExpenses.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5"
                  >
                    <div>
                      <p className="text-white text-xs font-medium">{f.title}</p>
                      <span className="text-[10px] text-gray-400 font-mono">{f.category}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-white font-mono text-xs font-bold">
                        R$ {f.amount.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLaunchFixedToMonth(f)}
                        className="px-2.5 py-1 rounded-lg bg-[#DFBA73]/15 hover:bg-[#DFBA73] text-[#DFBA73] hover:text-black border border-[#DFBA73]/30 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
                        title="Lançar esta despesa no mês atual"
                      >
                        Lançar no Mês
                      </button>
                      <button
                        onClick={() => handleDeleteFixedExpense(f.id)}
                        className="text-gray-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totalizador Mensal */}
              <div className="p-4 bg-[#DFBA73]/10 border border-[#DFBA73]/30 rounded-2xl flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#F5D799]">
                    Total Fixo Mensal Estimado
                  </p>
                  <p className="text-xs text-gray-400">Custos fixos da barbearia</p>
                </div>
                <h4 className="text-2xl font-serif text-[#DFBA73] font-bold">
                  R$ {totalFixedMonthly.toFixed(2)}
                </h4>
              </div>

              {/* Formulário para adicionar nova despesa fixa */}
              <form onSubmit={handleAddFixedExpense} className="space-y-3 border-t border-white/10 pt-4">
                <p className="text-xs font-mono uppercase text-gray-300 font-semibold">
                  + Adicionar Nova Despesa Fixa
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Título (ex: Contador)"
                    value={newFixedTitle}
                    onChange={(e) => setNewFixedTitle(e.target.value)}
                    className="bg-[#050608] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#DFBA73]"
                  />
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Valor (R$)"
                    value={newFixedAmount}
                    onChange={(e) => setNewFixedAmount(e.target.value)}
                    className="bg-[#050608] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#DFBA73]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold uppercase font-mono tracking-wider text-xs py-2.5 rounded-xl transition-all shadow-md hover:brightness-110 cursor-pointer"
                >
                  Salvar Despesa Fixa
                </button>
              </form>
            </motion.div>
          </CenterModalPortal>
        )}
      </AnimatePresence>
      <WalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        isAdmin={isAdmin}
        defaultDate={selectedDate}
        onSuccess={(msg) => {
          setToastMessage(msg);
          loadFinanceData(selectedDate, selectedMonth);
        }}
      />
    </motion.div>
  );
}
