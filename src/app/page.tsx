"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  Menu, 
  X, 
  Scissors, 
  Star, 
  MapPin, 
  Clock, 
  Smartphone, 
  LogOut, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Phone
} from "lucide-react";
import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import BookingModal from "@/components/BookingModal";
import { useSession, signOut } from "next-auth/react";
import ExperienciaSection from "@/components/ExperienciaSection";
import NossaAreaSection from "@/components/NossaAreaSection";
import LogoNoahBarber from "@/components/LogoLasBarber";
import FloatingSocialButtons from "@/components/FloatingSocialButtons";

// --- FOTOS AUTÊNTICAS DO NOAH BARBER STUDIO ---
const HERO_IMAGES = [
  "/studio/hero-1.jpg",
  "/studio/hero-2.webp",
  "/studio/hero-3.webp",
];

// --- CATEGORIAS DE SERVIÇOS NOAH BARBER STUDIO ---
const SERVICE_CATEGORIES = [
  { id: "all", label: "Todos os Serviços" },
  { id: "combos", label: "Combos & Rituais VIP" },
  { id: "cabelo-barba", label: "Cabelo & Barba" },
  { id: "spa", label: "Estética & Spa Facial" },
  { id: "quimica", label: "Química & Transformação" },
  { id: "planos", label: "Planos Mensais" },
];

// --- TABELA COMPLETA DOS 15 SERVIÇOS REAIS DO NOAH BARBER STUDIO ---
const ALL_SERVICES = [
  {
    id: "combo-black",
    name: "Combo Black: Corte + Barba + Sobrancelha + Pigmentação",
    category: "combos",
    price: "R$ 140",
    duration: "60 min",
    desc: "Experiência definitiva VIP com corte na tesoura ou máquina, barba na navalha com toalha aquecida, pigmentação e sobrancelha.",
    badge: "Assinatura VIP",
    featured: true,
  },
  {
    id: "corte-barba",
    name: "Corte & Barba",
    category: "combos",
    price: "R$ 85",
    duration: "45 min",
    desc: "Harmonização facial completa com corte sob medida e barba esculpida na navalha com toalha aquecida e loção hidratante.",
    badge: "Mais Pedido",
    featured: true,
  },
  {
    id: "barboterapia-limpeza",
    name: "Barboterapia + Limpeza de Pele",
    category: "combos",
    price: "R$ 90",
    duration: "45 min",
    desc: "Barba completa com vapor de ozônio, toalha quente, massagem facial e higienização profunda para renovar a pele.",
    badge: "Relaxante",
    featured: true,
  },
  {
    id: "corte",
    name: "Corte Masculino",
    category: "cabelo-barba",
    price: "R$ 45",
    duration: "30 min",
    desc: "Corte moderno ou clássico com técnica milimétrica na tesoura e máquina, acabamento cirúrgico na navalha e finalização.",
    badge: "Clássico",
  },
  {
    id: "barba",
    name: "Barba Esculpida",
    category: "cabelo-barba",
    price: "R$ 45",
    duration: "30 min",
    desc: "Alinhamento, simetria e desenho da barba com toalha aquecida, navalhete descartável e hidratação com óleos essenciais.",
    badge: "Essencial",
  },
  {
    id: "pezinho",
    name: "Pezinho (Acabamento Capilar)",
    category: "cabelo-barba",
    price: "R$ 20",
    duration: "20 min",
    desc: "Alinhamento das linhas da nuca, costeletas e contorno do cabelo com navalha descartável para manter o corte em dia.",
    badge: "Manutenção",
  },
  {
    id: "sobrancelha",
    name: "Sobrancelha Masculina",
    category: "spa",
    price: "R$ 20",
    duration: "10 min",
    desc: "Limpeza precisa e alinhamento na lâmina mantendo a naturalidade e harmonia da expressão masculina.",
    badge: "Design",
  },
  {
    id: "pigmentacao",
    name: "Pigmentação Capilar / Barba",
    category: "spa",
    price: "R$ 40",
    duration: "30 min",
    desc: "Preenchimento e definição estética de falhas na barba ou cabelo com pigmento de alta fixação e aspecto natural.",
    badge: "Definição",
  },
  {
    id: "limpeza-pele-ozonio",
    name: "Limpeza de Pele + Vapor de Ozônio",
    category: "spa",
    price: "R$ 65",
    duration: "30 min",
    desc: "Tratamento facial com vapor de ozônio, esfoliação e higienização profunda para desobstruir poros e oxigenar a derme.",
    badge: "Revitalização",
  },
  {
    id: "remocao-pelos",
    name: "Remoção de Pelos Nariz / Ouvido",
    category: "spa",
    price: "R$ 40",
    duration: "15 min",
    desc: "Remoção higiênica e indolor de pelos excessivos com cera morna hipoalergênica descartável.",
    badge: "Higiene",
  },
  {
    id: "selagem-corte-hidratacao",
    name: "Selagem + Corte + Hidratação",
    category: "quimica",
    price: "R$ 150",
    duration: "90 min",
    desc: "Alinhamento capilar térmico para redução do frizz e volume, acompanhado de corte refinado e reconstrução profunda.",
    badge: "Transformação",
  },
  {
    id: "luzes-corte-hidratacao",
    name: "Luzes + Corte + Hidratação",
    category: "quimica",
    price: "R$ 155",
    duration: "60 min",
    desc: "Clareamento sob medida para valorizar a textura do corte com técnica moderna e hidratação reconstrutora.",
    badge: "Estilo",
  },
  {
    id: "platinado-corte-hidratacao",
    name: "Platinado + Corte + Hidratação",
    category: "quimica",
    price: "R$ 220",
    duration: "60 min",
    desc: "Descoloração global até o tom platinado perfeito, finalizado com corte estruturado e reposição lipídica dos fios.",
    badge: "Visual Máximo",
  },
  {
    id: "plano-4-servicos",
    name: "Plano 4 Serviços (30 Dias)",
    category: "planos",
    price: "R$ 155",
    duration: "30 min",
    desc: "Pacote de 4 atendimentos no mês para manter o cabelo ou barba sempre alinhados toda semana por um valor especial.",
    badge: "Assinatura VIP",
  },
  {
    id: "combo-6-servicos",
    name: "Combo 6 Serviços (30 Dias)",
    category: "planos",
    price: "R$ 220",
    duration: "45 min",
    desc: "Assinatura completa de 6 atendimentos no mês com máxima flexibilidade e prioridade na agenda.",
    badge: "Fidelidade VIP",
  },
];

