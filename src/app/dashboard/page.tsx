"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Users,
  UserPlus,
  Clock,
  ChevronRight,
  CheckCircle,
  X,
  Shield,
  DollarSign,
  Wallet,
  ArrowUpRight,
  CreditCard,
  Sparkles,
  Calendar,
  Power,
  CheckCircle2,
  MessageCircle,
  Scissors,
  Coffee,
  Building,
  Plus,
  TrendingDown,
  Receipt,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BARBERS } from "@/lib/barbers";
import { getDisplayTime, formatMonthLong, formatMonthSlash, getBrazilNow } from "@/lib/timezone";
import { LunchBreakControl } from "@/components/LunchBreakControl";
import { ExtraServiceModal } from "@/components/ExtraServiceModal";
import WalkInModal from "@/components/WalkInModal";
import ExpenseModal from "@/components/ExpenseModal";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "ADMIN";
  const userEmail = session?.user?.email?.toLowerCase();
  const userBarberId = (session?.user as any)?.barberId;
  const isAdrian = userEmail === "adriansantos@gmail.com" || userBarberId === "barbeiro-adrian" || userRole === "BARBER";
  const isAdmin = !isAdrian && userRole === "ADMIN";
  const userName = session?.user?.name || (isAdrian ? "Adrian Santos" : "Noah Ferreira");

  // Filter Switcher: 'all' (VISÃO GERAL TODOS), 'barbeiro-noah', 'barbeiro-adrian'
  const [activeBarberFilter, setActiveBarberFilter] = useState<string>(() => (isAdrian ? "barbeiro-adrian" : "all"));

  const [dashboardData, setDashboardData] = useState<any>({
    revenue: 0,
    totalGrossShop: 0,
    houseNetProfit: 0,
    totalCommissionsToPay: 0,
    todayCount: 0,
    completedCount: 0,
    ticketMedio: 0,
    appointments: [] as any[],
    upcomingAppointments: [] as any[],
    barberBreakdown: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  // Modal de cliente balcão & Serviço Extra
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [dailyFilter, setDailyFilter] = useState<"all" | "active">("all");
  const [extraServiceApt, setExtraServiceApt] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAdrian) {
      setActiveBarberFilter("barbeiro-adrian");
      setControlledBarberId("barbeiro-adrian");
    }
  }, [isAdrian]);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Filtro por Data
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  // Disponibilidade e Almoço
  const [controlledBarberId, setControlledBarberId] = useState<string>(() => (isAdrian ? "barbeiro-adrian" : "barbeiro-noah"));
  const [isOwnerAvailable, setIsOwnerAvailable] = useState(true);
  const [earlyClosing, setEarlyClosing] = useState<string | null>(null);
  const [lunchBreak, setLunchBreak] = useState<string | null>(null);
  const [defaultLunchBreak, setDefaultLunchBreak] = useState<string | null>(null);
  const [isLunchBreakFixed, setIsLunchBreakFixed] = useState(false);
  const [hasLunchDateOverride, setHasLunchDateOverride] = useState(false);
  const [isSavingLunch, setIsSavingLunch] = useState(false);
  const [lunchBreakScope, setLunchBreakScope] = useState<"default" | "date">("default");
  const [isTogglingOwner, setIsTogglingOwner] = useState(false);

  // Modal de Cancelamento por Imprevisto com WhatsApp
  const [cancellingApt, setCancellingApt] = useState<any | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState<"imprevisto" | "ajuste" | "cliente">("imprevisto");
  const [customCancelMsg, setCustomCancelMsg] = useState("");
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);

  // Carrega status da disponibilidade no site para a data selecionada
  useEffect(() => {
    fetch(`/api/barbers?date=${selectedDate}&t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.barbers || [];
        const targetBarberId = isAdrian ? "barbeiro-adrian" : controlledBarberId;
        const target = list.find((b: any) => b.id === targetBarberId || (!isAdrian && targetBarberId === "barbeiro-noah" && b.id === "barbeiro-dono"));
        if (target) {
          setIsOwnerAvailable(target.isAvailable !== false);
          setEarlyClosing(target.earlyClosingTime || null);
          setLunchBreak(target.lunchBreakTime || null);
          setDefaultLunchBreak(target.defaultLunchBreakTime || null);
          setIsLunchBreakFixed(Boolean(target.isLunchBreakFixed));
          setHasLunchDateOverride(Boolean(target.hasLunchDateOverride));
        }
      })
      .catch(() => {});
  }, [selectedDate, isAdrian, controlledBarberId]);

  const toggleOwnerAvailability = async () => {
    setIsTogglingOwner(true);
    const newStatus = !isOwnerAvailable;
    const formattedDate = selectedDate.split("-").reverse().join("/");
    const targetBarberId = isAdrian ? "barbeiro-adrian" : controlledBarberId;
    try {
      const res = await fetch("/api/barbers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId: targetBarberId,
          isAvailable: newStatus,
          date: selectedDate,
        }),
      });
      if (res.ok) {
        setIsOwnerAvailable(newStatus);
        if (isAdrian) {
          setToastMessage(
            newStatus
              ? `Adrian Santos agora está DISPONÍVEL NO SITE em ${formattedDate}.`
              : `Adrian Santos agora está EM FOLGA (NÃO ATENDERÁ) em ${formattedDate}. O estúdio permanecerá aberto com Noah.`
          );
        } else if (targetBarberId === "barbeiro-adrian") {
          setToastMessage(
            newStatus
              ? `Adrian Santos definido como DISPONÍVEL em ${formattedDate}.`
              : `Adrian Santos definido como EM FOLGA em ${formattedDate}.`
          );
        } else {
          setToastMessage(
            newStatus
              ? `Studio ABERTO para agendamentos no dia ${formattedDate}.`
              : `Studio FECHADO apenas para o dia ${formattedDate}. Os demais dias permanecem normais.`
          );
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTogglingOwner(false);
    }
  };

  const handleSetLunchBreak = async (time: string | null, scope: "default" | "date" = lunchBreakScope) => {
    setIsSavingLunch(true);
    const targetBarberId = isAdrian ? "barbeiro-adrian" : controlledBarberId;
    try {
      const res = await fetch("/api/barbers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId: targetBarberId,
          date: selectedDate,
          lunchBreakTime: time,
          lunchBreakScope: scope,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLunchBreak(data.lunchBreakTime || time);
        setDefaultLunchBreak(data.defaultLunchBreakTime || null);
        setIsLunchBreakFixed(Boolean(data.isLunchBreakFixed));
        setHasLunchDateOverride(Boolean(data.hasLunchDateOverride));
        setLunchBreakScope(scope);
        const barberName = BARBERS.find((b) => b.id === targetBarberId)?.name || (isAdrian ? "Adrian Santos" : "Noah");
        setToastMessage(
          time
            ? `Pausa para almoço (${time}) configurada para ${barberName}.`
            : `Pausa para almoço removida para ${barberName}.`
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingLunch(false);
    }
  };

  const handleSetEarlyClosing = async (time: string | null) => {
    const formattedDate = selectedDate.split("-").reverse().join("/");
    try {
      const res = await fetch("/api/barbers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId: "barbeiro-noah",
          date: selectedDate,
          earlyClosingTime: time,
        }),
      });
      if (res.ok) {
        setEarlyClosing(time);
        setToastMessage(
          time
            ? `Expediente de ${formattedDate} encerrará mais cedo às ${time}. Horários posteriores bloqueados.`
            : `Horário normal restabelecido para o dia ${formattedDate}.`
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDashboard = async () => {
    try {
      const barberQuery = activeBarberFilter !== "all" ? `&barberId=${activeBarberFilter}` : "";
      const res = await fetch(`/api/dashboard?date=${selectedDate}${barberQuery}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setDashboardData(json);
      }
    } catch (e) {
      console.error("Erro ao carregar dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedDate, activeBarberFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch("/api/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      fetchDashboard();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Deseja remover este lançamento?")) return;
    try {
      const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        setToastMessage("Lançamento removido com sucesso.");
        fetchDashboard();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getCancelMessage = (apt: any, preset: "imprevisto" | "ajuste" | "cliente") => {
    const barberName = BARBERS.find((b) => b.id === apt.barberId)?.name.split(" ")[0] || "Noah";
    const aptTime = getDisplayTime(apt.date);
    const aptDate = apt.date ? apt.date.substring(0, 10).split("-").reverse().join("/") : "";
    const clientName = apt.user?.name || "Cliente";

    if (preset === "imprevisto") {
      return `Olá, ${clientName}! Sou o ${barberName} da Noah Barber Studio. Tive um imprevisto urgente hoje e precisei cancelar o seu horário das ${aptTime} (${aptDate}). Peço sinceras desculpas pelo ocorrido! Poderíamos reagendar para um outro horário ou dia que fique bom para você?`;
    } else if (preset === "ajuste") {
      return `Olá, ${clientName}! Informamos que seu horário das ${aptTime} (${aptDate}) na Noah Barber Studio precisou ser cancelado para ajuste da nossa agenda. O horário já está liberado caso queira remarcar pelo site ou por aqui!`;
    } else {
      return `Olá, ${clientName}! Confirmamos o cancelamento do seu agendamento no Noah Barber Studio para o dia ${aptDate} às ${aptTime}. Estamos à disposição para quando desejar agendar um novo atendimento!`;
    }
  };

  const openCancelModal = (apt: any) => {
    setCancellingApt(apt);
    setCancelReasonPreset("imprevisto");
    setCustomCancelMsg(getCancelMessage(apt, "imprevisto"));
  };

  const handleConfirmCancelWithWhatsApp = async (openWhatsApp: boolean = true) => {
    if (!cancellingApt) return;
    setIsProcessingCancel(true);
    try {
      await updateStatus(cancellingApt.id, "CANCELLED");
      setToastMessage(`Agendamento de ${cancellingApt.user?.name || "Cliente"} cancelado.`);

      const phoneDigits = (cancellingApt.user?.phone || "").replace(/\D/g, "");
      if (phoneDigits && openWhatsApp) {
        const cleanPhone = phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`;
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customCancelMsg)}`;
        window.open(whatsappUrl, "_blank");
      }
      setCancellingApt(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingCancel(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="animate-pulse text-[#DFBA73] font-mono text-sm tracking-widest uppercase">
          Carregando Painel Administrativo...
        </div>
      </div>
    );
  }

  // Filtragem e cálculos para a visão ativa (55% Noah Dono / 45% Adrian Funcionário)
  const barberBreakdown: any[] = dashboardData.barberBreakdown || [];
  const noahBreakdown = barberBreakdown.find((b) => b.id === "barbeiro-noah") || { revenue: 0, commission: 0, houseShare: 0, completedApts: 0 };
  const adrianBreakdown = barberBreakdown.find((b) => b.id === "barbeiro-adrian") || { revenue: 0, commission: 0, houseShare: 0, completedApts: 0 };

  const totalShopRevenue = dashboardData.totalGrossShop || 0;
  const adrianTotalCommission = Math.round((adrianBreakdown.revenue || 0) * 0.45 * 100) / 100;
  const noahTotalShare = (noahBreakdown.revenue || 0) + Math.round((adrianBreakdown.revenue || 0) * 0.55 * 100) / 100;

  let currentGross = totalShopRevenue;
  let currentCommissions = adrianTotalCommission;
  let currentHouseShare = noahTotalShare;
  let currentCompleted = dashboardData.completedCount || 0;

  if (activeBarberFilter === "barbeiro-noah") {
    currentGross = noahBreakdown.revenue || 0;
    currentCommissions = 0; // Dono não é funcionário comissionado
    currentHouseShare = noahTotalShare;
    currentCompleted = noahBreakdown.completedApts || 0;
  } else if (activeBarberFilter === "barbeiro-adrian") {
    currentGross = adrianBreakdown.revenue || 0;
    currentCommissions = adrianTotalCommission;
    currentHouseShare = Math.round((adrianBreakdown.revenue || 0) * 0.55 * 100) / 100;
    currentCompleted = adrianBreakdown.completedApts || 0;
  }

  const currentTicketMedio = currentCompleted > 0 ? currentGross / currentCompleted : 0;

  const upcomingList = (dashboardData.upcomingAppointments || []).filter(
    (a: any) =>
      (a.status === "CONFIRMED" || a.status === "PENDING") &&
      !a.id?.includes("almir") &&
      !a.user?.name?.toLowerCase().includes("almir")
  );
  const nextApt = upcomingList[0] || null;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-16 relative font-sans">
      {/* Toast Feedback (Padrão LAS Barber Studio) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-6 z-[160] bg-[#080A0E] border-2 border-[#DFBA73] text-white px-6 py-4 rounded-3xl shadow-2xl shadow-[#DFBA73]/25 flex items-center gap-4 max-w-md backdrop-blur-md"
          >
            <div className="w-10 h-10 rounded-full bg-[#DFBA73]/20 text-[#F5D799] border border-[#DFBA73]/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-serif font-bold text-sm text-[#DFBA73]">Caixa do Studio Atualizado</h4>
              <p className="text-gray-200 text-xs mt-0.5 leading-snug font-mono">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER PADRÃO LAS BARBER STUDIO COM IDENTIDADE NOAH BARBER STUDIO */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 font-mono shadow-lg shadow-[#DFBA73]/20">
              <Shield className="w-3.5 h-3.5" /> {isAdmin ? "PROPRIETÁRIO (DONO) • 55% Noah / 45% Adrian" : "BARBEIRO DA EQUIPE • MINHA COMISSÃO: 45%"}
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
            {isAdmin ? "Painel do Studio" : "Meus Atendimentos"} •{" "}
            <span className="text-[#F5D799] italic">{isAdmin ? "Noah Ferreira" : "Adrian Santos"}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-light">
            {isAdmin
              ? "Controle total do Noah Barber Studio, comissão de Adrian Santos (45%) e faturamento de Noah Ferreira (Dono · 55%)."
              : "Acompanhe seus horários de hoje, clientes atendidos e o cálculo da sua comissão de 45%."}
          </p>
        </div>

        {/* Date Filter & + Cliente Balcão */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#080A0E] border border-white/10 rounded-2xl px-4 py-2.5 shadow-inner">
            <label className="text-xs text-gray-400 uppercase font-mono tracking-widest font-semibold">DATA:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-xs font-mono outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold px-5 py-2.5 rounded-2xl text-xs uppercase font-mono tracking-wider transition-all shadow-lg shadow-[#DFBA73]/25 hover:brightness-110 flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> + Cliente Balcão
          </button>
        </div>
      </div>

      {/* ━━━ CARD 1: DISPONIBILIDADE DO STUDIO & CONTROLE DA AGENDA (PADRÃO LAS BARBER STUDIO COM FOTOS DE NOAH E ADRIAN) ━━━ */}
      <div className="bg-[#080A0E] border border-[#DFBA73]/30 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-2xl relative">
        <div className="flex items-center gap-5">
          {/* FOTO DO BARBEIRO SELECIONADO (NOAH OU ADRIAN) */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#DFBA73] shrink-0 shadow-lg shadow-black/50">
            <Image
              src={
                controlledBarberId === "barbeiro-adrian" || isAdrian
                  ? "/barbers/adrian-santos.jpg"
                  : "/barbers/noah-ferreira.jpg"
              }
              alt={
                controlledBarberId === "barbeiro-adrian" || isAdrian
                  ? "Adrian Santos"
                  : "Noah Ferreira"
              }
              fill
              className="object-cover object-top"
              priority
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Seletor Noah / Adrian para o Dono */}
              {isAdmin && (
                <div className="flex items-center bg-[#050608] border border-white/10 rounded-xl p-0.5 mr-1">
                  <button
                    type="button"
                    onClick={() => setControlledBarberId("barbeiro-noah")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      controlledBarberId === "barbeiro-noah"
                        ? "bg-[#DFBA73] text-black shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${controlledBarberId === "barbeiro-noah" ? "bg-black" : "bg-[#DFBA73]"}`} />
                    <span>Noah (Dono)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setControlledBarberId("barbeiro-adrian")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      controlledBarberId === "barbeiro-adrian"
                        ? "bg-[#DFBA73] text-black shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${controlledBarberId === "barbeiro-adrian" ? "bg-black" : "bg-emerald-400"}`} />
                    <span>Adrian (Equipe)</span>
                  </button>
                </div>
              )}

              <span className="text-[10px] uppercase font-bold tracking-widest text-[#F5D799] bg-[#DFBA73]/20 border border-[#DFBA73]/30 px-2.5 py-0.5 rounded-full font-mono">
                {controlledBarberId === "barbeiro-adrian" || isAdrian
                  ? "Barbeiro da Equipe • 45%"
                  : "Proprietário & Dono • 55%"}
              </span>

              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono ${
                  isOwnerAvailable
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}
              >
                {controlledBarberId === "barbeiro-adrian" || isAdrian
                  ? isOwnerAvailable
                    ? `Disponível em ${selectedDate.split("-").reverse().join("/")}`
                    : `Em Folga em ${selectedDate.split("-").reverse().join("/")}`
                  : isOwnerAvailable
                  ? `Studio Aberto em ${selectedDate.split("-").reverse().join("/")}`
                  : `Studio Fechado em ${selectedDate.split("-").reverse().join("/")}`}
              </span>

              {earlyClosing && controlledBarberId !== "barbeiro-adrian" && !isAdrian && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono bg-[#DFBA73]/20 text-[#F5D799] border border-[#DFBA73]/40">
                  Saída antecipada às {earlyClosing}
                </span>
              )}

              {lunchBreak && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  🍽️ Almoço {isLunchBreakFixed ? "Fixo" : "neste dia"}: {lunchBreak} (travado)
                </span>
              )}

              {!lunchBreak && hasLunchDateOverride && defaultLunchBreak && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono bg-white/10 text-gray-300 border border-white/20">
                  Exceção: Sem almoço hoje (Fixo: {defaultLunchBreak})
                </span>
              )}
            </div>

            <h3 className="text-xl font-serif text-white mt-1">
              {controlledBarberId === "barbeiro-adrian" || isAdrian
                ? "Adrian Santos — Noah Barber Studio"
                : "Noah Ferreira — Noah Barber Studio"}
            </h3>

            <p className="text-xs text-gray-300 mt-0.5 max-w-xl leading-relaxed font-light">
              {controlledBarberId === "barbeiro-adrian" || isAdrian
                ? isOwnerAvailable
                  ? `Disponível para agendamentos online em ${selectedDate.split("-").reverse().join("/")}.`
                  : `Folga confirmada para ${selectedDate.split("-").reverse().join("/")}. O estúdio permanecerá aberto com Noah.`
                : isOwnerAvailable
                ? `Disponível para agendamentos online em ${selectedDate.split("-").reverse().join("/")}. Os demais dias do ano continuam abertos.`
                : `Studio fechado nesta data específica (${selectedDate.split("-").reverse().join("/")}). Os outros dias continuam normais.`}
            </p>
          </div>
        </div>

        {/* CONTROLES: ALMOÇO, SAIR ANTES E STUDIO ABERTO/FECHADO */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Controle Pausa para Almoço (Fixo Diário ou Só na Data) */}
          <LunchBreakControl
            selectedDate={selectedDate}
            lunchBreak={lunchBreak}
            defaultLunchBreak={defaultLunchBreak}
            hasDateOverride={hasLunchDateOverride}
            scope={lunchBreakScope}
            saving={isSavingLunch}
            onScopeChange={setLunchBreakScope}
            onSelectTime={handleSetLunchBreak}
          />

          {/* Controle Sair Mais Cedo nesta data (Apenas para o Dono Noah) */}
          {(!isAdrian && controlledBarberId === "barbeiro-noah") && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
              <Clock className="w-3.5 h-3.5 text-[#DFBA73]" />
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider whitespace-nowrap">
                Sair antes:
              </span>
              <select
                value={earlyClosing || ""}
                onChange={(e) => handleSetEarlyClosing(e.target.value || null)}
                className="bg-transparent text-white text-xs font-mono outline-none cursor-pointer"
              >
                <option value="" className="bg-[#080A0E] text-white">Horário normal (20h)</option>
                <option value="19:00" className="bg-[#080A0E] text-white">Encerrar às 19:00</option>
                <option value="18:00" className="bg-[#080A0E] text-white">Encerrar às 18:00</option>
                <option value="17:00" className="bg-[#080A0E] text-white">Encerrar às 17:00</option>
                <option value="16:00" className="bg-[#080A0E] text-white">Encerrar às 16:00</option>
                <option value="15:00" className="bg-[#080A0E] text-white">Encerrar às 15:00</option>
                <option value="14:00" className="bg-[#080A0E] text-white">Encerrar às 14:00</option>
              </select>
            </div>
          )}

          {/* Botão Studio Aberto / Fechado (Dono) ou Folga (Adrian) */}
          <button
            onClick={toggleOwnerAvailability}
            disabled={isTogglingOwner}
            className={`px-5 py-3 rounded-2xl font-bold uppercase tracking-wider text-xs font-mono transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0 ${
              isOwnerAvailable
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black"
                : "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500 hover:text-white"
            }`}
          >
            <Power className="w-4 h-4" />
            <span>
              {isTogglingOwner
                ? "Atualizando..."
                : controlledBarberId === "barbeiro-adrian" || isAdrian
                ? isOwnerAvailable
                  ? "🟢 Trabalhar Hoje"
                  : "🔴 Folga na Data"
                : isOwnerAvailable
                ? "Studio Aberto"
                : "Studio Fechado"}
            </span>
          </button>
        </div>
      </div>

      {/* ━━━ CARD 2: PRÓXIMOS AGENDAMENTOS CONFIRMADOS (PADRÃO LAS BARBER STUDIO) ━━━ */}
      {nextApt ? (
        <div className="bg-gradient-to-r from-[#DFBA73]/15 via-[#080A0E] to-[#050608] border-2 border-[#DFBA73]/40 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#DFBA73]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

          <div className="flex items-start gap-5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#DFBA73]/20 border border-[#DFBA73]/40 text-[#F5D799] flex items-center justify-center shrink-0 mt-1 shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#F5D799] bg-[#DFBA73]/20 border border-[#DFBA73]/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Próximos Agendamentos Confirmados
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 font-mono">
                  {upcomingList.length} {upcomingList.length === 1 ? "cliente na fila" : "clientes na fila"}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-serif text-white mt-1">
                Próximo cliente: <span className="text-[#F5D799]">{nextApt.user?.name || "Cliente"}</span> em{" "}
                {new Date(nextApt.date).toLocaleDateString("pt-BR")} às {getDisplayTime(nextApt.date)}
              </h3>
              <p className="text-xs text-gray-300 mt-1 flex items-center flex-wrap gap-2">
                <span>Serviço: <strong>{nextApt.service?.name}</strong> (R$ {Number(nextApt.service?.price || 0).toFixed(2)})</span>
                <span>•</span>
                <span className="text-[#DFBA73]">
                  ✂️ {BARBERS.find((b) => b.id === nextApt.barberId)?.name || "Noah Ferreira"}
                </span>
                <span>•</span>
                <span className="text-[#F5D799] font-mono">
                  {nextApt.barberId === "barbeiro-adrian"
                    ? `Comissão Adrian: R$ ${(Math.round((nextApt.service?.price || 0) * 0.45 * 100) / 100).toFixed(2)} (45%)`
                    : `Atendimento Dono: R$ ${(nextApt.service?.price || 0).toFixed(2)}`}
                </span>
                {nextApt.user?.phone && (
                  <>
                    <span>•</span>
                    <span className="font-mono">whatsapp: {nextApt.user.phone}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap relative z-10">
            {nextApt.user?.phone && (
              <a
                href={`https://wa.me/55${String(nextApt.user.phone).replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Olá, ${nextApt.user.name || "Cliente"}! Sou o ${BARBERS.find((b) => b.id === nextApt.barberId)?.name.split(" ")[0] || "Noah"} da Noah Barber Studio. Confirmando seu atendimento às ${getDisplayTime(nextApt.date)}!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-3 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/40 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
            <button
              onClick={() => setExtraServiceApt(nextApt)}
              className="px-4 py-3 rounded-2xl bg-[#DFBA73]/15 hover:bg-[#DFBA73] text-[#F5D799] hover:text-black border border-[#DFBA73]/40 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Serviço Extra
            </button>
            <button
              onClick={() => updateStatus(nextApt.id, "COMPLETED")}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold text-xs uppercase font-mono tracking-wider shadow-lg shadow-[#DFBA73]/25 hover:brightness-110 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Concluir Atendimento
            </button>
            <Link
              href="/dashboard/agenda"
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider font-mono transition-all flex items-center gap-1"
            >
              <span>Ver na Agenda</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-gray-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-serif text-white">Próximos Agendamentos Confirmados</h4>
              <p className="text-xs text-gray-400">Não há nenhum atendimento futuro pendente no momento.</p>
            </div>
          </div>
          <span className="text-xs font-mono text-gray-500">0 agendados</span>
        </div>
      )}

      {/* TABS DE FILTRO DE PROFISSIONAL (VISÃO GERAL / NOAH / ADRIAN) */}
      {isAdmin ? (
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto scrollbar-hide overscroll-x-contain touch-pan-y">
          <button
            onClick={() => setActiveBarberFilter("all")}
            className={`px-5 py-2.5 rounded-2xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeBarberFilter === "all"
                ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow-lg shadow-[#DFBA73]/25 border border-[#DFBA73]"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            VISÃO GERAL DO ESTÚDIO
          </button>

          <button
            onClick={() => setActiveBarberFilter("barbeiro-noah")}
            className={`px-5 py-2.5 rounded-2xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeBarberFilter === "barbeiro-noah"
                ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow-lg shadow-[#DFBA73]/25 border border-[#DFBA73]"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            <span>✂️</span>
            <span>NOAH FERREIRA (DONO · 55%)</span>
          </button>

          <button
            onClick={() => setActiveBarberFilter("barbeiro-adrian")}
            className={`px-5 py-2.5 rounded-2xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeBarberFilter === "barbeiro-adrian"
                ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow-lg shadow-[#DFBA73]/25 border border-[#DFBA73]"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            <span>✂️</span>
            <span>ADRIAN SANTOS (45%)</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <div className="px-5 py-2.5 rounded-2xl font-mono text-xs uppercase tracking-wider font-bold bg-[#DFBA73]/20 border border-[#DFBA73]/40 text-[#F5D799] flex items-center gap-2">
            <span>✂️</span>
            <span>ADRIAN SANTOS (MINHA PRODUÇÃO · 45%)</span>
          </div>
        </div>
      )}

      {/* BENTO METRICS GRID (ESTILO LAS BARBER STUDIO COM REGRAS 55%/45% DO NOAH) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-5`}>
        {/* Card 1: Destaque Dourado (Padrão LAS Bento Card 1) */}
        <div className="bg-gradient-to-br from-[#DFBA73]/15 via-[#080A0E] to-[#050608] border border-[#DFBA73]/40 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#DFBA73]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#F5D799] font-mono">
                {isAdmin ? "Faturamento Bruto" : "Minha Produção Bruta"}
              </p>
              <h3 className="text-3xl font-serif font-bold text-white mt-2">
                R$ {currentGross.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F5D799] to-[#DFBA73] text-black flex items-center justify-center shadow-lg shadow-[#DFBA73]/20 shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-gray-300 mt-4 pt-3 border-t border-white/10 font-light relative z-10">
            {isAdmin
              ? activeBarberFilter === "all"
                ? "Soma do faturamento concluído pela equipe na data."
                : "Produção bruta concluída por este profissional."
              : "Total bruto gerado pelos seus atendimentos concluídos."}
          </p>
        </div>

        {/* Card 2: Comissão Adrian (45%) */}
        <div className="bg-[#080A0E] border border-white/10 hover:border-[#DFBA73]/40 transition-all rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#DFBA73] font-mono">
                {isAdmin ? "Adrian Santos (45%)" : "Minha Comissão (45%)"}
              </p>
              <h3 className="text-3xl font-serif font-bold text-[#F5D799] mt-2">
                R$ {currentCommissions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#DFBA73] shrink-0">
              <Scissors className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-white/10 font-light">
            {isAdmin
              ? activeBarberFilter === "barbeiro-noah"
                ? "Noah é o Dono (não comissionado)."
                : "Repasse de 45% sobre cortes do funcionário Adrian."
              : "Sua comissão líquida a receber (45%)."}
          </p>
        </div>

        {/* Card 3: Noah Ferreira (Dono · 55%) - EXCLUSIVO PARA O DONO */}
        {isAdmin && (
          <div className="bg-[#080A0E] border border-white/10 hover:border-emerald-500/40 transition-all rounded-3xl p-6 flex flex-col justify-between shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 font-mono">
                  Noah Ferreira (Dono · 55%)
                </p>
                <h3 className="text-3xl font-serif font-bold text-emerald-400 mt-2">
                  R$ {currentHouseShare.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                <Building className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-white/10 font-light">
              Produção própria do Dono + repasse de 55% do Adrian.
            </p>
          </div>
        )}

        {/* Card 4: Atendimentos & Ticket Médio */}
        <div className="bg-[#080A0E] border border-white/10 hover:border-white/20 transition-all rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 font-mono">
                {isAdmin ? "Atendimentos Concluídos" : "Meus Atendimentos"}
              </p>
              <h3 className="text-3xl font-serif font-bold text-white mt-2">
                {currentCompleted} cortes
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#DFBA73] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-white/10 font-light">
            Ticket médio: <span className="text-white font-mono">R$ {currentTicketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </p>
        </div>
      </div>

      {/* ━━━ CONTROLE MENSAL • PADRÃO LAS BARBER STUDIO (PRODUÇÃO BRUTA, PREVISTO, DESPESAS E LUCRO LÍQUIDO) ━━━ */}
      {dashboardData?.monthlySummary && (() => {
        const ms = dashboardData.monthlySummary;
        const activeMonth = ms.month || selectedDate.slice(0, 7);
        const monthLong = formatMonthLong(activeMonth);
        const currentBrazilMonth = getBrazilNow().date.slice(0, 7);
        const isCurrentMonth = activeMonth === currentBrazilMonth;

        let mGross = 0;
        let mNetProd = 0;
        let mExpenses = 0;
        let mNetProfit = 0;
        let mExpected = 0;
        let mCompletedCount = 0;
        let mModelSubtitle = "";

        if (isAdrian) {
          mGross = ms.grossRevenue ?? 0;
          mNetProd = ms.netProduction ?? 0;
          mExpenses = ms.expenses ?? 0;
          mNetProfit = ms.netProfit ?? 0;
          mExpected = ms.expectedNetRevenue ?? ms.expectedRevenue ?? 0;
          mCompletedCount = ms.completedCount ?? 0;
          mModelSubtitle = "Minha Comissão (45%) • Controle de Produção e Vales";
        } else if (activeBarberFilter === "barbeiro-noah") {
          mGross = ms.noah?.gross ?? 0;
          mNetProd = ms.noah?.ownPlusHouseShare ?? 0;
          mExpenses = ms.noah?.expenses ?? 0;
          mNetProfit = ms.studioNetProfit ?? 0;
          mExpected = ms.noah?.expected ?? 0;
          mCompletedCount = ms.noah?.completedCount ?? 0;
          mModelSubtitle = "Noah Ferreira (Dono · 55% Adrian + 100% próprios) • Controle de Produção e Custos";
        } else if (activeBarberFilter === "barbeiro-adrian") {
          mGross = ms.adrian?.gross ?? 0;
          mNetProd = ms.adrian?.commission ?? 0;
          mExpenses = ms.adrian?.vales ?? 0;
          mNetProfit = ms.adrian?.netProfit ?? 0;
          mExpected = ms.adrian?.expectedCommission ?? 0;
          mCompletedCount = ms.adrian?.completedCount ?? 0;
          mModelSubtitle = "Adrian Santos (Funcionário · 45%) • Controle de Comissão e Vales";
        } else {
          mGross = ms.studioGross ?? 0;
          mNetProd = ms.noahNetProduction ?? 0;
          mExpenses = ms.studioExpenses ?? 0;
          mNetProfit = ms.studioNetProfit ?? 0;
          mExpected = ms.studioExpected ?? 0;
          mCompletedCount = ms.totalCompletedCount ?? 0;
          mModelSubtitle = "Equipe: 55% Noah (Dono) / 45% Adrian • Controle de Produção e Custos";
        }

        const displayGrossForFormula = isAdrian || activeBarberFilter === "barbeiro-adrian" ? mNetProd : activeBarberFilter === "all" ? mNetProd : mNetProd;

        return (
          <div className="bg-gradient-to-br from-[#0B0E14] via-[#080A0E] to-[#050608] border border-[#DFBA73]/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-48 h-48 bg-[#DFBA73]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-black bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] px-3 py-1 rounded-full font-bold shadow-md shadow-[#DFBA73]/20">
                    CONTROLE MENSAL • {monthLong.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                    {mCompletedCount} {mCompletedCount === 1 ? "corte concluído" : "cortes concluídos"}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-white">
                  {isCurrentMonth ? "Fechamento Parcial" : "Fechamento Mensal"} •{" "}
                  <span className="text-[#F5D799] italic">{monthLong}</span>
                </h3>
                <p className="text-xs text-gray-400 font-light mt-0.5">{mModelSubtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="px-4 py-2 rounded-2xl bg-[#DFBA73]/10 border border-[#DFBA73]/30 text-xs font-mono">
                  <span className="text-gray-400">Previsto: </span>
                  <strong className="text-[#F5D799]">
                    R$ {mExpected.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <Link
                  href="/dashboard/financeiro"
                  className="px-4 py-2.5 rounded-2xl bg-[#DFBA73]/15 hover:bg-[#DFBA73] text-[#F5D799] hover:text-black border border-[#DFBA73]/40 text-[11px] font-mono font-bold uppercase tracking-wider transition-all text-center shrink-0"
                >
                  {isAdmin ? "Gestão Financeira Completa →" : "Ver Meu Caixa & Vales →"}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              {/* (+) PRODUÇÃO BRUTA */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                  (+) PRODUÇÃO BRUTA
                </span>
                <p className="text-2xl md:text-3xl font-serif font-bold text-white mt-2">
                  R$ {mGross.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-gray-400 mt-2 pt-2 border-t border-white/5 font-light">
                  {isAdrian || activeBarberFilter === "barbeiro-adrian"
                    ? `Sua parte líquida (45%): R$ ${mNetProd.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : activeBarberFilter === "all"
                    ? `Parte Dono Noah (c/ 55% Adrian): R$ ${displayGrossForFormula.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : `Produção Dono + 55% Adrian: R$ ${mNetProd.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                </p>
              </div>

              {/* (-) GASTOS NO MÊS */}
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-rose-300 font-bold">
                  (-) {isAdrian || activeBarberFilter === "barbeiro-adrian" ? "VALES / GASTOS NO MÊS" : "GASTOS NO MÊS"}
                </span>
                <p className="text-2xl md:text-3xl font-serif font-bold text-rose-400 mt-2">
                  R$ {mExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-rose-300/75 mt-2 pt-2 border-t border-rose-500/20 font-light">
                  {isAdrian || activeBarberFilter === "barbeiro-adrian"
                    ? "Total de vales e adiantamentos retirados no mês."
                    : "Insumos, custos fixos e outros gastos lançados no mês."}
                </p>
              </div>

              {/* (=) LUCRO LÍQUIDO */}
              <div
                className={`${
                  mNetProfit >= 0
                    ? "bg-emerald-500/10 border-emerald-500/35"
                    : "bg-rose-500/15 border-rose-500/40"
                } border rounded-2xl p-5 flex flex-col justify-between`}
              >
                <span
                  className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                    mNetProfit >= 0 ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  (=) {isAdrian || activeBarberFilter === "barbeiro-adrian" ? "LÍQUIDO A RECEBER" : "LUCRO LÍQUIDO"}
                </span>
                <p
                  className={`text-2xl md:text-3xl font-serif font-bold mt-2 ${
                    mNetProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  R$ {mNetProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p
                  className={`text-[11px] mt-2 pt-2 border-t font-light ${
                    mNetProfit >= 0 ? "text-emerald-300/80 border-emerald-500/20" : "text-rose-300/80 border-rose-500/20"
                  }`}
                >
                  {isAdrian || activeBarberFilter === "barbeiro-adrian"
                    ? "Comissão de 45% menos os vales retirados no mês."
                    : "Receita líquida do estúdio após despesas do mês."}
                </p>
              </div>
            </div>

            {isAdmin && activeBarberFilter === "all" && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono text-gray-400 relative z-10">
                <span>
                  ✂️ Noah Ferreira (Dono · próprios + 55%):{" "}
                  <strong className="text-emerald-400">
                    R$ {(ms.noah?.ownPlusHouseShare ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </strong>
                </span>
                <span>
                  ✂️ Adrian Santos (Funcionário · 45%):{" "}
                  <strong className="text-[#F5D799]">
                    R$ {(ms.adrian?.commission ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </strong>{" "}
                  <span className="text-rose-400">
                    (Vales: - R$ {(ms.adrian?.vales ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                  </span>
                </span>
              </div>
            )}

            {/* ━━━ FATURAMENTO DIA A DIA — NOVEMBRO / 2026 (IGUAL ABA ÚNICO LAS BARBER STUDIO) ━━━ */}
            {(() => {
              const monthSlash = formatMonthSlash(activeMonth);
              const todayBr = getBrazilNow().date;
              const rawDays: any[] = ms.dailyBreakdown || [];
              const mappedDays = rawDays.map((item: any) => {
                if (isAdrian) {
                  return {
                    date: item.date,
                    dayStr: item.dayStr,
                    weekday: item.weekday,
                    gross: item.gross ?? 0,
                    expected: item.expectedCommission ?? item.expected ?? 0,
                    expenses: item.expenses ?? 0,
                    net: item.net ?? 0,
                    netAccumulated: item.netAccumulated ?? 0,
                    completedCount: item.completedCount ?? 0,
                    scheduledCount: item.scheduledCount ?? 0,
                  };
                }
                const slice =
                  activeBarberFilter === "barbeiro-noah"
                    ? item.noah
                    : activeBarberFilter === "barbeiro-adrian"
                    ? item.adrian
                    : item.studio;
                return {
                  date: item.date,
                  dayStr: item.dayStr,
                  weekday: item.weekday,
                  gross: slice?.gross ?? 0,
                  expected: activeBarberFilter === "barbeiro-adrian" ? slice?.expectedCommission ?? 0 : slice?.expected ?? 0,
                  expenses: activeBarberFilter === "barbeiro-adrian" ? slice?.vales ?? 0 : slice?.expenses ?? 0,
                  net: slice?.net ?? 0,
                  netAccumulated: slice?.netAccumulated ?? 0,
                  completedCount: slice?.completedCount ?? 0,
                  scheduledCount: slice?.scheduledCount ?? 0,
                };
              });

              const lastDayPadded = String(ms.daysInMonth || mappedDays.length || 30).padStart(2, "0");
              const visibleDays =
                dailyFilter === "active"
                  ? mappedDays.filter(
                      (d) =>
                        d.gross > 0 ||
                        d.expenses > 0 ||
                        d.expected > 0 ||
                        d.completedCount > 0 ||
                        d.scheduledCount > 0
                    )
                  : mappedDays;

              const rawExpenses: any[] = ms.expensesList || [];
              const visibleExpenses = isAdrian
                ? rawExpenses.filter((e) => e.barberId === "barbeiro-adrian")
                : activeBarberFilter === "barbeiro-adrian"
                ? rawExpenses.filter((e) => e.barberId === "barbeiro-adrian")
                : activeBarberFilter === "barbeiro-noah"
                ? rawExpenses.filter((e) => e.barberId !== "barbeiro-adrian")
                : rawExpenses;

              return (
                <div className="space-y-6 pt-4 border-t border-white/10 relative z-10">
                  {/* Cabeçalho Faturamento Dia a Dia */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-lg md:text-xl font-serif text-white">
                        Faturamento Dia a Dia — <span className="text-[#F5D799] italic">{monthSlash}</span>
                      </h4>
                      <p className="text-xs text-gray-400 font-light mt-0.5">
                        Acompanhamento de cada dia até somar o total do mês. Toque em um dia para abrir os atendimentos daquela data.
                      </p>
                    </div>

                    <div className="flex items-center bg-[#050608] border border-white/10 rounded-2xl p-1 self-start lg:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setDailyFilter("all")}
                        className={`px-3.5 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                          dailyFilter === "all"
                            ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Todos os dias (01–{lastDayPadded})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDailyFilter("active")}
                        className={`px-3.5 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                          dailyFilter === "active"
                            ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Com movimento
                      </button>
                    </div>
                  </div>

                  {/* Lista clicável dos dias */}
                  {visibleDays.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-xs italic bg-white/[0.01] border border-white/5 rounded-2xl">
                      Nenhum dia com movimentação registrada neste mês.
                    </div>
                  ) : (
                    <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2">
                      {visibleDays.map((day) => {
                        const isSelected = day.date === selectedDate;
                        const isToday = day.date === todayBr;
                        const hasActivity =
                          day.gross > 0 || day.expenses > 0 || day.expected > 0 || day.completedCount > 0;

                        return (
                          <button
                            key={day.date}
                            type="button"
                            onClick={() => {
                              setSelectedDate(day.date);
                              const target = document.getElementById("atendimentos-do-dia");
                              if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? "bg-[#DFBA73]/15 border-[#DFBA73] shadow-lg shadow-[#DFBA73]/10"
                                : isToday
                                ? "bg-[#DFBA73]/10 border-[#DFBA73]/40 hover:border-[#DFBA73]"
                                : hasActivity
                                ? "bg-white/[0.03] border-white/10 hover:border-[#DFBA73]/40"
                                : "bg-white/[0.01] border-white/5 opacity-60 hover:opacity-100 hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-mono shrink-0 border ${
                                  isSelected || isToday
                                    ? "bg-[#DFBA73] text-black border-[#DFBA73] font-bold"
                                    : "bg-[#050608] text-[#F5D799] border-[#DFBA73]/25"
                                }`}
                              >
                                <span className="text-xs font-bold leading-none">{day.dayStr.split("/")[0]}</span>
                                <span
                                  className={`text-[9px] uppercase mt-0.5 ${
                                    isSelected || isToday ? "text-black/80" : "text-gray-400"
                                  }`}
                                >
                                  {day.weekday}
                                </span>
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-serif text-white font-semibold">
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
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 sm:gap-5 text-left sm:text-right font-mono shrink-0">
                              <div>
                                <span className="text-[9px] uppercase text-gray-500 block">Dia</span>
                                <span className="text-xs font-bold text-white">
                                  R$ {day.gross.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase text-gray-500 block">Gastos</span>
                                <span className={`text-xs font-bold ${day.expenses > 0 ? "text-rose-400" : "text-gray-500"}`}>
                                  {day.expenses > 0
                                    ? `- R$ ${day.expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                                    : "R$ 0,00"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase text-[#DFBA73] block">Acumulado</span>
                                <span
                                  className={`text-xs font-bold ${
                                    day.netAccumulated >= 0 ? "text-[#F5D799]" : "text-rose-400"
                                  }`}
                                >
                                  R$ {day.netAccumulated.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* LANÇAMENTOS DE DESPESAS & VALES EM NOVEMBRO / 2026 + NOVO LANÇAMENTO */}
                  <div className="pt-5 border-t border-white/10 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-base md:text-lg font-serif text-white">
                            {isAdrian
                              ? `Meus Vales & Gastos em ${monthSlash}`
                              : `Lançamentos de Despesas & Vales em ${monthSlash}`}
                          </h4>
                          <p className="text-[11px] text-gray-400 font-light">
                            {visibleExpenses.length}{" "}
                            {visibleExpenses.length === 1 ? "lançamento registrado" : "lançamentos registrados"} no mês
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-[#DFBA73]/20 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Novo lançamento</span>
                      </button>
                    </div>

                    {visibleExpenses.length === 0 ? (
                      <div className="py-6 text-center text-gray-500 text-xs italic bg-white/[0.01] border border-white/5 rounded-2xl">
                        {isAdrian
                          ? "Nenhum vale ou gasto lançado para você neste mês."
                          : "Nenhuma despesa ou vale lançado neste mês."}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {visibleExpenses.map((exp: any) => (
                          <div
                            key={exp.id}
                            className="bg-white/[0.02] border border-white/5 hover:border-white/15 rounded-2xl p-3.5 flex items-center justify-between gap-4 transition-all"
                          >
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white text-xs sm:text-sm font-medium">{exp.description}</span>
                                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/25">
                                  {exp.category} {exp.barberName ? `• ${exp.barberName}` : ""}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                                {new Date(exp.date).toLocaleDateString("pt-BR")}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-rose-400 font-serif font-bold text-sm">
                                - R$ {Number(exp.amount || 0).toFixed(2)}
                              </span>
                              {(isAdmin || exp.barberId === "barbeiro-adrian") && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1.5 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Remover lançamento"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* DETALHAMENTO DA EQUIPE (NOAH 55% + ADRIAN 45%) - EXCLUSIVO PARA O GESTOR */}
      {isAdmin && (
        <div className="space-y-4">
          <h3 className="text-xl font-serif text-white flex items-center gap-2">
            <span>👥</span> Rendimento e Comissões por Barbeiro
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {barberBreakdown.map((barber) => {
              const isOwner = barber.isOwner;
              return (
                <div
                  key={barber.id}
                  className="bg-[#080A0E] border border-white/10 hover:border-white/20 rounded-3xl p-6 flex flex-col justify-between gap-6 transition-all shadow-lg"
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-white font-serif font-bold text-lg">
                          {barber.name} {isOwner ? "(Dono)" : ""}
                        </h4>
                        <span className={`text-[10px] uppercase font-bold font-mono tracking-wider px-2.5 py-0.5 rounded-full ${
                          isOwner
                            ? "bg-[#DFBA73]/20 border border-[#DFBA73]/40 text-[#F5D799]"
                            : "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                        }`}>
                          {isOwner ? "DONO · 55%" : "FUNCIONÁRIO · 45%"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 font-light">
                        {isOwner ? "Proprietário da Barbearia" : "Barbeiro da Equipe"} • {barber.completedApts || 0} cortes hoje
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400">Produção Bruta:</span>
                      <span className="text-white font-bold">R$ {barber.revenue.toFixed(2)}</span>
                    </div>
                    {isOwner ? (
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-emerald-400 font-semibold">Produção Própria do Dono:</span>
                        <span className="text-emerald-400 font-bold">R$ {barber.revenue.toFixed(2)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[#DFBA73] font-semibold">Comissão Adrian (45%):</span>
                          <span className="text-[#DFBA73] font-bold">R$ {(barber.revenue * 0.45).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-white/5">
                          <span className="text-emerald-400 font-semibold">Repasse Dono Noah (55%):</span>
                          <span className="text-emerald-400 font-bold">+ R$ {(barber.revenue * 0.55).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LISTA DE ATENDIMENTOS DO DIA COM TAG DE COMISSÃO */}
      <div id="atendimentos-do-dia" className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div>
            <h3 className="text-xl font-serif text-white">
              Atendimentos do Dia • {selectedDate.split("-").reverse().join("/")}
            </h3>
            <p className="text-xs text-gray-400 font-light mt-0.5">
              {activeBarberFilter === "all" ? "Todos os barbeiros" : BARBERS.find((b) => b.id === activeBarberFilter)?.name}
            </p>
          </div>
          <span className="text-xs text-[#DFBA73] font-mono">
            {dashboardData.appointments?.length || 0} registros
          </span>
        </div>

        {dashboardData.appointments?.length === 0 ? (
          <div className="py-16 text-center text-gray-500 italic font-light">
            Nenhum atendimento registrado para esta data.
          </div>
        ) : (
          <div className="grid gap-3.5">
            {dashboardData.appointments.map((apt: any) => {
              const aptTime = getDisplayTime(apt.date);
              const cutPrice = Number(apt.service?.price || 0);
              const isAdrian = apt.barberId === "barbeiro-adrian";
              const commissionValue = isAdrian ? Math.round(cutPrice * 0.45 * 100) / 100 : cutPrice;
              const barberAttendant = BARBERS.find((b) => b.id === apt.barberId) || BARBERS[0];

              return (
                <div
                  key={apt.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-5 bg-white/[0.02] border rounded-2xl transition-all gap-4 overflow-hidden ${
                    apt.status === "CANCELLED"
                      ? "border-red-500/20 opacity-50"
                      : "border-white/5 hover:border-[#DFBA73]/40"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-16 h-16 rounded-2xl bg-[#050608] border border-[#DFBA73]/30 flex flex-col items-center justify-center font-mono shrink-0 shadow-md">
                      <span className="text-[9px] text-gray-500 font-light">HORA</span>
                      <span className="text-sm font-bold text-[#F5D799]">{aptTime}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-white font-medium text-base sm:text-lg truncate">
                          {apt.user?.name || "Cliente"}
                        </h4>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-medium bg-[#DFBA73]/15 border border-[#DFBA73]/30 text-[#DFBA73] shrink-0 font-mono">
                          ✂️ {barberAttendant.name.split(" ")[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 flex-wrap">
                        <span className="text-gray-200 font-medium">{apt.service?.name}</span>
                        <span>•</span>
                        <span className="text-white font-mono font-bold">R$ {cutPrice.toFixed(2)}</span>
                        <span>•</span>
                        <span className="text-[#DFBA73] font-mono font-semibold">
                          {isAdrian 
                            ? `Comissão Adrian: R$ ${commissionValue.toFixed(2)} (45%)` 
                            : `Atendimento Dono: R$ ${cutPrice.toFixed(2)}`}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        whatsapp: {apt.user?.phone || "Não informado"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <span
                      className={`text-[10px] font-mono uppercase font-bold tracking-wider px-3 py-1 rounded-xl border ${
                        apt.status === "COMPLETED"
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                          : apt.status === "CANCELLED"
                          ? "border-red-500/30 text-red-400 bg-red-500/10"
                          : "border-[#DFBA73]/30 text-[#F5D799] bg-[#DFBA73]/10"
                      }`}
                    >
                      {apt.status === "COMPLETED" ? "CONCLUÍDO" : apt.status === "CANCELLED" ? "CANCELADO" : "CONFIRMADO"}
                    </span>

                    {apt.status !== "CANCELLED" && (
                      <button
                        onClick={() => setExtraServiceApt(apt)}
                        className="px-3 py-1.5 rounded-xl bg-[#DFBA73]/15 hover:bg-[#DFBA73] text-[#F5D799] hover:text-black border border-[#DFBA73]/30 text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Adicionar serviço extra neste atendimento"
                      >
                        <Plus className="w-3.5 h-3.5" /> Serviço Extra
                      </button>
                    )}

                    {apt.status !== "COMPLETED" && apt.status !== "CANCELLED" && (
                      <button
                        onClick={() => updateStatus(apt.id, "COMPLETED")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black text-xs font-semibold transition-all cursor-pointer"
                      >
                        Concluir
                      </button>
                    )}

                    {apt.status !== "CANCELLED" && (
                      <button
                        onClick={() => openCancelModal(apt)}
                        className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        CANCELAR
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL CLIENTE BALCÃO COMPARTILHADO */}
      <WalkInModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isAdmin={isAdmin}
        defaultDate={selectedDate}
        onSuccess={(msg) => {
          setToastMessage(msg);
          fetchDashboard();
        }}
      />

      {/* MODAL ADICIONAR SERVIÇO EXTRA */}
      <ExtraServiceModal
        appointment={extraServiceApt}
        onClose={() => setExtraServiceApt(null)}
        onSuccess={(msg) => {
          setToastMessage(msg);
          fetchDashboard();
        }}
      />

      {/* MODAL NOVO LANÇAMENTO DE DESPESA / VALE */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        isAdmin={isAdmin}
        selectedDate={selectedDate}
        selectedMonth={selectedDate.slice(0, 7)}
        defaultCategory={isAdmin && activeBarberFilter !== "barbeiro-adrian" ? "FIXA" : "VALE"}
        defaultBarberName={activeBarberFilter === "barbeiro-noah" ? "Noah Ferreira" : "Adrian Santos"}
        onSuccess={(msg) => {
          setToastMessage(msg);
          fetchDashboard();
        }}
      />

      {/* MODAL CANCELAMENTO */}
      <AnimatePresence>
        {cancellingApt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative font-sans"
            >
              <button onClick={() => setCancellingApt(null)} className="absolute top-6 right-6 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-serif text-white mb-2">Cancelar Atendimento</h3>
              <p className="text-xs text-gray-400 mb-4">
                Cliente: <strong className="text-white">{cancellingApt.user?.name || "Cliente"}</strong>
              </p>

              <div className="space-y-4">
                <textarea
                  rows={4}
                  value={customCancelMsg}
                  onChange={(e) => setCustomCancelMsg(e.target.value)}
                  className="w-full bg-[#050608] border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-red-500 resize-none font-sans"
                />

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleConfirmCancelWithWhatsApp(true)}
                    disabled={isProcessingCancel}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase font-mono tracking-wider text-xs py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Confirmar & Notificar no WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleConfirmCancelWithWhatsApp(false)}
                    disabled={isProcessingCancel}
                    className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-mono text-xs uppercase py-2 rounded-xl transition-all"
                  >
                    Cancelar Apenas no Sistema
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
