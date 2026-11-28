"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { BARBERS } from "@/lib/barbers";
import { OFFICIAL_SERVICES } from "@/lib/services";
import { getDisplayTime } from "@/lib/timezone";
import { CenterModalPortal } from "@/components/CenterModalPortal";

const ALL_AGENDA_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30",
];

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  defaultDate: string;
  onSuccess: (message: string) => void;
}

export default function WalkInModal({
  isOpen,
  onClose,
  isAdmin,
  defaultDate,
  onSuccess,
}: WalkInModalProps) {
  const todayBrazilStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const nowBrazilTimeStr = new Date().toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const [selectedServiceId, setSelectedServiceId] = useState<string>("corte");
  const [walkInBarberId, setWalkInBarberId] = useState<string>(() => (isAdmin ? "barbeiro-noah" : "barbeiro-adrian"));
  const [walkInClientName, setWalkInClientName] = useState<string>("Cliente Balcão");
  const [walkInClientPhone, setWalkInClientPhone] = useState<string>("");
  const [walkInDate, setWalkInDate] = useState<string>(() =>
    defaultDate < todayBrazilStr ? todayBrazilStr : defaultDate
  );
  const [walkInTime, setWalkInTime] = useState<string>("");
  const [walkInStatus, setWalkInStatus] = useState<"COMPLETED" | "CONFIRMED">("COMPLETED");
  const [paymentMethod, setPaymentMethod] = useState<string>("PIX");
  const [walkInBookedSlots, setWalkInBookedSlots] = useState<string[]>([]);
  const [walkInAvailableSlots, setWalkInAvailableSlots] = useState<string[]>([]);
  const [walkInClosedReason, setWalkInClosedReason] = useState<string | null>(null);
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [isLoadingWalkInSlots, setIsLoadingWalkInSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setWalkInBarberId("barbeiro-adrian");
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isOpen) return;
    setWalkInError(null);
    setWalkInDate(defaultDate < todayBrazilStr ? todayBrazilStr : defaultDate);
  }, [isOpen, defaultDate, todayBrazilStr]);

  useEffect(() => {
    if (!isOpen || !walkInDate) return;
    setIsLoadingWalkInSlots(true);
    setWalkInError(null);
    Promise.all([
      fetch(
        `/api/appointments/available?date=${walkInDate}&barberId=${walkInBarberId}&serviceId=${selectedServiceId}&t=${Date.now()}`,
        {
          cache: "no-store",
        }
      ).then((r) => r.json()),
      fetch(`/api/dashboard?date=${walkInDate}&barberId=${walkInBarberId}&t=${Date.now()}`, {
        cache: "no-store",
      }).then((r) => r.json()),
    ])
      .then(([availData, dashData]) => {
        const freeSlots: string[] = Array.isArray(availData?.availableTimes) ? availData.availableTimes : [];
        const apts: any[] = dashData?.appointments || [];
        const occupied = apts
          .filter((a) => a.status !== "CANCELLED")
          .map((a) => getDisplayTime(a.date));

        setWalkInBookedSlots(occupied);
        setWalkInAvailableSlots(freeSlots);
        setWalkInClosedReason(availData?.isClosed ? availData.reason || "Agenda fechada nesta data." : null);
        setWalkInTime((prev) => (freeSlots.includes(prev) ? prev : freeSlots[0] || ""));
      })
      .catch(() => {
        setWalkInBookedSlots([]);
        setWalkInAvailableSlots([]);
      })
      .finally(() => setIsLoadingWalkInSlots(false));
  }, [isOpen, walkInDate, walkInBarberId, selectedServiceId]);

  const submitWalkIn = async () => {
    if (!walkInTime || !walkInAvailableSlots.includes(walkInTime)) {
      setWalkInError("Selecione um horário disponível e futuro na agenda.");
      return;
    }
    setIsSubmitting(true);
    setWalkInError(null);
    try {
      const chosenService = OFFICIAL_SERVICES.find((s) => s.id === selectedServiceId) || OFFICIAL_SERVICES[0];
      const targetDate = walkInDate || defaultDate;
      const targetTime = walkInTime;
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: chosenService.id,
          barberId: walkInBarberId,
          date: `${targetDate}T${targetTime}:00-03:00`,
          isWalkIn: true,
          status: walkInStatus,
          clientName: walkInClientName.trim() || "Cliente Balcão",
          clientPhone: walkInClientPhone.trim(),
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onClose();
        setWalkInClientName("Cliente Balcão");
        setWalkInClientPhone("");
        const attendantName = BARBERS.find((b) => b.id === walkInBarberId)?.name || "Noah Ferreira";
        const dateBr = targetDate.split("-").reverse().join("/");
        onSuccess(
          `Cliente Balcão (${chosenService.name}) registrado para ${attendantName} em ${dateBr} às ${targetTime}. Horário bloqueado na agenda!`
        );
      } else {
        setWalkInError(data.error || "Não foi possível registrar neste horário.");
      }
    } catch {
      setWalkInError("Erro de conexão ao registrar Cliente Balcão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <CenterModalPortal onBackdropClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="my-auto bg-[#080A0E] border border-[#DFBA73]/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[calc(100dvh-7.5rem)] overflow-y-auto shadow-2xl relative font-sans text-white"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif text-white mb-1">Registrar Cliente Balcão</h3>
            <p className="text-xs text-gray-400 mb-5">
              Escolha o horário na agenda para indisponibilizá-lo no site automaticamente.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Barbeiro que Atendeu</label>
                {isAdmin ? (
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
                ) : (
                  <div className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2.5 text-[#DFBA73] font-mono text-xs font-semibold">
                    ✂️ Adrian Santos (Você)
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Data na Agenda</label>
                  <input
                    type="date"
                    min={todayBrazilStr}
                    value={walkInDate}
                    onChange={(e) => setWalkInDate(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono outline-none focus:border-[#DFBA73] [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Situação</label>
                  <select
                    value={walkInStatus}
                    onChange={(e) => setWalkInStatus(e.target.value as "COMPLETED" | "CONFIRMED")}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none"
                  >
                    <option value="COMPLETED">Concluído (Lançar no Caixa)</option>
                    <option value="CONFIRMED">Na Cadeira / Confirmado</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-mono uppercase text-gray-400">
                    Horário Disponível na Agenda
                  </label>
                  <span className="text-[10px] font-mono text-[#DFBA73]">
                    {isLoadingWalkInSlots
                      ? "Verificando..."
                      : walkInTime
                      ? `Selecionado: ${walkInTime}`
                      : "Sem vagas livres"}
                  </span>
                </div>

                {walkInClosedReason ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs font-mono">
                    {walkInClosedReason}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-44 overflow-y-auto pr-1 bg-[#050608] border border-white/10 rounded-2xl p-2.5">
                    {ALL_AGENDA_SLOTS.map((slot) => {
                      const isOccupied = walkInBookedSlots.includes(slot);
                      const isPast =
                        walkInDate < todayBrazilStr ||
                        (walkInDate === todayBrazilStr && slot <= nowBrazilTimeStr);
                      const isAvailable = walkInAvailableSlots.includes(slot) && !isOccupied && !isPast;
                      const isSelected = walkInTime === slot && isAvailable;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setWalkInTime(slot)}
                          className={`py-2 px-1 rounded-xl text-[11px] font-mono font-bold transition-all border relative ${
                            isSelected
                              ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black border-[#DFBA73] shadow-md cursor-pointer"
                              : isOccupied
                              ? "bg-red-500/10 border-red-500/20 text-red-300/40 line-through cursor-not-allowed"
                              : !isAvailable
                              ? "bg-white/[0.01] border-white/5 text-gray-600 line-through cursor-not-allowed"
                              : "bg-white/[0.03] border-white/10 text-gray-200 hover:border-[#DFBA73]/60 cursor-pointer"
                          }`}
                          title={
                            isOccupied
                              ? `Horário ${slot} já está agendado`
                              : isPast
                              ? `Horário ${slot} já passou`
                              : !isAvailable
                              ? `Horário ${slot} indisponível`
                              : `Selecionar ${slot}`
                          }
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}

                {!isLoadingWalkInSlots && !walkInClosedReason && walkInAvailableSlots.length === 0 && (
                  <p className="text-[11px] text-amber-300 font-mono mt-1.5">
                    Nenhum horário disponível restante para esta data/profissional. Selecione outro dia ou barbeiro.
                  </p>
                )}

                {walkInError && <p className="text-[11px] text-red-400 font-mono mt-1.5">{walkInError}</p>}
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
                      {s.name} — R$ {s.price.toFixed(2)}{" "}
                      {walkInBarberId === "barbeiro-adrian" ? `(Comissão 45%: R$ ${(s.price * 0.45).toFixed(2)})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">Nome do Cliente (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Cliente Balcão"
                    value={walkInClientName}
                    onChange={(e) => setWalkInClientName(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#DFBA73]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">WhatsApp (Opcional)</label>
                  <input
                    type="tel"
                    placeholder="(27) 99999-9999"
                    value={walkInClientPhone}
                    onChange={(e) => setWalkInClientPhone(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#DFBA73]"
                  />
                </div>
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
                  disabled={isSubmitting || !walkInTime || !walkInAvailableSlots.includes(walkInTime)}
                  className="w-full bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold uppercase font-mono tracking-wider text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-[#DFBA73]/25 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting
                    ? "Salvando & Bloqueando Horário..."
                    : !walkInTime
                    ? "Sem horário disponível"
                    : walkInStatus === "COMPLETED"
                    ? `Confirmar (${walkInTime}) & Lançar no Caixa`
                    : `Confirmar & Bloquear Horário (${walkInTime})`}
                </button>
              </div>
            </div>
          </motion.div>
        </CenterModalPortal>
      )}
    </AnimatePresence>
  );
}
