"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  selectedDate: string;
  selectedMonth: string;
  defaultCategory?: "FIXA" | "INSUMOS" | "VALE" | "OUTROS";
  defaultBarberName?: "Adrian Santos" | "Noah Ferreira";
  onSuccess: (message: string) => void;
}

export default function ExpenseModal({
  isOpen,
  onClose,
  isAdmin,
  selectedDate,
  selectedMonth,
  defaultCategory,
  defaultBarberName = "Adrian Santos",
  onSuccess,
}: ExpenseModalProps) {
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<"FIXA" | "INSUMOS" | "VALE" | "OUTROS">(
    defaultCategory || (isAdmin ? "FIXA" : "VALE")
  );
  const [expenseBarber, setExpenseBarber] = useState(defaultBarberName);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setExpenseCategory(defaultCategory || (isAdmin ? "FIXA" : "VALE"));
    setExpenseBarber(defaultBarberName);
  }, [isOpen, isAdmin, defaultCategory, defaultBarberName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount || isSaving) return;
    setIsSaving(true);
    setErrorMsg(null);

    const targetBarberId = !isAdmin
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
          category: !isAdmin ? "VALE" : expenseCategory,
          barberId: targetBarberId,
          date: selectedDate.startsWith(selectedMonth) ? selectedDate : `${selectedMonth}-01`,
        }),
      });

      if (res.ok) {
        setExpenseDesc("");
        setExpenseAmount("");
        onClose();
        onSuccess("Lançamento registrado no banco com sucesso!");
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Erro ao registrar lançamento.");
      }
    } catch {
      setErrorMsg("Erro de conexão ao salvar despesa.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#080A0E] border border-[#DFBA73]/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative font-sans"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif text-white mb-1">
              {isAdmin ? "Novo Lançamento Financeiro" : "Registrar Vale / Adiantamento"}
            </h3>
            <p className="text-xs text-gray-400 font-light mb-6">
              {isAdmin
                ? "Lançamento imediato de despesa fixa, insumo, vale ou custo operacional no caixa do mês."
                : "Lançamento individual descontado diretamente da sua comissão de 45%."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                        className={`py-2 text-xs font-mono font-semibold uppercase rounded-xl border transition-all cursor-pointer ${
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
                      onChange={(e) => setExpenseBarber(e.target.value as "Adrian Santos" | "Noah Ferreira")}
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
                  placeholder="Ex: Pomada modeladora, Aluguel, Vale semanal..."
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
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-[#050608] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#DFBA73]"
                />
              </div>

              {errorMsg && <p className="text-[11px] text-red-400 font-mono">{errorMsg}</p>}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold uppercase font-mono tracking-wider text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-[#DFBA73]/25 hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? "Registrando..." : "Confirmar Lançamento"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