// --- COMPONENTES ANIMADOS AUXILIARES ---
const RevealText = ({ children, delay = 0 }: { children: ReactNode, delay?: number }) => (
  <div className="overflow-hidden">
    <motion.div
      initial={{ y: "100%" }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, delay, ease: [0.33, 1, 0.68, 1] }}
    >
      {children}
    </motion.div>
  </div>
);

const MagneticButton = ({ children, className = "" }: { children: ReactNode, className?: string }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY } = e;
    if (!ref.current) return;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.15, y: middleY * 0.15 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
    >
      {children}
    </motion.button>
  );
};

export default function Home() {
  const { data: session } = useSession();
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [selectedBarberId, setSelectedBarberId] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  const openBooking = (serviceId?: string) => {
    setSelectedBarberId(undefined);
    setSelectedServiceId(serviceId);
    setIsModalOpen(true);
  };

  const openBookingForBarber = (barberId: string) => {
    setSelectedServiceId(undefined);
    setSelectedBarberId(barberId);
    setIsModalOpen(true);
  };

  // Trava scroll ao abrir menu mobile
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const footerY = useTransform(scrollYProgress, [0.8, 1], [0, 100]);
  const footerOpacity = useTransform(scrollYProgress, [0.8, 1], [0, 0.35]);

  useEffect(() => {
    HERO_IMAGES.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });

    const loaderTimer = setTimeout(() => setIsLoading(false), 450);
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);

    return () => {
      clearTimeout(loaderTimer);
      clearInterval(timer);
    };
  }, []);

  const nextSlide = () => setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
  const prevSlide = () => setCurrentImage((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);

  // Filtragem dos serviços na aba
  const filteredServices = activeCategory === "all"
    ? ALL_SERVICES
    : ALL_SERVICES.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F4F6F8] font-sans selection:bg-[#C5A880] selection:text-black">
      
      {/* LOADER INICIAL EXCLUSIVO NOAH BARBER STUDIO */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[100] bg-[#08090C] flex items-center justify-center flex-col"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
              className="p-3 rounded-full border border-[#C5A880]/30 bg-[#0E1117]/80 shadow-2xl shadow-[#C5A880]/20"
            >
              <LogoNoahBarber variant="emblem" size={76} />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="mt-6 text-center"
            >
              <p className="font-serif text-[#C5A880] tracking-[0.35em] uppercase text-sm font-bold font-mono">
                NOAH BARBER STUDIO
              </p>
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mt-1 font-mono">
                ATENDIMENTO EXCLUSIVO • SERRA - ES
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVBAR ARQUITETÔNICA COM ACABAMENTO CHAMPAGNE BRONZE */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? -20 : 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="fixed top-0 left-0 w-full px-6 py-5 md:px-12 md:py-6 flex justify-between items-center z-50 bg-[#08090C]/60 backdrop-blur-md border-b border-white/[0.04] pointer-events-auto"
      >
        <Link href="/" className="cursor-pointer group drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          <LogoNoahBarber variant="horizontal" size={38} />
        </Link>
        
        <div className="hidden md:flex items-center gap-10 text-xs uppercase tracking-[0.22em] text-gray-200 font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-mono">
          <a href="#servicos" className="hover:text-[#C5A880] transition-colors relative group py-1">
            Serviços
            <span className="absolute -bottom-1.5 left-0 w-0 h-[1.5px] bg-[#C5A880] transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#combo-black-vip" className="text-[#C5A880] hover:text-[#E2CCA6] transition-colors relative group py-1 flex items-center gap-1.5">
            <span className="text-[10px]">⬡</span>
            <span>Combo Black VIP</span>
            <span className="absolute -bottom-1.5 left-0 w-0 h-[1.5px] bg-[#C5A880] transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#experiencia" className="hover:text-[#C5A880] transition-colors relative group py-1">
            A Experiência
            <span className="absolute -bottom-1.5 left-0 w-0 h-[1.5px] bg-[#C5A880] transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#nossa-area" className="hover:text-[#C5A880] transition-colors relative group py-1">
            O Estúdio
            <span className="absolute -bottom-1.5 left-0 w-0 h-[1.5px] bg-[#C5A880] transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#equipe" className="hover:text-[#C5A880] transition-colors relative group py-1">
            A Equipe
            <span className="absolute -bottom-1.5 left-0 w-0 h-[1.5px] bg-[#C5A880] transition-all duration-300 group-hover:w-full"></span>
          </a>

          {session ? (
            <div className="flex items-center gap-3 pl-2 border-l border-white/10">
              <Link 
                href={((session?.user as any)?.role === "CLIENT" ? "/painel-cliente" : "/dashboard")} 
                className="hover:text-[#C5A880] transition-colors relative group py-1"
              >
                Meu Painel
                <span className="absolute -bottom-1.5 left-0 w-0 h-[1.5px] bg-[#C5A880] transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch("/api/auth/logout", { method: "POST" });
                    await signOut({ redirect: false });
                  } catch (_) {}
                  window.location.href = "/api/auth/logout";
                }}
                className="text-gray-400 hover:text-red-400 transition-colors p-1 cursor-pointer"
                title="Desconectar da conta"
                aria-label="Desconectar da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="hover:text-[#C5A880] transition-colors relative group py-1">
              Login
              <span className="absolute -bottom-1.5 left-0 w-0 h-[1.5px] bg-[#C5A880] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          )}

          <div onClick={() => openBooking()}>
            <MagneticButton className="bg-gradient-to-r from-[#E2CCA6] via-[#C5A880] to-[#8F6B38] text-black px-7 py-3 rounded-full flex items-center gap-2.5 hover:brightness-110 transition-all duration-300 bronze-glow font-bold uppercase tracking-[0.16em] cursor-pointer">
              <Calendar className="w-3.5 h-3.5" />
              <span>Agendar</span>
            </MagneticButton>
          </div>
        </div>

        {/* Botão Menu Mobile */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          aria-label="Abrir Menu de Navegação"
          className="md:hidden text-white hover:text-[#C5A880] transition-colors p-2 -mr-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] cursor-pointer"
        >
          <Menu className="w-7 h-7" />
        </button>
      </motion.nav>

      {/* MENU MOBILE CINEMATOGRÁFICO NOAH */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[100] bg-[#08090C] flex flex-col justify-between p-6 overflow-y-auto md:hidden"
          >
            {/* Topo Menu */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10 shrink-0">
              <LogoNoahBarber variant="horizontal" size={32} />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Fechar Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links Estilo Cards Noah */}
            <div className="flex-1 py-4 flex flex-col justify-center gap-2.5">
              <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#C5A880] mb-0.5 font-mono flex items-center gap-2">
                <span>⬡</span>
                <span>Noah Barber Studio • Serra - ES</span>
              </p>
              
              <a
                href="#combo-black-vip"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-[#C5A880]/[0.08] border border-[#C5A880]/30 hover:border-[#C5A880] flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-xs font-mono font-bold text-black w-6 h-6 rounded-lg bg-gradient-to-r from-[#E2CCA6] to-[#C5A880] flex items-center justify-center shadow">★</span>
                  <div>
                    <span className="text-base font-serif text-[#E2CCA6] block font-bold">Combo Black VIP (R$ 140)</span>
                    <span className="text-[11px] text-gray-400 font-light">Corte + Barba + Sobrancelha + Ozônio</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#C5A880]" />
              </a>

              <a
                href="#servicos"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#C5A880]/40 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-xs font-mono font-bold text-[#C5A880] w-6 h-6 rounded-lg bg-[#C5A880]/10 flex items-center justify-center border border-[#C5A880]/30">01</span>
                  <div>
                    <span className="text-base font-serif text-white block">Tabela de Serviços</span>
                    <span className="text-[11px] text-gray-400 font-light">15 procedimentos com valores</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </a>

              <a
                href="#experiencia"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#C5A880]/40 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-xs font-mono font-bold text-[#C5A880] w-6 h-6 rounded-lg bg-[#C5A880]/10 flex items-center justify-center border border-[#C5A880]/30">02</span>
                  <div>
                    <span className="text-base font-serif text-white block">A Experiência Noah</span>
                    <span className="text-[11px] text-gray-400 font-light">Técnica apurada e conforto</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </a>

              <a
                href="#nossa-area"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#C5A880]/40 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-xs font-mono font-bold text-[#C5A880] w-6 h-6 rounded-lg bg-[#C5A880]/10 flex items-center justify-center border border-[#C5A880]/30">03</span>
                  <div>
                    <span className="text-base font-serif text-white block">O Estúdio & Barbeiros</span>
                    <span className="text-[11px] text-gray-400 font-light">Noah Ferreira & Adrian Santos</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </a>

              <Link
                href={session ? ((session?.user as any)?.role === "CLIENT" ? "/painel-cliente" : "/dashboard") : "/login"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#C5A880]/40 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-xs font-mono font-bold text-[#C5A880] w-6 h-6 rounded-lg bg-[#C5A880]/10 flex items-center justify-center border border-[#C5A880]/30">04</span>
                  <div>
                    <span className="text-base font-serif text-white block">
                      {session ? "Painel do Usuário" : "Área do Cliente / Barbeiro"}
                    </span>
                    <span className="text-[11px] text-gray-400 font-light">
                      {session ? "Acesse seus horários marcados" : "Login com email e senha"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </Link>

              {session && (
                <button
                  type="button"
                  onClick={async () => {
                    setIsMobileMenuOpen(false);
                    try {
                      await fetch("/api/auth/logout", { method: "POST" });
                      await signOut({ redirect: false });
                    } catch (_) {}
                    window.location.href = "/api/auth/logout";
                  }}
                  className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-sm font-serif text-red-300 block">Sair da Conta</span>
                      <span className="text-[10px] text-gray-400 font-light">Encerrar sessão</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-red-400 font-mono uppercase font-bold shrink-0">Sair</span>
                </button>
              )}

              {/* Avaliação Google */}
              <a
                href="https://www.google.com/search?q=Barbearia+do+Noah&client=opera-gx&hs=wL4&sca_esv=5f8377d5827c25f8&sxsrf=AKL5yDgHlFqxLSoauMLXprWfX-I3ndAKGg:1795401111532&udm=local&lsack=l6UDa7HyH5ul1sQPmqrEqQw&sa=X&ved=2ahUKEwjxme2rhp2YAxWbkpUCHRoVMcUQjGp6BAgrEAA&biw=1919&bih=969&dpr=1#"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/25 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </div>
                  <div>
                    <span className="text-sm font-serif text-white block">Avaliações no Google (5.0 ★)</span>
                    <span className="text-[11px] text-amber-300/90 font-mono">26 avaliações de clientes reais</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </a>
            </div>

            {/* Ações Inferiores */}
            <div className="space-y-3 pt-3 border-t border-white/10 shrink-0">
              <button 
                onClick={() => { setIsMobileMenuOpen(false); openBooking(); }}
                className="w-full bg-gradient-to-r from-[#E2CCA6] via-[#C5A880] to-[#8F6B38] text-black py-3.5 px-4 rounded-xl font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2 bronze-glow cursor-pointer font-mono"
              >
                <Calendar className="w-4 h-4" /> AGENDAR NO NOAH
              </button>

              <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 font-mono">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#C5A880]" /> Seg a Sáb · 09h às 20h</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#C5A880]" /> Serra - ES</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setSelectedServiceId(undefined); 
          setSelectedBarberId(undefined); 
        }} 
        initialServiceId={selectedServiceId} 
        initialBarberId={selectedBarberId} 
        initialUserData={session?.user ? {
          name: session.user.name || undefined,
          email: session.user.email || undefined,
          phone: (session.user as any)?.phone || undefined,
        } : undefined}
      />

      {/* HERO SECTION CINEMATOGRÁFICA EXCLUSIVA NOAH BARBER STUDIO */}
      <main className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-24 pb-16">
        
        {/* Slider de Fundo com as Fotos Reais */}
        <motion.div style={{ y, opacity }} className="absolute inset-0 w-full h-[120%] -top-[10%] pointer-events-none">
          {HERO_IMAGES.map((img, idx) => {
            const isActive = idx === currentImage;
            return (
              <div
                key={img}
                aria-hidden={!isActive}
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out will-change-[opacity] ${
                  isActive ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
                style={{
                  backgroundImage: `url(${img})`,
                  transform: "translate3d(0, 0, 0)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              />
            );
          })}
          
          {/* Vinheta Arquitetônica Sombria com Reflexo Bronze */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#08090C]/80 via-[#08090C]/45 to-[#08090C] pointer-events-none z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(8,9,12,0.85)_100%)] pointer-events-none z-10" />
        </motion.div>

        {/* Conteúdo Central Monumental */}
        <div className="relative z-20 text-center flex flex-col items-center max-w-6xl mx-auto px-6">
          
          {/* Status Badge Live */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0E1117]/80 border border-[#C5A880]/30 backdrop-blur-md mb-6 shadow-lg shadow-black/60"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] md:text-xs font-mono font-bold tracking-[0.25em] text-[#E2CCA6] uppercase">
              ABERTO HOJE · 09H ÀS 20H · MORADA DE LARANJEIRAS
            </span>
          </motion.div>

          {/* Subtítulo com Hexágono */}
          <RevealText delay={0.9}>
            <p className="text-[#C5A880] uppercase tracking-[0.4em] text-xs md:text-sm font-semibold mb-4 flex items-center justify-center gap-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] font-mono">
              <span className="w-6 md:w-12 h-[1px] bg-gradient-to-r from-transparent to-[#C5A880]"></span>
              <span>⬡ ATENDIMENTO EXCLUSIVO • ESTILO ÚNICO ⬡</span>
              <span className="w-6 md:w-12 h-[1px] bg-gradient-to-l from-transparent to-[#C5A880]"></span>
            </p>
          </RevealText>
          
          {/* Título Principal */}
          <h1 className="text-4xl sm:text-6xl md:text-[6.5rem] lg:text-[7.2rem] font-serif leading-[0.94] tracking-tight uppercase flex flex-col items-center drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
            <RevealText delay={1.1}>
              ONDE A TÉCNICA
            </RevealText>
            <RevealText delay={1.2}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E2CCA6] to-[#C5A880] italic">
                ENCONTRA O SEU ESTILO
              </span>
            </RevealText>
            <RevealText delay={1.3}>
              <span className="text-white">DEFINITIVO.</span>
            </RevealText>
          </h1>

          {/* Descrição Arquitetônica */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="text-gray-300 font-light text-sm sm:text-base md:text-lg max-w-2xl mx-auto mt-6 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
          >
            Iluminação hexagonal de alta precisão, piso marmorizado e visagismo sob medida. Uma barbearia projetada para quem valoriza pontualidade e excelência em Serra - ES.
          </motion.p>

          {/* Ações / Botões */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? 20 : 0 }} 
            transition={{ delay: 1.7, duration: 0.9 }}
            className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
          >
            <div onClick={() => openBooking()}>
              <MagneticButton className="bg-gradient-to-r from-[#E2CCA6] via-[#C5A880] to-[#8F6B38] text-black px-9 py-4 rounded-full uppercase tracking-[0.2em] text-xs font-black bronze-glow hover:brightness-110 transition-all duration-300 flex items-center gap-3 font-mono cursor-pointer shadow-xl">
                <Calendar className="w-4 h-4 text-black" />
                <span>Agendar Atendimento</span>
                <ChevronRight className="w-4 h-4 text-black" />
              </MagneticButton>
            </div>

            <a 
              href="#servicos"
              className="border border-white/20 hover:border-[#C5A880] px-8 py-4 rounded-full uppercase tracking-[0.2em] text-xs text-gray-200 hover:text-white hover:bg-white/[0.04] transition-all duration-300 font-bold font-mono backdrop-blur-md"
            >
              Conhecer Serviços
            </a>
          </motion.div>

          {/* Chip de Avaliação Google 5.0 */}
          <motion.a
            href="https://www.google.com/search?q=Barbearia+do+Noah&client=opera-gx&hs=wL4&sca_esv=5f8377d5827c25f8&sxsrf=AKL5yDgHlFqxLSoauMLXprWfX-I3ndAKGg:1795401111532&udm=local&lsack=l6UDa7HyH5ul1sQPmqrEqQw&sa=X&ved=2ahUKEwjxme2rhp2YAxWbkpUCHRoVMcUQjGp6BAgrEAA&biw=1919&bih=969&dpr=1#"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.8 }}
            className="mt-8 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 border border-white/10 hover:border-[#C5A880]/50 transition-all backdrop-blur-md group"
          >
            <div className="flex items-center gap-1 text-[#C5A880]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-[#C5A880]" />
              ))}
            </div>
            <span className="text-xs text-gray-200 font-mono font-medium">
              5.0 ★ no Google · <span className="text-gray-400 group-hover:text-white transition-colors">26 avaliações</span>
            </span>
          </motion.a>

        </div>

        {/* Controles de Slide na Base */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: isLoading ? 0 : 1 }} 
          transition={{ delay: 2.1, duration: 1 }}
          className="absolute bottom-6 left-6 md:left-12 flex items-center gap-4 z-20"
        >
          <button 
            onClick={prevSlide} 
            className="p-2.5 border border-white/15 rounded-full hover:bg-white/10 hover:border-[#C5A880] transition-colors cursor-pointer text-gray-300"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-2">
            {HERO_IMAGES.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setCurrentImage(idx)} 
                aria-label={`Ir para foto ${idx + 1}`}
                className={`h-1.5 cursor-pointer rounded-full transition-all duration-500 ${
                  idx === currentImage 
                    ? "w-10 bg-[#C5A880]" 
                    : "w-3 bg-white/20 hover:bg-white/40"
                }`} 
              />
            ))}
          </div>
          <button 
            onClick={nextSlide} 
            className="p-2.5 border border-white/15 rounded-full hover:bg-white/10 hover:border-[#C5A880] transition-colors cursor-pointer text-gray-300"
            aria-label="Próximo slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      </main>

      {/* MARQUEE ARQUITETÔNICO COM DIVISORES HEXAGONAIS */}
      <div className="bg-[#0E1117] border-y border-white/[0.06] py-4 overflow-hidden flex whitespace-nowrap relative z-20">
        <motion.div 
          animate={{ x: ["-50%", "0%"] }} 
          transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
          className="flex font-mono text-xs md:text-sm uppercase tracking-[0.25em] text-[#C5A880] font-bold"
        >
          {[...Array(6)].map((_, i) => (
            <span key={i} className="mx-6 flex items-center gap-6">
              <span>NOAH FERREIRA</span>
              <span className="text-white/20">⬡</span>
              <span>ADRIAN SANTOS</span>
              <span className="text-white/20">⬡</span>
              <span>ILUMINAÇÃO HEXAGONAL</span>
              <span className="text-white/20">⬡</span>
              <span>COMBO BLACK VIP</span>
              <span className="text-white/20">⬡</span>
              <span>VISAGISMO CIRÚRGICO</span>
              <span className="text-white/20">⬡</span>
              <span>BARBOTERAPIA & OZÔNIO</span>
              <span className="text-white/20">⬡</span>
              <span>MORADA DE LARANJEIRAS</span>
              <span className="text-white/20">⬡</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* DESTAQUE VIP: O COMBO BLACK VIP (ASSINATURA NOAH) */}
      <section id="combo-black-vip" className="py-20 md:py-28 px-6 md:px-16 lg:px-24 bg-[#08090C] relative border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl overflow-hidden border border-[#C5A880]/40 bg-gradient-to-br from-[#0E1117] via-[#141720] to-[#08090C] p-8 md:p-14 shadow-2xl bronze-glow-subtle"
          >
            {/* Elemento de iluminação geométrica sutil ao fundo */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/30 text-[#E2CCA6] text-xs font-mono font-bold tracking-widest uppercase mb-5">
                  <span>⬡</span>
                  <span>O RITUAL MAIS COMPLETO DO ESTÚDIO</span>
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white tracking-tight mb-4">
                  Combo Black <span className="text-[#C5A880] italic">VIP</span>
                </h2>

                <p className="text-gray-300 font-light text-base md:text-lg leading-relaxed mb-6">
                  O auge do autocuidado masculino. Um ritual cinematográfico que combina corte de alta precisão, toalha quente, pigmentação e visagismo para transformar o seu visual por completo.
                </p>

                {/* 4 Pilares Inclusos no Combo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
                  <div className="flex items-center gap-3 text-sm text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0" />
                    <span>Corte de Cabelo na Tesoura ou Máquina</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0" />
                    <span>Barba Esculpida com Toalha Quente</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0" />
                    <span>Design Masculino de Sobrancelha</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0" />
                    <span>Pigmentação e Alinhamento Perfeito</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-400">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#C5A880]" /> Duração estimada: 60 minutos</span>
                  <span className="text-white/20">|</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#C5A880]" /> Procedimento 100% esterilizado</span>
                </div>
              </div>

              {/* Bloco de Preço & Agendamento */}
              <div className="lg:w-80 p-8 rounded-2xl bg-black/60 border border-[#C5A880]/30 flex flex-col justify-between text-center backdrop-blur-md shrink-0 shadow-xl">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-400 block mb-1">
                    Valor da Experiência
                  </span>
                  <div className="text-4xl md:text-5xl font-mono font-bold text-[#E2CCA6] mb-2">
                    R$ 140
                  </div>
                  <p className="text-[11px] text-gray-400 font-light mb-6">
                    Economize garantindo os 4 serviços em um único ritual com toalha quente
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openBooking("combo-black")}
                  className="w-full bg-gradient-to-r from-[#E2CCA6] via-[#C5A880] to-[#8F6B38] text-black py-4 px-6 rounded-xl font-bold uppercase tracking-[0.2em] text-xs bronze-glow hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer font-mono flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-black" />
                  <span>Agendar Combo Black</span>
                </button>
              </div>

            </div>

          </motion.div>

        </div>
      </section>

      {/* SEÇÃO PRINCIPAL DE SERVIÇOS DO NOAH COM NAVEGAÇÃO POR CATEGORIAS */}
      <section id="servicos" className="py-24 md:py-36 px-6 md:px-16 lg:px-24 bg-[#08090C] relative">
        <div className="max-w-7xl mx-auto">
          
          {/* Cabeçalho da Seção */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <RevealText>
                <p className="text-[#C5A880] uppercase tracking-[0.45em] text-xs font-semibold flex items-center gap-3 mb-4 font-mono">
                  <span className="w-8 h-[1px] bg-[#C5A880]"></span>
                  <span>⬡ Tabela Oficial Noah Barber Studio</span>
                </p>
              </RevealText>
              <RevealText delay={0.1}>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif leading-tight">
                  Menu de <span className="text-[#C5A880] italic">Procedimentos</span> & Rituais
                </h2>
              </RevealText>
              <RevealText delay={0.2}>
                <p className="text-gray-300 font-light text-base md:text-lg leading-relaxed mt-4">
                  Transparência total nos valores, tempo de execução respeitado e padrão impecável em cada atendimento em Morada de Laranjeiras.
                </p>
              </RevealText>
            </div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <button 
                type="button" 
                onClick={() => openBooking()} 
                className="text-[#C5A880] uppercase tracking-[0.2em] text-xs font-semibold border border-[#C5A880]/40 px-7 py-3.5 rounded-full hover:bg-[#C5A880] hover:text-black transition-all duration-300 cursor-pointer font-mono"
              >
                Agendar Qualquer Procedimento
              </button>
            </motion.div>
          </div>

          {/* Abas de Navegação / Filtros de Categoria */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-12 scrollbar-none">
            {SERVICE_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-[#E2CCA6] via-[#C5A880] to-[#8F6B38] text-black shadow-lg shadow-[#C5A880]/20 font-bold"
                      : "bg-[#0E1117] text-gray-300 border border-white/5 hover:border-[#C5A880]/40 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Grid de Serviços com o Design Exclusivo Noah */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, idx) => (
              <motion.article
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.6 }}
                className="group relative rounded-2xl p-7 bg-[#0E1117] border border-white/[0.06] hover:border-[#C5A880]/50 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-black/70"
              >
                {/* Linha do Topo: Badge de Categoria e Duração */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-1 rounded-md bg-[#C5A880]/10 text-[#E2CCA6] border border-[#C5A880]/20">
                    {service.badge}
                  </span>
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                    {service.duration}
                  </span>
                </div>

                {/* Nome e Descrição */}
                <div className="mb-6 flex-1">
                  <h3 className="font-serif text-xl sm:text-2xl text-white group-hover:text-[#E2CCA6] transition-colors leading-snug mb-2.5">
                    {service.name}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm font-light leading-relaxed">
                    {service.desc}
                  </p>
                </div>

                {/* Preço e Botão de Agendar */}
                <div className="pt-5 border-t border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Investimento</span>
                    <span className="font-mono text-2xl font-bold text-[#E2CCA6]">{service.price}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openBooking(service.id)}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-[#C5A880] text-gray-200 hover:text-black border border-white/10 hover:border-[#C5A880] text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 cursor-pointer shadow-md"
                  >
                    <span>Agendar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Chamada para o WhatsApp para dúvidas */}
          <div className="mt-14 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="text-white font-serif text-lg">Dúvida sobre qual procedimento escolher?</p>
              <p className="text-gray-400 text-xs font-light mt-0.5">Fale diretamente com Noah Ferreira no WhatsApp para consultoria de estilo e visagismo.</p>
            </div>
            <a
              href="https://wa.me/5527992693638?text=Ol%C3%A1%20Noah!%20Gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20os%20servi%C3%A7os"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500 hover:text-black transition-all text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Chamar no WhatsApp</span>
            </a>
          </div>

        </div>
      </section>

      {/* SESSÃO: A EXPERIÊNCIA NOAH BARBER STUDIO */}
      <ExperienciaSection />

      {/* SESSÃO: O ESTÚDIO, ARQUITETURA & EQUIPE OFICIAL */}
      <NossaAreaSection onSelectBarber={openBookingForBarber} />

      {/* GRAND FINALE / FOOTER COM O EMBLEMA NOAH BARBER STUDIO */}
      <section className="relative bg-[#08090C] text-[#C5A880] min-h-[85vh] flex flex-col items-center justify-center overflow-hidden border-t border-white/[0.06]">
        {/* Fundo Parallax Suave */}
        <motion.div 
          style={{ y: footerY, opacity: footerOpacity, backgroundImage: `url('/studio/hero-1.jpg')` }}
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/90 to-transparent pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 flex flex-col items-center justify-center flex-1 py-28 text-center">
          
          {/* Emblema com Glow Bronze */}
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-24 h-24 rounded-3xl border border-[#C5A880]/40 flex items-center justify-center mb-10 backdrop-blur-md bg-black/70 bronze-glow"
          >
            <LogoNoahBarber variant="emblem" size={76} />
          </motion.div>

          {/* Título Monumental */}
          <div className="space-y-4 mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif uppercase tracking-tight text-white leading-[0.92]"
            >
              Seu Estilo no <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E2CCA6] to-[#C5A880] italic">
                Padrão Noah.
              </span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-base sm:text-xl text-gray-300 font-light max-w-xl mx-auto leading-relaxed"
            >
              Av. Paulo Pereira Gomes, 281 - Loja 9 · Morada de Laranjeiras, Serra - ES
            </motion.p>
          </div>

          {/* Botão Magnético de Agendamento */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            onClick={() => openBooking()} 
            className="cursor-pointer"
          >
            <MagneticButton className="bg-gradient-to-r from-[#E2CCA6] via-[#C5A880] to-[#8F6B38] text-black px-12 sm:px-16 py-6 rounded-full uppercase tracking-[0.3em] text-xs sm:text-sm font-black bronze-glow hover:brightness-110 active:scale-[0.98] transition-all font-mono shadow-2xl flex items-center gap-3">
              <Calendar className="w-4 h-4 text-black" />
              <span>Reservar Horário Agora</span>
            </MagneticButton>
          </motion.div>

        </div>

        {/* Rodapé Legal & Links */}
        <footer className="w-full border-t border-white/[0.08] py-8 px-6 md:px-12 z-20 bg-[#0E1117]/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-3">
              <LogoNoahBarber variant="horizontal" size={30} />
            </div>

            <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.25em] uppercase font-mono text-center">
              © {new Date().getFullYear()} NOAH BARBER STUDIO • ATENDIMENTO EXCLUSIVO • SERRA - ES
            </p>

            <div className="flex flex-wrap items-center justify-center gap-5 font-mono text-xs">
              <button 
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("trigger-pwa-install"));
                  }
                }}
                className="text-[#C5A880] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" /> Baixar App
              </button>
              <Link
                href="/politica-de-privacidade"
                className="text-gray-400 hover:text-[#C5A880] transition-colors"
              >
                Privacidade & LGPD
              </Link>
              <a 
                href="https://www.google.com/search?q=Barbearia+do+Noah&client=opera-gx&hs=wL4&sca_esv=5f8377d5827c25f8&sxsrf=AKL5yDgHlFqxLSoauMLXprWfX-I3ndAKGg:1795401111532&udm=local&lsack=l6UDa7HyH5ul1sQPmqrEqQw&sa=X&ved=2ahUKEwjxme2rhp2YAxWbkpUCHRoVMcUQjGp6BAgrEAA&biw=1919&bih=969&dpr=1#" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-amber-300 hover:text-white transition-colors flex items-center gap-1.5 font-semibold"
              >
                <Star className="w-3.5 h-3.5 fill-amber-300" /> Google 5.0 ★
              </a>
              <a 
                href="https://wa.me/5527992693638?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20um%20hor%C3%A1rio%20no%20Noah%20Barber%20Studio" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-emerald-400 hover:text-white transition-colors"
              >
                WhatsApp (27) 99269-3638
              </a>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=Noah+Barber+Studio+Av+Paulo+Pereira+Gomes+281+Morada+de+Laranjeiras+Serra+ES" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Abrir no Google Maps" 
                className="text-gray-400 hover:text-[#C5A880] transition-colors"
              >
                <MapPin className="w-4 h-4" />
              </a>
            </div>

          </div>
        </footer>
      </section>

      {/* BOTÕES FLUTUANTES SOCIAIS */}
      <FloatingSocialButtons />

    </div>
  );
}
