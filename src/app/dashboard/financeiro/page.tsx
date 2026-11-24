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
} from "lucide-react";
import { BARBERS, BARBER_COMMISSION_RATE, HOUSE_COMMISSION_RATE } from "@/lib/barbers";
import { useSession } from "next-auth/react";

interface StoredExpenseItem {
  id: number;
  description: string;
  amount: number;
  category: "VALE" | "INSUMOS" | "OUTROS";
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

  // Date filter (padrão dia de hoje)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  // Financial stats from API
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Saídas e Vales do Caixa
  const [expenses, setExpenses] = useState<StoredExpenseItem[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<"VALE" | "INSUMOS" | "OUTROS">("VALE");
  const [expenseBarber, setExpenseBarber] = useState("Adrian Santos");

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

  // Carrega dados da API do Dashboard para a data
  const loadFinanceData = async (dateStr: string) => {
    setLoading(true);
    try {
      const barberParam = isAdrian ? "barbeiro-adrian" : (activeTab !== "all" ? activeTab : "all");
      const res = await fetch(`/api/dashboard?date=${dateStr}&barberId=${barberParam}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }

      // Load expenses from local storage for that date
      const stored = localStorage.getItem(`noah_expenses_${dateStr}`);
      if (stored) {
        try {
          setExpenses(JSON.parse(stored));
        } catch {
          setExpenses([]);
        }
      } else {
        setExpenses([]);
      }

      // Load fixed expenses from local storage (apenas gestor precisa)
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
    loadFinanceData(selectedDate);
  }, [selectedDate, activeTab, isAdrian]);

  // Adicionar saída / vale
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount) return;

    const newExp: StoredExpenseItem = {
      id: Date.now(),
      description: expenseDesc,
      amount: parseFloat(expenseAmount),
      category: isAdrian ? "VALE" : expenseCategory,
      barberName: isAdrian ? "Adrian Santos" : (expenseCategory === "VALE" ? expenseBarber : undefined),
      date: new Date().toISOString(),
    };

    const updated = [newExp, ...expenses];
    setExpenses(updated);
    localStorage.setItem(`noah_expenses_${selectedDate}`, JSON.stringify(updated));

    setExpenseDesc("");
    setExpenseAmount("");
    setIsExpenseModalOpen(false);
    setToastMessage(`Saída de R$ ${newExp.amount.toFixed(2)} registrada com sucesso.`);
  };

  const handleDeleteExpense = (id: number) => {
    if (!confirm("Deseja remover este registro?")) return;
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    localStorage.setItem(`noah_expenses_${selectedDate}`, JSON.stringify(updated));
    setToastMessage("Registro removido.");
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

  const totalDailyOutflows = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Valores dinâmicos por aba para o Dono
  let displayEntradas = totalGrossTeam;
  let displayComissoes = totalCommissionsToPay;
  let displayAdmin = totalContaAdmin;
  let displaySaldoLiquido = Math.max(0, totalContaAdmin - totalDailyOutflows);

  if (activeTab === "barbeiro-noah") {
    displayEntradas = noahBreakdown.revenue || 0;
    displayComissoes = 0; // Noah é dono
    displayAdmin = noahBreakdown.revenue || 0;
    displaySaldoLiquido = noahBreakdown.revenue || 0;
  } else if (activeTab === "barbeiro-adrian") {
    displayEntradas = adrianBreakdown.revenue || 0;
    displayComissoes = adrianBreakdown.commission || Math.round((adrianBreakdown.revenue || 0) * 0.45 * 100) / 100;
    displayAdmin = Math.round((adrianBreakdown.revenue || 0) * 0.55 * 100) / 100;
    displaySaldoLiquido = displayAdmin;
  }

  // Cálculos exclusivos para o Adrian (sem vazamento de dados do dono)
  const displayedExpenses = isAdrian 
    ? expenses.filter((e) => e.category === "VALE" && (e.barberName === "Adrian Santos" || e.barberName === "Adrian"))
    : expenses;

  const totalAdrianVales = expenses
    .filter((e) => e.category === "VALE" && (e.barberName === "Adrian Santos" || e.barberName === "Adrian"))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const adrianGross = adrianBreakdown.revenue || 0;
  const adrianCommission = adrianBreakdown.commission || Math.round(adrianGross * 0.45 * 100) / 100;
  const adrianNetPayout = Math.max(0, adrianCommission - totalAdrianVales);

  const totalFixedMonthly = fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

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

      {/* HEADER NOAH BARBER STUDIO STYLE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] bg-[#DFBA73]/15 border border-[#DFBA73]/30 text-[#DFBA73] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 font-mono">
              <Shield className="w-3 h-3 text-[#DFBA73]" /> {isAdmin ? "GESTÃO GERAL DO DONO • 55% Noah (Dono) • 45% Adrian (Funcionário)" : "BARBEIRO DA EQUIPE • MINHA COMISSÃO: 45%"}
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
            {isAdmin ? "Gestão Financeira" : "Meu Caixa & Comissões"}
          </h2>
          <p className="text-gray-400 mt-1 text-sm font-light">
            {isAdmin 
              ? "Controle financeiro geral do estúdio, comissões de Adrian e faturamento do Dono Noah Ferreira."
              : "Acompanhe seus cortes realizados, cálculo de comissão (45%) e vales retirados no caixa."}
          </p>
        </div>

        {/* Date Filter & Despesa Fixa Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-[#080A0E] border border-white/10 rounded-2xl px-4 py-2.5 shadow-inner">
            <label className="text-xs text-gray-400 uppercase font-mono tracking-widest font-semibold">
              FILTRAR POR DATA:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-xs font-mono outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsFixedExpenseModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#080A0E] hover:bg-white/5 border border-[#DFBA73]/30 text-[#DFBA73] hover:text-[#F5D799] font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#DFBA73]/10 font-semibold"
            >
              <TrendingDown className="w-3.5 h-3.5 text-[#DFBA73]" />
              <span>DESPESA FIXA DA BARBEARIA</span>
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

      {/* 4 CARDS ESTRUTURA NOAH BARBER STUDIO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-semibold flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" /> {isAdmin ? "ENTRADAS BRUTAS" : "MINHA PRODUÇÃO BRUTA"}
            </span>
          </div>
          <h3 className="text-3xl font-serif text-white tracking-tight mb-1">
            R$ {(isAdmin ? displayEntradas : adrianGross).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-gray-400 font-light">
            {isAdmin 
              ? (activeTab === "all" ? "Produção total somada de toda a equipe." : "Produção bruta deste profissional.")
              : "Total gerado pelos seus cortes nesta data."}
          </p>
        </div>

        {/* Card 2: COMISSÃO ADRIAN (45%) */}
        <div className="bg-[#DFBA73]/10 border border-[#DFBA73]/30 rounded-3xl p-6 relative overflow-hidden group hover:border-[#DFBA73]/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#F5D799] font-bold flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-[#DFBA73]" /> {isAdmin ? "COMISSÃO ADRIAN (45%)" : "MINHA COMISSÃO (45%)"}
            </span>
          </div>
          <h3 className="text-3xl font-serif text-[#DFBA73] tracking-tight mb-1">
            R$ {(isAdmin ? displayComissoes : adrianCommission).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-[#DFBA73]/70 font-light">
            {isAdmin
              ? (activeTab === "all" ? "Comissão a pagar ao funcionário Adrian Santos (45%)." : "Comissão líquida do barbeiro (45%).")
              : "Sua comissão líquida a receber (45%)."}
          </p>
        </div>

        {/* Card 3: NOAH DONO (para o gestor) OU MEUS VALES (para o Adrian) */}
        {isAdmin ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-bold flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-400" /> NOAH FERREIRA (DONO · 55%)
              </span>
            </div>
            <h3 className="text-3xl font-serif text-emerald-400 tracking-tight mb-1">
              R$ {displayAdmin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-300/70 font-light">
              Faturamento do Dono Noah: produção própria + 55% de Adrian.
            </p>
          </div>
        ) : (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 relative overflow-hidden group hover:border-rose-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-300 font-bold flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> MEUS VALES / ADIANTAMENTOS
              </span>
            </div>
            <h3 className="text-3xl font-serif text-rose-400 tracking-tight mb-1">
              - R$ {totalAdrianVales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-rose-300/70 font-light">
              Total de vales e adiantamentos retirados no dia.
            </p>
          </div>
        )}

        {/* Card 4: SALDO LÍQUIDO ESTÚDIO (para o gestor) OU LÍQUIDO A RECEBER (para o Adrian) */}
        <div className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-300 font-bold flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" /> {isAdmin ? "SALDO LÍQUIDO DO ESTÚDIO" : "LÍQUIDO A RECEBER HOJE"}
            </span>
          </div>
          <h3 className="text-3xl font-serif text-white tracking-tight mb-1">
            R$ {(isAdmin ? displaySaldoLiquido : adrianNetPayout).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-gray-400 font-light">
            {isAdmin 
              ? "Receita do Dono retida menos saídas e vales diários."
              : "Comissão líquida restante após desconto dos seus vales."}
          </p>
        </div>
      </div>

      {/* SEÇÃO: SAÍDAS E VALES DO CAIXA (HOJE) */}
      <div className="bg-[#080A0E] border border-white/10 rounded-3xl p-7 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-rose-400" />
            <h3 className="text-xl font-serif text-white">
              {isAdmin ? "Saídas e Vales do Caixa (Hoje)" : "Meus Vales e Adiantamentos (Hoje)"}
            </h3>
          </div>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-rose-400" />
            <span>{isAdmin ? "+ Registrar Saída / Vale" : "+ Solicitar / Registrar Vale"}</span>
          </button>
        </div>

        {displayedExpenses.length === 0 ? (
          <div className="py-12 text-center text-gray-500 font-light text-sm italic">
            {isAdmin ? "Nenhuma saída ou vale registrado hoje." : "Nenhum vale registrado para você nesta data."}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedExpenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{exp.description}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {exp.category} {exp.barberName ? `• ${exp.barberName}` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {new Date(exp.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-rose-400 font-serif font-bold text-base">
                    - R$ {exp.amount.toFixed(2)}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
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
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative font-sans"
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
                    <div className="grid grid-cols-3 gap-2">
                      {(["VALE", "INSUMOS", "OUTROS"] as const).map((cat) => (
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
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DESPESAS FIXAS DA BARBEARIA */}
      <AnimatePresence>
        {isFixedExpenseModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative font-sans"
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
                    <div className="flex items-center gap-3">
                      <span className="text-white font-mono text-xs font-bold">
                        R$ {f.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleDeleteFixedExpense(f.id)}
                        className="text-gray-500 hover:text-red-400"
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
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
