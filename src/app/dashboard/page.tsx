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
} from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { BARBERS, BarberData, BARBER_COMMISSION_RATE, HOUSE_COMMISSION_RATE } from "@/lib/barbers";
import { OFFICIAL_SERVICES, ServiceItem } from "@/lib/services";
import { getDisplayTime } from "@/lib/timezone";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Noah Ferreira";
  const userRole = (session?.user as any)?.role || "ADMIN";
  const isAdmin = userRole === "ADMIN";

  // Filter Switcher: 'all' (VISÃO GERAL TODOS), 'barbeiro-noah', 'barbeiro-adrian'
  const [activeBarberFilter, setActiveBarberFilter] = useState<string>("all");

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

  // Modal de cliente balcão
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [services] = useState<ServiceItem[]>(OFFICIAL_SERVICES);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("corte-cabelo");
  const [walkInBarberId, setWalkInBarberId] = useState<string>("barbeiro-noah");
  const [walkInClientName, setWalkInClientName] = useState<string>("Cliente Balcão");
  const [walkInClientPhone, setWalkInClientPhone] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("PIX");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
  const [controlledBarberId, setControlledBarberId] = useState<string>("barbeiro-noah");
  const [isOwnerAvailable, setIsOwnerAvailable] = useState(true);
  const [earlyClosing, setEarlyClosing] = useState<string | null>(null);
  const [lunchBreak, setLunchBreak] = useState<string | null>(null);
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
        const owner = list.find((b: any) => b.id === "barbeiro-noah" || b.id === "barbeiro-dono");
        if (owner) {
          setIsOwnerAvailable(owner.isAvailable !== false);
          setEarlyClosing(owner.earlyClosingTime || null);
          setLunchBreak(owner.lunchBreakTime || null);
        }
      })
      .catch(() => {});
  }, [selectedDate]);

  const toggleOwnerAvailability = async () => {
    setIsTogglingOwner(true);
    const newStatus = !isOwnerAvailable;
    const formattedDate = selectedDate.split("-").reverse().join("/");
    try {
      const res = await fetch("/api/barbers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId: "barbeiro-noah",
          isAvailable: newStatus,
          date: selectedDate,
        }),
      });
      if (res.ok) {
        setIsOwnerAvailable(newStatus);
        setToastMessage(
          newStatus
            ? `Noah Ferreira (Dono) DISPONÍVEL NO SITE em ${formattedDate}.`
            : `Noah Ferreira (Dono) EM FOLGA (OCULTO NO SITE) em ${formattedDate}.`
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTogglingOwner(false);
    }
  };

  const handleSetLunchBreak = async (time: string | null) => {
    try {
      const res = await fetch("/api/barbers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId: controlledBarberId,
          date: selectedDate,
          lunchBreakTime: time,
          lunchBreakScope,
        }),
      });
      if (res.ok) {
        setLunchBreak(time);
        const barberName = BARBERS.find((b) => b.id === controlledBarberId)?.name || "Noah";
        setToastMessage(
          time
            ? `Pausa para almoço (${time}) configurada para ${barberName}.`
            : `Pausa para almoço removida para ${barberName}.`
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

  const submitWalkIn = async () => {
    setIsSubmitting(true);
    try {
      const chosenService = OFFICIAL_SERVICES.find((s) => s.id === selectedServiceId) || OFFICIAL_SERVICES[0];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: chosenService.id,
          barberId: walkInBarberId,
          date: `${selectedDate}T${timeStr}-03:00`,
          isWalkIn: true,
          status: "COMPLETED",
          clientName: walkInClientName.trim() || "Cliente Balcão",
          clientPhone: walkInClientPhone.trim() || "27992693638",
          paymentMethod,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setWalkInClientName("Cliente Balcão");
        setWalkInClientPhone("");
        await fetchDashboard();
        const attendantName = BARBERS.find((b) => b.id === walkInBarberId)?.name || "Noah Ferreira";
        setToastMessage(`Atendimento de R$ ${chosenService.price.toFixed(2)} registrado para ${attendantName}!`);
      }
    } catch (e) {
      console.error("Erro ao registrar balcão:", e);
    } finally {
      setIsSubmitting(false);
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
        <div className="animate-pulse text-blue-400 font-mono text-sm tracking-widest uppercase">
          Carregando Painel Administrativo...
        </div>
      </div>
    );
  }

  // Filtragem e cálculos para a visão ativa
  const barberBreakdown: any[] = dashboardData.barberBreakdown || [];
  const noahBreakdown = barberBreakdown.find((b) => b.id === "barbeiro-noah") || { revenue: 0, commission: 0, houseShare: 0, completedApts: 0 };
  const adrianBreakdown = barberBreakdown.find((b) => b.id === "barbeiro-adrian") || { revenue: 0, commission: 0, houseShare: 0, completedApts: 0 };

  let currentGross = dashboardData.totalGrossShop || 0;
  let currentCommissions = dashboardData.totalCommissionsToPay || Math.round(currentGross * BARBER_COMMISSION_RATE * 100) / 100;
  let currentHouseShare = dashboardData.houseNetProfit || Math.round(currentGross * HOUSE_COMMISSION_RATE * 100) / 100;
  let currentCompleted = dashboardData.completedCount || 0;

  if (activeBarberFilter === "barbeiro-noah") {
    currentGross = noahBreakdown.revenue || 0;
    currentCommissions = noahBreakdown.commission || 0;
    currentHouseShare = noahBreakdown.houseShare || 0;
    currentCompleted = noahBreakdown.completedApts || 0;
  } else if (activeBarberFilter === "barbeiro-adrian") {
    currentGross = adrianBreakdown.revenue || 0;
    currentCommissions = adrianBreakdown.commission || 0;
    currentHouseShare = adrianBreakdown.houseShare || 0;
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
      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-6 z-[160] bg-[#080A0E] border border-blue-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md backdrop-blur-md"
          >
            <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
            <p className="text-gray-200 text-xs font-mono">{toastMessage}</p>
            <button onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-white p-1 ml-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER MR. BASTOS STYLE */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 font-mono">
              <Shield className="w-3.5 h-3.5 text-blue-400" /> PROPRIETÁRIO (DONO) • 45% Barbeiros / 55% Administração
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
            Painel Geral da Barbearia
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-light">
            Controle total do Noah Barber Studio, comissão dos profissionais (45%) e rendimento da casa (55%).
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
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-2xl text-xs uppercase font-mono tracking-wider transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> + Cliente Balcão
          </button>
        </div>
      </div>

      {/* TABS DE FILTRO DE PROFISSIONAL (VISÃO GERAL / NOAH / ADRIAN) */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveBarberFilter("all")}
          className={`px-5 py-2.5 rounded-2xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeBarberFilter === "all"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-500"
              : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
          }`}
        >
          VISÃO GERAL (TODOS)
        </button>

        <button
          onClick={() => setActiveBarberFilter("barbeiro-noah")}
          className={`px-5 py-2.5 rounded-2xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeBarberFilter === "barbeiro-noah"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-500"
              : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
          }`}
        >
          <span>✂️</span>
          <span>NOAH FERREIRA (DONO)</span>
        </button>

        <button
          onClick={() => setActiveBarberFilter("barbeiro-adrian")}
          className={`px-5 py-2.5 rounded-2xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeBarberFilter === "barbeiro-adrian"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-500"
              : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
          }`}
        >
          <span>✂️</span>
          <span>ADRIAN SANTOS</span>
        </button>
      </div>

      {/* 4 CARDS PRINCIPAIS: FATURAMENTO, REPASSE 45%, CAIXA CASA 55%, ATENDIMENTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Faturamento Bruto */}
        <div className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-white/20 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-semibold flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-gray-400" /> FATURAMENTO BRUTO
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-serif text-white tracking-tight mb-1">
            R$ {currentGross.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-gray-400 font-light">
            {activeBarberFilter === "all" ? "Produção total somada da equipe." : "Produção bruta do profissional."}
          </p>
        </div>

        {/* Card 2: Repasse Barbeiros (45%) */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-3xl p-6 relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-300 font-bold flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-blue-400" /> REPASSE BARBEIROS (45%)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-serif text-blue-400 tracking-tight mb-1">
            R$ {currentCommissions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-blue-300/70 font-light">
            Total devido em comissões (inclusive Dono a 45%).
          </p>
        </div>

        {/* Card 3: Caixa Casa / Administração (55%) */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-bold flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" /> CAIXA CASA (55%)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-serif text-emerald-400 tracking-tight mb-1">
            R$ {currentHouseShare.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-emerald-300/70 font-light">
            55% retido para cobrir os custos estruturais do estúdio.
          </p>
        </div>

        {/* Card 4: Atendimentos & Ticket Médio */}
        <div className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-white/20 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-gray-400" /> ATENDIMENTOS
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-serif text-white tracking-tight mb-1">
            {currentCompleted} cortes
          </h3>
          <p className="text-xs text-gray-400 font-light">
            Ticket médio: R$ {currentTicketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* DISPONIBILIDADE DO DONO NO SITE */}
      <div className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 shrink-0">
            <Power className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-blue-400">
                ESCALA 4X4 / FLEXÍVEL
              </span>
            </div>
            <h4 className="text-lg font-serif font-bold text-white mt-0.5">
              Disponibilidade de Noah Ferreira (Dono) para Agendamentos
            </h4>
            <p className="text-xs text-gray-400 font-light mt-0.5">
              {isOwnerAvailable
                ? "Disponível no Site: O nome de Noah Ferreira está visível para agendamentos online."
                : "Em folga / Oculto: Seu nome está oculto no site. Apenas os outros barbeiros recebem agendamentos."}
            </p>
          </div>
        </div>

        <button
          onClick={toggleOwnerAvailability}
          disabled={isTogglingOwner}
          className={`px-5 py-3 rounded-2xl font-mono font-bold text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer border flex items-center gap-2 ${
            isOwnerAvailable
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isOwnerAvailable ? "🟢 DISPONÍVEL NO SITE" : "⏻ EM FOLGA (OCULTO NO SITE)"}</span>
        </button>
      </div>

      {/* PRÓXIMOS ATENDIMENTOS CONFIRMADOS */}
      {nextApt ? (
        <div className="bg-[#080A0E] border border-blue-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-bold">
                  Próximo Atendimento Confirmado
                </h3>
              </div>
              <p className="text-xl sm:text-2xl font-serif text-white">
                {nextApt.user?.name || "Cliente"} — <span className="text-gray-300">{nextApt.service?.name}</span>
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400 font-mono flex-wrap">
                <span>🕒 {getDisplayTime(nextApt.date)}</span>
                <span>•</span>
                <span>✂️ {BARBERS.find((b) => b.id === nextApt.barberId)?.name || "Noah Ferreira"}</span>
                <span>•</span>
                <span className="text-blue-400">
                  Comissão: R$ {(Math.round((nextApt.service?.price || 0) * 0.45 * 100) / 100).toFixed(2)} (45%)
                </span>
                {nextApt.user?.phone && (
                  <>
                    <span>•</span>
                    <span>whatsapp: {nextApt.user.phone}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => updateStatus(nextApt.id, "COMPLETED")}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase font-mono tracking-wider shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Concluir Atendimento
              </button>
              <a
                href="/dashboard/agenda"
                className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5"
              >
                Ver Agenda <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {/* DETALHAMENTO DA EQUIPE (NOAH 45% + ADRIAN 45%) */}
      <div className="space-y-4">
        <h3 className="text-xl font-serif text-white flex items-center gap-2">
          <span>👥</span> Rendimento e Comissões por Barbeiro
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {barberBreakdown.map((barber) => (
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
                    <Shield className="w-6 h-6 text-blue-400" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-white font-serif font-bold text-lg">
                      {barber.name} {barber.isOwner ? "(Dono)" : ""}
                    </h4>
                    <span className="text-[10px] uppercase font-bold font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300">
                      {barber.isOwner ? "DONO • 45%" : "COMISSÃO 45%"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 font-light">
                    {barber.isOwner ? "Proprietário da Barbearia" : "Barbeiro da Equipe"} • {barber.completedApts || 0} cortes hoje
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400">Produção Bruta:</span>
                  <span className="text-white font-bold">R$ {barber.revenue.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-blue-400 font-semibold">Comissão Barbeiro (45%):</span>
                  <span className="text-blue-400 font-bold">R$ {barber.commission.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-white/5">
                  <span className="text-emerald-400 font-semibold">Repasse Administração (55%):</span>
                  <span className="text-emerald-400 font-bold">+ R$ {barber.houseShare.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LISTA DE ATENDIMENTOS DO DIA COM TAG DE COMISSÃO */}
      <div className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div>
            <h3 className="text-xl font-serif text-white">
              Atendimentos do Dia • {selectedDate.split("-").reverse().join("/")}
            </h3>
            <p className="text-xs text-gray-400 font-light mt-0.5">
              {activeBarberFilter === "all" ? "Todos os barbeiros" : BARBERS.find((b) => b.id === activeBarberFilter)?.name}
            </p>
          </div>
          <span className="text-xs text-blue-400 font-mono">
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
              const commissionValue = Math.round(cutPrice * BARBER_COMMISSION_RATE * 100) / 100;
              const barberAttendant = BARBERS.find((b) => b.id === apt.barberId) || BARBERS[0];

              return (
                <div
                  key={apt.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-5 bg-white/[0.02] border rounded-2xl transition-all gap-4 overflow-hidden ${
                    apt.status === "CANCELLED"
                      ? "border-red-500/20 opacity-50"
                      : "border-white/5 hover:border-blue-500/40"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-[#050608] border border-white/10 flex flex-col items-center justify-center font-mono shrink-0 shadow-md">
                      <span className="text-[9px] text-gray-500 font-light">HORA</span>
                      <span className="text-sm font-bold text-white">{aptTime}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-white font-medium text-base sm:text-lg truncate">
                          {apt.user?.name || "Cliente"}
                        </h4>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-medium bg-blue-500/15 border border-blue-500/30 text-blue-300 shrink-0 font-mono">
                          ✂️ {barberAttendant.name.split(" ")[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 flex-wrap">
                        <span className="text-gray-200 font-medium">{apt.service?.name}</span>
                        <span>•</span>
                        <span className="text-white font-mono font-bold">R$ {cutPrice.toFixed(2)}</span>
                        <span>•</span>
                        <span className="text-blue-400 font-mono font-semibold">
                          Comissão: R$ {commissionValue.toFixed(2)} (45%)
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        whatsapp: {apt.user?.phone || "Não informado"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10px] font-mono uppercase font-bold tracking-wider px-3 py-1 rounded-xl border ${
                        apt.status === "COMPLETED"
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                          : apt.status === "CANCELLED"
                          ? "border-red-500/30 text-red-400 bg-red-500/10"
                          : "border-blue-500/30 text-blue-300 bg-blue-500/10"
                      }`}
                    >
                      {apt.status === "COMPLETED" ? "CONCLUÍDO" : apt.status === "CANCELLED" ? "CANCELADO" : "CONFIRMADO"}
                    </span>

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

      {/* MODAL CLIENTE BALCÃO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative font-sans"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-serif text-white mb-1">Registrar Cliente Balcão</h3>
              <p className="text-xs text-gray-400 mb-6">Lançamento de atendimento imediato com comissão automática (45%).</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Barbeiro que Atendeu</label>
                  <select
                    value={walkInBarberId}
                    onChange={(e) => setWalkInBarberId(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none"
                  >
                    {BARBERS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.isOwner ? "(Dono)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Serviço Realizado</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none"
                  >
                    {OFFICIAL_SERVICES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — R$ {s.price.toFixed(2)} (Comissão: R$ {(s.price * 0.45).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Nome do Cliente (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Cliente Balcão"
                    value={walkInClientName}
                    onChange={(e) => setWalkInClientName(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none"
                  >
                    <option value="PIX">PIX</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="DINHEIRO">Dinheiro</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    onClick={submitWalkIn}
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase font-mono tracking-wider text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
                  >
                    {isSubmitting ? "Lançando..." : "Confirmar & Lançar no Caixa"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CANCELAMENTO */}
      <AnimatePresence>
        {cancellingApt && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
