"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  CheckCircle,
  User,
  Plus,
  X,
  Phone,
  MessageCircle,
  Shield,
  Edit3,
  AlertCircle,
  Check,
  Power,
  CheckCircle2,
  Coffee,
  Scissors,
} from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { BARBERS, BarberData, BARBER_COMMISSION_RATE } from "@/lib/barbers";
import { OFFICIAL_SERVICES, ServiceItem } from "@/lib/services";
import { getDisplayTime } from "@/lib/timezone";
import { checkDayStatus } from "@/lib/holidays";

export default function AgendaPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "ADMIN";
  const userEmail = session?.user?.email?.toLowerCase();
  const userBarberId = (session?.user as any)?.barberId;
  const isAdrian = userEmail === "adriansantos@gmail.com" || userBarberId === "barbeiro-adrian" || userRole === "BARBER";
  const isAdmin = !isAdrian && userRole === "ADMIN";

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>(() => (isAdrian ? "barbeiro-adrian" : "all"));

  // Barbeiro selecionado para controle de almoço & expediente
  const [controlledBarberId, setControlledBarberId] = useState<string>(() => (isAdrian ? "barbeiro-adrian" : "barbeiro-noah"));

  useEffect(() => {
    if (isAdrian) {
      setSelectedBarberFilter("barbeiro-adrian");
      setControlledBarberId("barbeiro-adrian");
      setNewBarberId("barbeiro-adrian");
    }
  }, [isAdrian]);

  // Disponibilidade do Dono (Noah Ferreira) ou individual de Adrian no site
  const [isOwnerAvailable, setIsOwnerAvailable] = useState(true);
  const [lunchBreak, setLunchBreak] = useState<string | null>(null);
  const [defaultLunchBreak, setDefaultLunchBreak] = useState<string | null>(null);
  const [isLunchBreakFixed, setIsLunchBreakFixed] = useState<boolean>(false);
  const [hasLunchDateOverride, setHasLunchDateOverride] = useState<boolean>(false);
  const [lunchBreakScope, setLunchBreakScope] = useState<"default" | "date">("default");
  const [earlyClosing, setEarlyClosing] = useState<string>("20:00");

  const [isSavingLunch, setIsSavingLunch] = useState(false);
  const [isTogglingOwner, setIsTogglingOwner] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Modal Novo Agendamento (Balcão / Manual)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newServiceId, setNewServiceId] = useState(OFFICIAL_SERVICES[0].id);
  const [newBarberId, setNewBarberId] = useState("barbeiro-noah");
  const [newTime, setNewTime] = useState("10:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createErrorMsg, setCreateErrorMsg] = useState("");

  // Modal Alterar / Editar Agendamento
  const [editingApt, setEditingApt] = useState<any | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editBarberId, setEditBarberId] = useState("barbeiro-noah");
  const [editServiceId, setEditServiceId] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState("");
  const [editErrorMsg, setEditErrorMsg] = useState("");

  // Modal de Cancelamento por Imprevisto com Notificação WhatsApp
  const [cancellingApt, setCancellingApt] = useState<any | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState<"imprevisto" | "ajuste" | "cliente">("imprevisto");
  const [customCancelMsg, setCustomCancelMsg] = useState("");
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);

  const getCancelMessage = (apt: any, preset: "imprevisto" | "ajuste" | "cliente") => {
    const barberName = BARBERS.find((b) => b.id === apt.barberId)?.name.split(" ")[0] || "Noah";
    const aptTime = getDisplayTime(apt.date);
    const aptDate = apt.date ? apt.date.substring(0, 10).split("-").reverse().join("/") : selectedDate.split("-").reverse().join("/");
    const clientName = apt.user?.name || "Cliente";

    if (preset === "imprevisto") {
      return `Olá, ${clientName}! Sou o ${barberName} da Noah Barber Studio. Tive um imprevisto urgente hoje e precisei cancelar o seu horário das ${aptTime} (${aptDate}). Peço sinceras desculpas pelo ocorrido! Poderíamos reagendar para um outro horário ou dia que fique bom para você?`;
    } else if (preset === "ajuste") {
      return `Olá, ${clientName}! Informamos que seu horário das ${aptTime} (${aptDate}) na Noah Barber Studio precisou ser cancelado para ajuste da nossa escala de atendimento. O horário já está liberado caso queira remarcar pelo site ou por aqui!`;
    } else {
      return `Olá, ${clientName}! Confirmamos o cancelamento do seu agendamento no Noah Barber Studio para o dia ${aptDate} às ${aptTime}. Estamos à disposição para quando desejar agendar um novo atendimento!`;
    }
  };

  const openCancelModal = (apt: any) => {
    setCancellingApt(apt);
    setCancelReasonPreset("imprevisto");
    setCustomCancelMsg(getCancelMessage(apt, "imprevisto"));
  };

  const handleChangeCancelPreset = (preset: "imprevisto" | "ajuste" | "cliente") => {
    setCancelReasonPreset(preset);
    if (cancellingApt) {
      setCustomCancelMsg(getCancelMessage(cancellingApt, preset));
    }
  };

  const handleConfirmCancelWithWhatsApp = async (openWhatsApp: boolean = true) => {
    if (!cancellingApt) return;
    setIsProcessingCancel(true);
    try {
      await updateStatus(cancellingApt.id, "CANCELLED");

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

  // Carrega status de disponibilidade do barbeiro para a data selecionada
  useEffect(() => {
    fetch(`/api/barbers?date=${selectedDate}&t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.barbers || [];
        const targetBarberId = isAdrian ? "barbeiro-adrian" : controlledBarberId;
        const target = list.find((b: any) => b.id === targetBarberId || (!isAdrian && targetBarberId === "barbeiro-noah" && b.id === "barbeiro-dono"));
        if (target) {
          setIsOwnerAvailable(target.isAvailable !== false);
          setLunchBreak(target.lunchBreakTime || null);
          setDefaultLunchBreak(target.defaultLunchBreakTime || null);
          setIsLunchBreakFixed(Boolean(target.isLunchBreakFixed));
          setHasLunchDateOverride(Boolean(target.hasLunchDateOverride));
          setLunchBreakScope(target.hasLunchDateOverride ? "date" : "default");
          if (target.earlyClosingTime) setEarlyClosing(target.earlyClosingTime);
        }
      })
      .catch(() => {});
  }, [selectedDate, controlledBarberId, isAdrian]);

  const toggleOwnerAvailability = async () => {
    setIsTogglingOwner(true);
    const newStatus = !isOwnerAvailable;
    const formattedDate = selectedDate.split("-").reverse().join("/");
    const targetBarberId = isAdrian ? "barbeiro-adrian" : "barbeiro-noah";
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
        } else {
          setToastMessage(
            newStatus
              ? `Noah Ferreira (Dono) agora está DISPONÍVEL NO SITE em ${formattedDate}.`
              : `Noah Ferreira (Dono) agora está EM FOLGA (OCULTO NO SITE) em ${formattedDate}.`
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
    const formattedDate = selectedDate.split("-").reverse().join("/");
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
        setLunchBreak(data.lunchBreakTime || null);
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

  const handleSetEarlyClosing = async (time: string) => {
    setEarlyClosing(time);
    try {
      await fetch("/api/barbers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId: controlledBarberId,
          date: selectedDate,
          earlyClosingTime: time === "20:00" ? null : time,
        }),
      });
      setToastMessage(`Horário de encerramento ajustado para ${time} no dia selecionado.`);
    } catch (e) {
      console.error(e);
    }
  };

  // Carrega agendamentos
  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const barberParam = isAdmin && selectedBarberFilter !== "all" ? `&barberId=${selectedBarberFilter}` : "";
      const res = await fetch(`/api/dashboard?date=${selectedDate}${barberParam}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, [selectedDate, selectedBarberFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) fetchAgenda();
    } catch (e) {}
  };

  const openEditModal = (apt: any) => {
    setEditingApt(apt);
    const dayStr = apt.date ? apt.date.substring(0, 10) : selectedDate;
    setEditDate(dayStr);
    setEditTime(getDisplayTime(apt.date));
    setEditBarberId(apt.barberId || "barbeiro-noah");
    setEditServiceId(apt.service?.id || OFFICIAL_SERVICES[0].id);
    setEditSuccessMsg("");
    setEditErrorMsg("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;

    setIsSavingEdit(true);
    setEditErrorMsg("");

    try {
      const res = await fetch("/api/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingApt.id,
          date: editDate,
          time: editTime,
          barberId: editBarberId,
          serviceId: editServiceId,
          status: "CONFIRMED",
        }),
      });

      if (res.ok) {
        setEditSuccessMsg("Horário alterado com sucesso!");
        fetchAgenda();
        setTimeout(() => {
          setEditingApt(null);
        }, 1200);
      } else {
        const data = await res.json();
        setEditErrorMsg(data.error || "Erro ao salvar alterações.");
      }
    } catch (err: any) {
      setEditErrorMsg("Erro de comunicação ao salvar.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateErrorMsg("");

    const fullDate = `${selectedDate}T${newTime}:00-03:00`;

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: newServiceId,
          barberId: newBarberId || "barbeiro-noah",
          date: fullDate,
          clientName: newClientName.trim() || "Cliente Balcão",
          clientEmail: newClientEmail.trim().toLowerCase() || null,
          clientPhone: newClientPhone.trim() || "27992693638",
          isWalkIn: true,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setNewClientName("");
        setNewClientEmail("");
        setNewClientPhone("");
        fetchAgenda();
      } else {
        const data = await res.json();
        setCreateErrorMsg(data.error || "Erro ao agendar.");
      }
    } catch (e) {
      setCreateErrorMsg("Erro de conexão ao criar agendamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentControlledBarber = BARBERS.find((b) => b.id === controlledBarberId) || BARBERS[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6 bg-[#0B0E14]/95 border border-[#DFBA73]/50 text-[#F5D799] px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl text-xs font-mono flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER NOAH BARBER STUDIO STYLE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] bg-[#DFBA73]/15 border border-[#DFBA73]/30 text-[#DFBA73] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 font-mono">
              <Shield className="w-3 h-3 text-[#DFBA73]" /> {isAdmin ? "AGENDA ADMINISTRATIVA DO GESTOR" : "MINHA AGENDA DE ATENDIMENTOS"}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
            {isAdmin ? "Agenda Geral da Barbearia" : "Minha Agenda de Atendimentos"}
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-light">
            {isAdmin
              ? "Visualize e gerencie a distribuição de horários entre todos os barbeiros."
              : "Visualize seus horários, organize seu almoço e defina seus dias de folga no calendário."}
          </p>
        </div>

        {/* CONTROLES: FILTRO DE BARBEIRO + DATA + NOVO AGENDAMENTO */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Pills */}
          {isAdmin ? (
            <div className="flex items-center bg-[#080A0E] border border-white/10 rounded-2xl p-1">
              <button
                onClick={() => setSelectedBarberFilter("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedBarberFilter === "all"
                    ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow-md shadow-[#DFBA73]/25"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedBarberFilter("barbeiro-noah")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedBarberFilter === "barbeiro-noah"
                    ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow-md shadow-[#DFBA73]/25"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Noah
              </button>
              <button
                onClick={() => setSelectedBarberFilter("barbeiro-adrian")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedBarberFilter === "barbeiro-adrian"
                    ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow-md shadow-[#DFBA73]/25"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Adrian
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-[#080A0E] border border-white/10 rounded-2xl px-3.5 py-1.5">
              <span className="text-xs font-mono font-bold text-[#DFBA73]">✂️ Adrian Santos</span>
            </div>
          )}

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#080A0E] border border-white/10 rounded-2xl px-4 py-2 text-white text-xs font-mono focus:outline-none focus:border-[#DFBA73] transition-colors [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
          />

          {/* Novo Agendamento Button */}
          <button
            onClick={() => {
              setCreateErrorMsg("");
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold rounded-2xl text-xs uppercase font-mono tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-[#DFBA73]/25 hover:brightness-110 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> NOVO AGENDAMENTO
          </button>
        </div>
      </div>

      {/* CARD 1: STATUS DO STUDIO / DISPONIBILIDADE NO SITE COM FOTO DO BARBEIRO */}
      <div className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#DFBA73] shrink-0 shadow-md">
            <Image
              src={isAdmin ? "/barbers/noah-ferreira.jpg" : "/barbers/adrian-santos.jpg"}
              alt={isAdmin ? "Noah Ferreira" : "Adrian Santos"}
              fill
              className="object-cover object-top"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#DFBA73]">
                {isAdmin ? "STATUS DO STUDIO (ABERTO OU FECHADO)" : "CONTROLE DE FOLGA INDIVIDUAL"}
              </span>
            </div>
            <h4 className="text-lg font-serif font-bold text-white mt-0.5">
              {isAdmin 
                ? "Studio Aberto ou Fechado (Noah Ferreira)" 
                : "Minha Folga / Disponibilidade no Site (Adrian Santos)"}
            </h4>
            <p className="text-xs text-gray-400 font-light mt-0.5">
              {isAdmin 
                ? (isOwnerAvailable
                    ? "Studio Aberto: O estúdio está aberto e recebendo agendamentos online normalmente."
                    : "Studio Fechado: O estúdio está fechado para a data selecionada acima.")
                : (isOwnerAvailable
                    ? "Você está DISPONÍVEL no site para receber agendamentos na data selecionada acima."
                    : "Você marcou FOLGA para a data selecionada acima. Seu horário estará bloqueado no site, sem afetar o Noah.")}
            </p>
          </div>
        </div>

        <button
          onClick={toggleOwnerAvailability}
          disabled={isTogglingOwner}
          className={`px-5 py-3 rounded-2xl font-mono font-bold text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer border flex items-center gap-2 ${
            isOwnerAvailable
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              : "bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
          }`}
        >
          <Power className="w-4 h-4" />
          <span>
            {isAdmin 
              ? (isOwnerAvailable ? "Studio Aberto" : "Studio Fechado")
              : (isOwnerAvailable ? "🟢 DISPONÍVEL NO SITE" : "⏻ EM FOLGA NESTA DATA")}
          </span>
        </button>
      </div>

      {/* CARD 2: CONTROLE INDIVIDUAL DE ALMOÇO & EXPEDIENTE */}
      <div className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#DFBA73] flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5" /> {isAdmin ? "CONTROLE DE ALMOÇO & EXPEDIENTE DA EQUIPE" : "MEU INTERVALO DE ALMOÇO"}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-light mt-1">
              {isAdmin 
                ? "Controle individual de intervalo de almoço e expediente para cada barbeiro." 
                : "Defina o horário da sua pausa para almoço para bloquear novos agendamentos neste intervalo."}
            </p>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Profissional Selection Chips */}
              <div className="flex items-center bg-[#050608] border border-white/10 rounded-2xl p-1">
                <button
                  onClick={() => setControlledBarberId("barbeiro-noah")}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    controlledBarberId === "barbeiro-noah"
                      ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow-md shadow-[#DFBA73]/25"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${controlledBarberId === "barbeiro-noah" ? "bg-black" : "bg-[#DFBA73]"}`} />
                  <span>Noah</span>
                </button>
                <button
                  onClick={() => setControlledBarberId("barbeiro-adrian")}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    controlledBarberId === "barbeiro-adrian"
                      ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black shadow-md shadow-[#DFBA73]/25"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${controlledBarberId === "barbeiro-adrian" ? "bg-black" : "bg-emerald-400"}`} />
                  <span>Adrian</span>
                </button>
              </div>

              {/* Fechar Só Hoje */}
              <button
                onClick={() => toggleOwnerAvailability()}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-mono text-xs font-semibold cursor-pointer"
              >
                Fechar Só Hoje
              </button>

              {/* Sair antes */}
              <div className="flex items-center gap-1.5 bg-[#050608] border border-white/10 rounded-xl px-3 py-1.5">
                <span className="text-[11px] text-gray-400 font-mono">Sair antes:</span>
                <select
                  value={earlyClosing}
                  onChange={(e) => handleSetEarlyClosing(e.target.value)}
                  className="bg-transparent text-white text-xs font-mono outline-none cursor-pointer"
                >
                  <option value="20:00" className="bg-[#080A0E] text-white">Normal (20h)</option>
                  <option value="19:00" className="bg-[#080A0E] text-white">19:00</option>
                  <option value="18:00" className="bg-[#080A0E] text-white">18:00</option>
                  <option value="17:00" className="bg-[#080A0E] text-white">17:00</option>
                  <option value="16:00" className="bg-[#080A0E] text-white">16:00</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Sub-card: Pausa para Almoço */}
        <div className="bg-[#050608] border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#DFBA73] shrink-0 shadow-md">
                <Image
                  src={currentControlledBarber.id === "barbeiro-adrian" ? "/barbers/adrian-santos.jpg" : "/barbers/noah-ferreira.jpg"}
                  alt={currentControlledBarber.name}
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h5 className="text-sm font-serif font-bold text-white">Pausa para Almoço</h5>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#DFBA73]/20 text-[#F5D799] border border-[#DFBA73]/30">
                    {currentControlledBarber.name.toUpperCase()} {currentControlledBarber.isOwner ? "(DONO · 55%)" : "(FUNCIONÁRIO · 45%)"}
                  </span>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${lunchBreak ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-white/5 text-gray-400"}`}>
                    {lunchBreak ? `PAUSA: ${lunchBreak}` : "SEM PAUSA CONFIGURADA"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-light mt-0.5">
                  {lunchBreak
                    ? `Horário das ${lunchBreak} bloqueado para almoço na agenda de ${currentControlledBarber.name}.`
                    : `Nenhum horário bloqueado para almoço na agenda de ${currentControlledBarber.name}.`}
                </p>
              </div>
            </div>

            {/* Botões de Escopo */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setLunchBreakScope("default")}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                  lunchBreakScope === "default"
                    ? "bg-[#DFBA73] text-black font-bold shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Direto (Fixo)
              </button>
              <button
                type="button"
                onClick={() => setLunchBreakScope("date")}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                  lunchBreakScope === "date"
                    ? "bg-[#DFBA73] text-black font-bold shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Só {selectedDate.split("-").reverse().slice(0, 2).join("/")}
              </button>
            </div>
          </div>

          {/* Botões de Seleção de Horário */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono text-gray-400 uppercase w-8">1h:</span>
              {["11:00", "12:00", "13:00", "14:00"].map((time) => (
                <button
                  key={time}
                  onClick={() => handleSetLunchBreak(lunchBreak === time ? null : time, lunchBreakScope)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    lunchBreak === time
                      ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold shadow-md shadow-[#DFBA73]/25 border border-[#DFBA73]"
                      : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono text-gray-400 uppercase w-8">2h:</span>
              {["11h-13h", "12h-14h", "13h-15h"].map((time) => {
                const mappedTime = time === "11h-13h" ? "11:00-13:00" : time === "12h-14h" ? "12:00-14:00" : "13:00-15:00";
                return (
                  <button
                    key={time}
                    onClick={() => handleSetLunchBreak(lunchBreak === mappedTime ? null : mappedTime, lunchBreakScope)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                      lunchBreak === mappedTime
                        ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold shadow-md shadow-[#DFBA73]/25 border border-[#DFBA73]"
                        : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}

              {lunchBreak && (
                <button
                  onClick={() => handleSetLunchBreak(null, lunchBreakScope)}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono text-red-400 hover:bg-red-500/10 border border-red-500/20 cursor-pointer ml-auto"
                >
                  Remover Pausa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: LISTA DE HORÁRIOS DA AGENDA */}
      <div className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-5">
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <span className="text-sm font-serif text-gray-300">
            {selectedDate.split("-").reverse().join("/")} • {appointments.length} horários marcados
          </span>
          <span className="text-xs text-gray-400 font-mono">
            {appointments.filter((a) => a.status === "COMPLETED").length} concluídos
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#DFBA73] animate-pulse font-mono text-sm">
            Carregando agenda do estúdio...
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-20 text-center text-gray-500 italic font-light">
            Nenhum atendimento agendado para esta data.
          </div>
        ) : (
          <div className="grid gap-3.5">
            {appointments.map((apt) => {
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
                    {/* Time Pill */}
                    <div className="w-14 h-14 rounded-2xl bg-[#050608] border border-white/10 flex flex-col items-center justify-center font-mono shrink-0 shadow-md">
                      <span className="text-[9px] text-gray-500 font-light">HORA</span>
                      <span className="text-sm font-bold text-white">{aptTime}</span>
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

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 shrink-0">
                    {/* Status Pill */}
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

                    {/* WhatsApp Action */}
                    {apt.user?.phone && (
                      <a
                        href={`https://wa.me/55${apt.user.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                          `Olá, ${apt.user.name}! Sou o ${barberAttendant.name.split(" ")[0]} da Noah Barber Studio. Confirmando seu horário para hoje às ${aptTime}!`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all shrink-0 cursor-pointer"
                        title="Enviar WhatsApp ao cliente"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}

                    {/* Actions */}
                    {apt.status !== "CANCELLED" && (
                      <button
                        onClick={() => openEditModal(apt)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-medium transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Alterar</span>
                      </button>
                    )}

                    {apt.status !== "COMPLETED" && apt.status !== "CANCELLED" && (
                      <button
                        onClick={() => updateStatus(apt.id, "COMPLETED")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black text-xs font-semibold transition-all shrink-0 cursor-pointer"
                      >
                        Concluir
                      </button>
                    )}

                    {apt.status !== "CANCELLED" && (
                      <button
                        onClick={() => openCancelModal(apt)}
                        className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>CANCELAR</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL NOVO AGENDAMENTO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative font-sans"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-serif text-white mb-1">Novo Agendamento</h3>
              <p className="text-xs text-gray-400 mb-6">Cadastro manual de horário na agenda da barbearia.</p>

              {createErrorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs mb-4">
                  {createErrorMsg}
                </div>
              )}

              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#DFBA73]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="27999999999"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#DFBA73]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Horário</label>
                    <input
                      type="time"
                      required
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#DFBA73]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Barbeiro Responsável</label>
                  {isAdmin ? (
                    <select
                      value={newBarberId}
                      onChange={(e) => setNewBarberId(e.target.value)}
                      className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none"
                    >
                      {BARBERS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} {b.isOwner ? "(Dono)" : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2 text-[#DFBA73] font-mono text-xs font-semibold">
                      ✂️ Adrian Santos (Você)
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Serviço</label>
                  <select
                    value={newServiceId}
                    onChange={(e) => setNewServiceId(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none"
                  >
                    {OFFICIAL_SERVICES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — R$ {s.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold uppercase font-mono tracking-wider text-xs py-3 rounded-xl transition-all shadow-lg shadow-[#DFBA73]/25 hover:brightness-110 cursor-pointer"
                  >
                    {isSubmitting ? "Agendando..." : "Confirmar Agendamento"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL EDITAR AGENDAMENTO */}
      <AnimatePresence>
        {editingApt && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative font-sans"
            >
              <button
                onClick={() => setEditingApt(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-serif text-white mb-1">Alterar Agendamento</h3>
              <p className="text-xs text-gray-400 mb-6">
                Cliente: <strong className="text-white">{editingApt.user?.name || "Cliente"}</strong>
              </p>

              {editSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs mb-4">
                  {editSuccessMsg}
                </div>
              )}

              {editErrorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs mb-4">
                  {editErrorMsg}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Nova Data</label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-[#050608] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#DFBA73] [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Novo Horário</label>
                    <input
                      type="time"
                      required
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full bg-[#050608] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#DFBA73]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Barbeiro</label>
                  {isAdmin ? (
                    <select
                      value={editBarberId}
                      onChange={(e) => setEditBarberId(e.target.value)}
                      className="w-full bg-[#050608] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none"
                    >
                      {BARBERS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} {b.isOwner ? "(Dono · 55%)" : "(Funcionário · 45%)"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-[#050608] border border-white/10 rounded-xl px-3 py-2 text-[#DFBA73] font-mono text-xs font-semibold">
                      ✂️ Adrian Santos (Você)
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Serviço</label>
                  <select
                    value={editServiceId}
                    onChange={(e) => setEditServiceId(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none"
                  >
                    {OFFICIAL_SERVICES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — R$ {s.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="w-full bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold uppercase font-mono tracking-wider text-xs py-3 rounded-xl transition-all shadow-lg shadow-[#DFBA73]/25 hover:brightness-110 cursor-pointer"
                  >
                    {isSavingEdit ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CANCELAMENTO COM WHATSAPP */}
      <AnimatePresence>
        {cancellingApt && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative font-sans"
            >
              <button
                onClick={() => setCancellingApt(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h3 className="text-xl font-serif text-white">Cancelar Atendimento</h3>
              </div>
              <p className="text-xs text-gray-400 mb-5">
                Cliente: <strong className="text-white">{cancellingApt.user?.name || "Cliente"}</strong> (
                {getDisplayTime(cancellingApt.date)})
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1.5">
                    Motivo do Cancelamento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["imprevisto", "ajuste", "cliente"] as const).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleChangeCancelPreset(preset)}
                        className={`py-2 text-[11px] font-mono font-semibold uppercase rounded-xl border transition-all ${
                          cancelReasonPreset === preset
                            ? "bg-red-500/20 border-red-500/40 text-red-300"
                            : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1.5">
                    Mensagem que será enviada no WhatsApp:
                  </label>
                  <textarea
                    rows={4}
                    value={customCancelMsg}
                    onChange={(e) => setCustomCancelMsg(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-red-500 resize-none font-sans"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
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
                    className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-mono text-xs uppercase py-2.5 rounded-xl transition-all"
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
