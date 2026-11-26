"use client";

import { useEffect, useState } from "react";
import { getFechamentoData, closeCashRegister } from "./actions";
import { motion } from "framer-motion";
import { Archive, DollarSign, Wallet, Scissors, Shield, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BARBERS } from "@/lib/barbers";

type BarberRevenue = {
  id?: string;
  name: string;
  role?: string;
  avatar?: string;
  total: number;
  commission: number;
  houseShare?: number;
  rate?: number;
  isOwner?: boolean;
  aptsCount?: number;
};

type FechamentoData = {
  totalRevenue: number;
  totalCommissions: number;
  houseShare: number;
  commissionRate: number;
  houseRate: number;
  barberRevenues: BarberRevenue[];
  closings: { createdAt: string | Date; closedBy: string | null }[];
};

export default function FechamentoPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = (session?.user as any)?.role || "ADMIN";
  const userEmail = session?.user?.email?.toLowerCase();
  const userBarberId = (session?.user as any)?.barberId;
  const isAdrian = userEmail === "adriansantos@gmail.com" || userBarberId === "barbeiro-adrian" || userRole === "BARBER";
  const isAdmin = !isAdrian && userRole === "ADMIN";

  const [data, setData] = useState<FechamentoData | null>(null);
  const [loading, setLoading] = useState(true);

  // Redireciona Adrian automaticamente para seu próprio caixa pessoal
  useEffect(() => {
    if (!isAdmin) {
      router.replace("/dashboard/financeiro");
    }
  }, [isAdmin, router]);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const fetchData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    const result = await getFechamentoData(selectedDate);
    if (result.success) {
      setData(result.data as FechamentoData);
    } else {
      alert("Erro do Servidor: " + (result as any).error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [selectedDate, isAdmin]);

  const handleClose = async () => {
    if (!data) return;
    const dateFormatted = new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR");
    if (!confirm(`Tem certeza que deseja registrar o fechamento oficial do caixa do dia ${dateFormatted}?`)) return;

    const result = await closeCashRegister({
      totalRevenue: data.totalRevenue,
      barberRevenues: JSON.stringify(data.barberRevenues),
      closedBy: session?.user?.name || "Noah Ferreira (Dono)",
      dateStr: selectedDate,
    });

    if (result.success) {
      fetchData();
    } else {
      alert("Erro ao fechar caixa: " + result.error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <Lock className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-3xl font-serif text-white">Acesso Restrito ao Gestor</h2>
          <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto leading-relaxed">
            O fechamento oficial do caixa do estúdio é uma função exclusiva de Noah Ferreira.
          </p>
        </div>
        <Link
          href="/dashboard/financeiro"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all shadow-lg shadow-[#DFBA73]/20"
        >
          <ArrowLeft className="w-4 h-4" /> Ir para Meu Caixa
        </Link>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-[#DFBA73] animate-pulse font-mono text-sm">
        Carregando dados oficiais do caixa...
      </div>
    );
  }

  const isClosed = data.closings && data.closings.length > 0;
  const lastClosing = isClosed ? data.closings[0] : null;

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-8">
      {/* HEADER OFICIAL PADRÃO LAS BARBER STUDIO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 font-mono shadow-lg shadow-[#DFBA73]/20">
              <Shield className="w-3 h-3" /> GESTÃO & ADMINISTRAÇÃO
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
            Fechamento de <span className="text-[#F5D799] italic">Caixa</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-light">
            Conferência final do dia com repasse de 55% para Noah Ferreira (Dono) e 45% para Adrian Santos (Funcionário).
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#080A0E] border border-white/10 rounded-2xl px-4 py-2.5 shadow-inner">
          <label className="text-xs text-gray-400 uppercase font-mono tracking-widest font-semibold">DATA:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-white text-xs font-mono outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
          />
        </div>
      </div>

      {/* BANNER SE CAIXA ESTIVER FECHADO */}
      {isClosed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center gap-4 shadow-lg shadow-emerald-500/5"
        >
          <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-emerald-400 font-serif font-bold text-lg">Caixa Oficial Fechado</h3>
            <p className="text-emerald-300/80 text-xs font-mono mt-0.5">
              Registrado em {new Date(lastClosing!.createdAt).toLocaleDateString("pt-BR")} às{" "}
              {new Date(lastClosing!.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} por{" "}
              {lastClosing!.closedBy}
            </p>
          </div>
        </motion.div>
      )}

      {/* 3 CARDS DE FATURAMENTO: BRUTO, ADRIAN (45%) E NOAH DONO (55%) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Faturamento Bruto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#080A0E] border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-white/20 transition-all shadow-xl shadow-black/40"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-11 h-11 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-300">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] uppercase font-mono tracking-widest font-semibold">
                FATURAMENTO BRUTO
              </p>
              <h3 className="text-2xl md:text-3xl font-serif text-white tracking-tight mt-0.5">
                R$ {data.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 font-light">
            Soma de todos os cortes realizados no dia.
          </p>
        </motion.div>

        {/* Card 2: Repasse Adrian Santos (45%) - Tema Âmbar / Ouro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#DFBA73]/10 border border-[#DFBA73]/30 rounded-3xl p-6 relative overflow-hidden group hover:border-[#DFBA73]/50 transition-all shadow-xl shadow-black/40"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-11 h-11 bg-[#DFBA73]/20 border border-[#DFBA73]/30 rounded-2xl flex items-center justify-center text-[#DFBA73]">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[#F5D799] text-[10px] uppercase font-mono tracking-widest font-bold">
                ADRIAN SANTOS (45%)
              </p>
              <h3 className="text-2xl md:text-3xl font-serif text-[#DFBA73] tracking-tight mt-0.5">
                R$ {data.totalCommissions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
          <p className="text-[11px] text-[#DFBA73]/70 font-light">
            Comissão do funcionário Adrian Santos (45% de seus atendimentos).
          </p>
        </motion.div>

        {/* Card 3: Noah Ferreira (Dono · 55%) - Tema Verde Esmeralda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-xl shadow-black/40"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-11 h-11 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-emerald-300 text-[10px] uppercase font-mono tracking-widest font-bold">
                NOAH FERREIRA (DONO · 55%)
              </p>
              <h3 className="text-2xl md:text-3xl font-serif text-emerald-400 tracking-tight mt-0.5">
                R$ {data.houseShare.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
          <p className="text-[11px] text-emerald-300/70 font-light">
            Faturamento retido por Noah (Dono): sua produção + 55% de Adrian.
          </p>
        </motion.div>
      </div>

      {/* DETALHAMENTO POR PROFISSIONAL */}
      <div className="space-y-4">
        <h3 className="text-xl font-serif text-white flex items-center gap-2">
          Detalhamento por Profissional
        </h3>

        <div className="space-y-4">
          {data.barberRevenues.length === 0 ? (
            <p className="text-gray-500 italic p-6 bg-white/[0.02] rounded-3xl border border-white/5 font-light">
              Nenhum faturamento registrado nesta data ({selectedDate.split("-").reverse().join("/")}).
            </p>
          ) : (
            data.barberRevenues.map((barber: BarberRevenue, idx: number) => {
              const isOwner = barber.isOwner;
              return (
                <motion.div
                  key={barber.id || idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx }}
                  className="bg-[#080A0E] border border-white/10 hover:border-white/20 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar do Barbeiro */}
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
                          {barber.name} {isOwner ? "(Dono)" : ""}
                        </h4>
                        {isOwner ? (
                          <span className="text-[10px] uppercase font-bold font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-[#DFBA73]/20 border border-[#DFBA73]/40 text-[#F5D799]">
                            DONO · 55%
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                            FUNCIONÁRIO · 45%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 font-light">
                        {isOwner ? "Proprietário da Barbearia" : "Barbeiro da Equipe"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 md:gap-8 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">
                        PRODUÇÃO BRUTA: R$ {barber.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      {isOwner ? (
                        <h5 className="text-xl font-serif text-emerald-400 font-bold mt-0.5">
                          Produção do Dono: R$ {barber.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </h5>
                      ) : (
                        <h5 className="text-xl font-serif text-[#DFBA73] font-bold mt-0.5">
                          Comissão (45%): R$ {barber.commission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </h5>
                      )}
                      {!isOwner && (
                        <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                          Repasse Dono Noah (55%): + R$ {(barber.houseShare || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* BOTÃO DE REGISTRO DO FECHAMENTO PADRÃO NOAH BARBER STUDIO */}
      {!isClosed ? (
        <button
          onClick={handleClose}
          className="w-full bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold uppercase font-mono tracking-widest text-xs py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-2xl shadow-[#DFBA73]/25 hover:brightness-110 cursor-pointer"
        >
          <Archive className="w-4 h-4" />
          <span>Registrar Fechamento do Caixa</span>
        </button>
      ) : (
        <div className="w-full bg-white/5 border border-white/10 text-gray-400 font-mono text-xs uppercase tracking-wider py-4 rounded-2xl flex items-center justify-center gap-2 opacity-60 cursor-not-allowed">
          <Archive className="w-4 h-4" />
          <span>Caixa Oficial já Fechado para esta Data</span>
        </div>
      )}
    </div>
  );
}
