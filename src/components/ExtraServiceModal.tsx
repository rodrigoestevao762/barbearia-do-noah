"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { OFFICIAL_SERVICES } from "@/lib/services";

interface ExtraServiceModalProps {
  appointment: any | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

/**
 * Modal reutilizável para acrescentar um serviço extra em um atendimento já agendado.
 */
export function ExtraServiceModal({
  appointment,
  onClose,
  onSuccess,
}: ExtraServiceModalProps) {
  const [selectedExtraServiceId, setSelectedExtraServiceId] = useState<string>("sobrancelha");
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    if (!appointment || !selectedExtraServiceId || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: appointment.id,
          action: "ADD_EXTRA_SERVICE",
          extraServiceId: selectedExtraServiceId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess(data.message || "Serviço extra adicionado com sucesso!");
        onClose();
      } else {
        onSuccess(data.error || "Erro ao adicionar serviço extra.");
      }
    } catch {
      onSuccess("Erro de conexão ao adicionar serviço extra.");
    } finally {
      setIsSaving(false);
    }
  };

  const chosen = OFFICIAL_SERVICES.find((s) => s.id === selectedExtraServiceId);
  const currentPrice = Number(appointment?.service?.price || 0);
  const totalAfter = chosen ? currentPrice + chosen.price : currentPrice;

  return (
    <AnimatePresence>
      {appointment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#080A0E] border border-[#DFBA73]/40 rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl relative font-sans"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-400 hover:text-white cursor-pointer"
              aria-label="Fechar modal de serviço extra"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-mono uppercase tracking-widest text-[#DFBA73] font-bold block mb-1">
              ACRESCENTAR NO ATENDIMENTO
            </span>
            <h3 className="text-xl font-serif text-white mb-1">Adicionar Serviço Extra</h3>
            <p className="text-xs text-gray-400 mb-4">
              Cliente: <strong className="text-white">{appointment.user?.name || "Cliente"}</strong> •{" "}
              Atual: <strong className="text-[#F5D799]">{appointment.service?.name} (R$ {currentPrice.toFixed(2)})</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-gray-400 mb-2">
                  Escolha o Serviço Extra
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                  {OFFICIAL_SERVICES.map((svc) => {
                    const isPicked = selectedExtraServiceId === svc.id;
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => setSelectedExtraServiceId(svc.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isPicked
                            ? "bg-[#DFBA73]/20 border-[#DFBA73] text-white"
                            : "bg-white/[0.02] border-white/10 text-gray-300 hover:border-white/25"
                        }`}
                      >
                        <span className="text-xs font-medium">{svc.name}</span>
                        <span className="text-xs font-mono font-bold text-[#DFBA73] shrink-0">
                          + R$ {svc.price.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {chosen && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-300 block">Novo Total</span>
                    <span className="text-xs text-gray-200 line-clamp-1">
                      {appointment.service?.name} + {chosen.name}
                    </span>
                  </div>
                  <span className="text-lg font-serif font-bold text-emerald-400 shrink-0">
                    R$ {totalAfter.toFixed(2)}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold uppercase font-mono tracking-wider text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-[#DFBA73]/25 hover:brightness-110 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Adicionando..." : "Confirmar Serviço Extra"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
