"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Calendar, ChevronRight, ChevronLeft, Menu, X, Scissors, Star, MapPin, Clock, Smartphone, LogOut } from "lucide-react";
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
  "/studio/hero-2.jpg",
  "/studio/hero-3.jpg",
];

const HERO_POSITIONS = [
  "center 35%", // Foto 1: Barbeiros em ação (inalterada conforme pedido)
  "center 75%", // Foto 2: Foco mais pra baixo (cadeiras, capas Noah e piso)
  "center 75%", // Foto 3: Foco mais pra baixo (cadeiras, espelho em arco e bancada)
];

// --- CARDS DE DESTAQUE (MODELO MR BASTOS COM DADOS DO NOAH) ---
const SERVICES_HIGHLIGHT = [
  { 
    id: "corte",
    title: "Corte", 
    price: "R$ 45", 
    desc: "Corte na tesoura ou máquina com acabamento na navalha, alinhamento milimétrico e estilo autêntico.", 
    badge: "O Clássico",
    img: "/studio/hero-2.jpg" 
  },
  { 
    id: "corte-barba",
    title: "Corte & Barba", 
    price: "R$ 85", 
    desc: "A combinação perfeita: corte completo e barba esculpida na navalha com toalha aquecida e alinhamento.", 
    badge: "Mais Pedido",
    img: "/studio/hero-1.jpg" 
  },
  { 
    id: "combo-black",
    title: "Combo Black VIP", 
    price: "R$ 140", 
    desc: "Experiência completa VIP: corte, barba na toalha quente, pigmentação, sobrancelha e ozonioterapia relaxante.", 
    badge: "Experiência VIP",
    img: "/studio/hero-3.jpg" 
  }
];

// --- SERVIÇOS INDIVIDUAIS (MODELO MR BASTOS COM VALORES REAIS DO NOAH) ---
const INDIVIDUAL_SERVICES = [
  { id: "corte", name: "Corte Masculino", price: "R$ 45", desc: "Tesoura ou máquina com acabamento milimétrico na navalha e finalização" },
  { id: "barba", name: "Barba", price: "R$ 45", desc: "Modelagem com toalha aquecida, contorno na navalha e hidratação" },
  { id: "pezinho", name: "Pezinho (Cabelo)", price: "R$ 20", desc: "Alinhamento das linhas da nuca e laterais com navalha" },
  { id: "sobrancelha", name: "Sobrancelha", price: "R$ 20", desc: "Design masculino e limpeza precisa na lâmina mantendo a naturalidade" },
  { id: "pigmentacao", name: "Pigmentação", price: "R$ 40", desc: "Preenchimento e realce natural da densidade da barba ou cabelo" },
  { id: "limpeza-pele-ozonio", name: "Limpeza de Pele + Ozonioterapia", price: "R$ 65", desc: "Higienização profunda facial com vapor de ozônio e nutrição" },
  { id: "remocao-pelos", name: "Remoção de Pelos Nariz / Ouvido", price: "R$ 40", desc: "Remoção higiênica e indolor com cera hipoalergênica" },
];

// --- COMBOS & RITUAIS ESPECIAIS (MODELO MR BASTOS COM VALORES REAIS DO NOAH) ---
const COMBOS = [
  { 
    id: "corte-barba", 
    name: "Corte & Barba", 
    price: "R$ 85", 
    desc: "Corte sob medida e barba modelada na navalha com toalha quente", 
    badge: "Mais Escolhido" 
  },
  { 
    id: "barboterapia-limpeza", 
    name: "Barboterapia + Limpeza de Pele", 
    price: "R$ 90", 
    desc: "Barba completa com vapor de ozônio, toalha quente e spa facial", 
    badge: "Relaxamento Total" 
  },
  { 
    id: "combo-black", 
    name: "Combo Black VIP", 
    price: "R$ 140", 
    desc: "Corte + Barba + Sobrancelha + Ozonioterapia facial", 
    badge: "Experiência Completa" 
  },
  { 
    id: "luzes-corte-hidratacao", 
    name: "Luzes + Corte + Hidratação", 
    price: "R$ 155", 
    desc: "Iluminação capilar de alto nível com corte e hidratação profunda", 
    badge: "Estilo Exclusivo" 
  },
  { 
    id: "selagem-corte-hidratacao", 
    name: "Selagem + Corte + Hidratação", 
    price: "R$ 150", 
    desc: "Alinhamento térmico capilar, corte refinado e reconstrução dos fios", 
    badge: "Transformação" 
  },
  { 
    id: "platinado-corte-hidratacao", 
    name: "Platinado + Corte + Hidratação", 
    price: "R$ 220", 
    desc: "Descoloração global premium, corte e restauração intensiva", 
    badge: "Visual Máximo" 
  },
  { 
    id: "plano-4-servicos", 
    name: "Plano 4 Serviços (30 Dias)", 
    price: "R$ 155", 
    desc: "4 atendimentos no mês para manter cabelo ou barba impecáveis toda semana", 
    badge: "Assinatura VIP" 
  },
];

// --- COMPONENTES ANIMADOS PREMIUM (MODELO MR BASTOS) ---
const RevealText = ({ children, delay = 0 }: { children: ReactNode, delay?: number }) => (
  <div className="overflow-hidden">
    <motion.div
      initial={{ y: "100%" }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
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
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
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

// --- PÁGINA PRINCIPAL NOAH BARBER STUDIO (100% MODELO MR BASTOS) ---
export default function Home() {
  const { data: session } = useSession();
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [selectedBarberId, setSelectedBarberId] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Trava a rolagem de fundo quando o menu mobile estiver aberto
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
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const footerY = useTransform(scrollYProgress, [0.8, 1], [0, 150]);
  const footerOpacity = useTransform(scrollYProgress, [0.8, 1], [0, 0.4]);

  useEffect(() => {
    // Pré-carrega todas as fotos na GPU para transição perfeitamente fluida
    HERO_IMAGES.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });

    const loaderTimer = setTimeout(() => setIsLoading(false), 500);
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

  return (
    <div className="min-h-screen bg-[#050608] text-white font-sans selection:bg-[#DFBA73] selection:text-black">
      
      {/* LOADER INICIAL COM LOGO NOAH BARBER STUDIO */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[100] bg-[#050608] flex items-center justify-center flex-col"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="p-3 rounded-full border border-[#DFBA73]/30 bg-black/40 shadow-2xl shadow-[#DFBA73]/20"
            >
              <LogoNoahBarber variant="emblem" size={80} />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="mt-6 font-serif text-[#DFBA73] tracking-[0.3em] uppercase text-sm font-bold font-mono"
            >
              NOAH BARBER STUDIO
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVBAR (MODELO MR BASTOS - TRANSPARENTE E TOTALMENTE INTEGRADA À FOTO) */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? -20 : 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="fixed top-0 left-0 w-full px-6 py-6 md:px-12 md:py-8 flex justify-between items-center z-50 bg-transparent pointer-events-auto"
      >
        <Link href="/" className="cursor-pointer group drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          <LogoNoahBarber variant="horizontal" size={38} />
        </Link>
        
        <div className="hidden md:flex items-center gap-12 text-xs uppercase tracking-[0.2em] text-gray-200 font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-mono">
          <a href="#servicos" className="hover:text-[#DFBA73] transition-colors relative group py-1">
            Serviços
            <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[#DFBA73] transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#experiencia" className="hover:text-[#DFBA73] transition-colors relative group py-1">
            A Experiência
            <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[#DFBA73] transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#nossa-area" className="hover:text-[#DFBA73] transition-colors relative group py-1">
            O Estúdio
            <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[#DFBA73] transition-all duration-300 group-hover:w-full"></span>
          </a>
          {session ? (
            <div className="flex items-center gap-3">
              <Link href={((session?.user as any)?.role === "CLIENT" ? "/painel-cliente" : "/dashboard")} className="hover:text-[#DFBA73] transition-colors relative group py-1">
                Painel
                <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[#DFBA73] transition-all duration-300 group-hover:w-full"></span>
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
                className="text-gray-300 hover:text-red-400 transition-colors p-1 cursor-pointer"
                title="Desconectar da conta"
                aria-label="Desconectar da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="hover:text-[#DFBA73] transition-colors relative group py-1">
              Login
              <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[#DFBA73] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          )}
          <div onClick={() => openBooking()}>
            <MagneticButton className="bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black px-8 py-4 flex items-center gap-3 hover:bg-white transition-colors duration-300 shadow-xl shadow-black/40 font-bold uppercase tracking-[0.15em] cursor-pointer">
              <Calendar className="w-4 h-4" /> AGENDAR
            </MagneticButton>
          </div>
        </div>

        {/* Botão do Menu Mobile */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          aria-label="Abrir Menu de Navegação"
          className="md:hidden text-white hover:text-[#DFBA73] transition-colors p-2 -mr-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] cursor-pointer"
        >
          <Menu className="w-8 h-8" />
        </button>
      </motion.nav>

      {/* MENU MOBILE CINEMATOGRÁFICO DE LUXO (MODELO MR BASTOS) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -25 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[100] bg-[#02050A] flex flex-col justify-between p-6 overflow-y-auto md:hidden"
          >
            {/* Topo do Menu Mobile */}
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

            {/* Links Estilo Cards VIP (Modelo Mr. Bastos) */}
            <div className="flex-1 py-4 flex flex-col justify-center gap-2.5">
              <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#DFBA73] mb-0.5 font-mono">
                Navegação Exclusiva
              </p>
              
              <a
                href="#servicos"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#DFBA73]/40 active:bg-[#DFBA73]/10 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-xs font-mono font-bold text-[#DFBA73] w-6 h-6 rounded-lg bg-[#DFBA73]/10 flex items-center justify-center border border-[#DFBA73]/30">01</span>
                  <div>
                    <span className="text-base font-serif text-white block">Serviços Oficiais</span>
                    <span className="text-[11px] text-gray-400 font-light">Cortes, barboterapia e combos</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </a>

              <a
                href="#experiencia"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#DFBA73]/40 active:bg-[#DFBA73]/10 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-xs font-mono font-bold text-[#DFBA73] w-6 h-6 rounded-lg bg-[#DFBA73]/10 flex items-center justify-center border border-[#DFBA73]/30">02</span>
                  <div>
                    <span className="text-base font-serif text-white block">A Experiência</span>
                    <span className="text-[11px] text-gray-400 font-light">Atendimento personalizado e estilo</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </a>

              <a
                href="#nossa-area"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#DFBA73]/40 active:bg-[#DFBA73]/10 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-xs font-mono font-bold text-[#DFBA73] w-6 h-6 rounded-lg bg-[#DFBA73]/10 flex items-center justify-center border border-[#DFBA73]/30">03</span>
                  <div>
                    <span className="text-base font-serif text-white block">O Estúdio & Equipe</span>
                    <span className="text-[11px] text-gray-400 font-light">Morada de Laranjeiras · Serra - ES</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </a>

              <Link
                href={session ? ((session?.user as any)?.role === "CLIENT" ? "/painel-cliente" : "/dashboard") : "/login"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#DFBA73]/40 active:bg-[#DFBA73]/10 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-xs font-mono font-bold text-[#DFBA73] w-6 h-6 rounded-lg bg-[#DFBA73]/10 flex items-center justify-center border border-[#DFBA73]/30">04</span>
                  <div>
                    <span className="text-base font-serif text-white block">
                      {session ? "Meu Painel VIP" : "Área do Cliente / Barbeiro"}
                    </span>
                    <span className="text-[11px] text-gray-400 font-light">
                      {session ? "Consulte seus horários agendados" : "Acesse com seu login e senha"}
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
                  className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 active:bg-red-500/20 flex items-center justify-between transition-all group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-sm font-serif text-red-300 block">
                        Desconectar Conta
                      </span>
                      <span className="text-[10px] text-gray-400 font-light">
                        Encerrar sessão de {(session?.user?.name || "usuário")}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-red-400 font-mono uppercase tracking-wider font-bold shrink-0">Sair</span>
                </button>
              )}

              {/* Avaliação no Google no Menu Mobile */}
              <a
                href="https://www.google.com/search?q=Barbearia+do+Noah&client=opera-gx&hs=wL4&sca_esv=5f8377d5827c25f8&sxsrf=AKL5yDgHlFqxLSoauMLXprWfX-I3ndAKGg:1795401111532&udm=local&lsack=l6UDa7HyH5ul1sQPmqrEqQw&sa=X&ved=2ahUKEwjxme2rhp2YAxWbkpUCHRoVMcUQjGp6BAgrEAA&biw=1919&bih=969&dpr=1#"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3.5 rounded-2xl bg-[#DFBA73]/[0.08] border border-[#DFBA73]/30 active:bg-[#DFBA73]/20 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-[#DFBA73]/20 text-[#DFBA73] flex items-center justify-center shrink-0 border border-[#DFBA73]/40">
                    <Star className="w-4 h-4 fill-[#DFBA73]" />
                  </div>
                  <div>
                    <span className="text-base font-serif text-white block">Avalie no Google (5.0 ★)</span>
                    <span className="text-[11px] text-[#DFBA73]/90 font-light font-mono">Noah Barber Studio no Google</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#DFBA73]" />
              </a>

              {/* Baixar Aplicativo no Menu Mobile */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("trigger-pwa-install"));
                  }
                }}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 active:bg-white/10 flex items-center justify-between transition-all text-left w-full cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-white/10 text-[#DFBA73] flex items-center justify-center shrink-0 border border-white/15">
                    <Smartphone className="w-4 h-4 text-[#DFBA73]" />
                  </div>
                  <div>
                    <span className="text-base font-serif text-white block">Baixar Aplicativo</span>
                    <span className="text-[11px] text-gray-400 font-light">Instale no seu iPhone, Android ou PC</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#DFBA73]" />
              </button>
            </div>

            {/* Ações Inferiores do Menu (Modelo Mr. Bastos) */}
            <div className="space-y-3.5 pt-4 border-t border-white/10 shrink-0">
              <button 
                onClick={() => { setIsMobileMenuOpen(false); openBooking(); }}
                className="w-full bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black py-3.5 px-4 rounded-xl font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#DFBA73]/20 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer font-mono"
              >
                <Calendar className="w-4 h-4" /> AGENDAR EXPERIÊNCIA
              </button>

              <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 pt-1 font-mono">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#DFBA73]" /> Seg a Sáb · 09h às 20h</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#DFBA73]" /> Serra - ES</span>
              </div>

              {/* Redes Sociais no Menu Celular */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 font-mono">
                <a
                  href="https://instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300 text-[11px] font-semibold flex items-center justify-center gap-2"
                >
                  Instagram
                </a>
                <a
                  href="https://wa.me/5527992693638?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20um%20hor%C3%A1rio%20no%20Noah%20Barber%20Studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center justify-center gap-2"
                >
                  WhatsApp
                </a>
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

      {/* HERO SECTION COM PARALLAX E MÁSCARAS (100% MODELO MR BASTOS) */}
      <main className="relative h-screen min-h-[640px] flex items-center justify-center overflow-hidden">
        
        {/* Imagem de Fundo (Parallax + Slider Ultra Suave Sem Tremor) */}
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
                  backgroundPosition: HERO_POSITIONS[idx] || "center 70%",
                  transform: "translate3d(0, 0, 0)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              />
            );
          })}
          {/* Vinheta Cinematográfica de Luxo */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#060709]/50 via-transparent to-[#060709]/90 pointer-events-none z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(6,7,9,0.7)_100%)] pointer-events-none z-10" />
        </motion.div>

        {/* Textos Centrais com Máscara e Brilho Impecável */}
        <div className="relative z-20 text-center flex flex-col items-center mt-16 md:mt-20 px-4">
          <RevealText delay={1.2}>
            <p className="text-[#DFBA73] uppercase tracking-[0.4em] text-xs md:text-sm font-semibold mb-4 md:mb-6 flex items-center gap-3 md:gap-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-mono">
              <span className="w-8 md:w-12 h-[1px] bg-[#DFBA73]"></span>
              Atendimento Exclusivo • Estilo Único
              <span className="w-8 md:w-12 h-[1px] bg-[#DFBA73]"></span>
            </p>
          </RevealText>
          
          <h1 className="text-5xl sm:text-6xl md:text-[7rem] font-serif leading-[0.92] tracking-tight uppercase flex flex-col items-center drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
            <RevealText delay={1.3}>
              VISUAL{" "}
              <span className="italic text-transparent [-webkit-text-stroke:1px_white] hover:text-white transition-colors duration-500 cursor-pointer">
                IMPECÁVEL,
              </span>
            </RevealText>
            <RevealText delay={1.4}>
              <span className="text-[#DFBA73]">ESTILO</span> ÚNICO.
            </RevealText>
          </h1>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? 20 : 0 }} 
            transition={{ delay: 1.8, duration: 1 }}
            className="mt-8 md:mt-12 flex gap-6"
          >
            <div onClick={() => openBooking()}>
              <MagneticButton className="border border-white/20 px-8 md:px-10 py-4 md:py-5 uppercase tracking-[0.2em] text-xs hover:bg-[#DFBA73] hover:border-[#DFBA73] hover:text-[#050608] transition-all duration-500 flex items-center gap-4 group backdrop-blur-md bg-white/5 shadow-xl shadow-black/40 font-bold font-mono cursor-pointer">
                <span>Agendar Experiência</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </MagneticButton>
            </div>
          </motion.div>
        </div>

        {/* Controles do Slider (Absoluto na base) */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: isLoading ? 0 : 1 }} 
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-12 left-6 md:left-12 flex items-center gap-6 z-20"
        >
           <button 
             onClick={prevSlide} 
             className="p-3 border border-white/20 rounded-full hover:bg-white hover:text-black transition-colors cursor-pointer"
             aria-label="Slide anterior"
           >
             <ChevronLeft className="w-4 h-4" />
           </button>
           <div className="flex gap-3">
             {HERO_IMAGES.map((_, idx) => (
               <div 
                 key={idx} 
                 onClick={() => setCurrentImage(idx)} 
                 className={`h-1 cursor-pointer transition-all duration-700 ease-out ${
                   idx === currentImage 
                     ? "w-16 bg-[#DFBA73]" 
                     : "w-6 bg-white/20 hover:bg-white/50"
                 }`} 
               />
             ))}
           </div>
           <button 
             onClick={nextSlide} 
             className="p-3 border border-white/20 rounded-full hover:bg-white hover:text-black transition-colors cursor-pointer"
             aria-label="Próximo slide"
           >
             <ChevronRight className="w-4 h-4" />
           </button>
        </motion.div>
      </main>

      {/* MARQUEE GIGANTE E INVERTIDO (MODELO MR BASTOS) */}
      <div className="bg-[#050608] border-y border-white/10 py-6 overflow-hidden flex whitespace-nowrap -rotate-1 scale-105 transform-gpu relative z-20">
        <motion.div 
          animate={{ x: ["-50%", "0%"] }} 
          transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
          className="flex font-serif text-5xl uppercase tracking-widest text-[#DFBA73] opacity-80"
        >
           {[...Array(6)].map((_, i) => (
              <span key={i} className="mx-12 flex items-center gap-12">
                 Corte Premium <span className="text-white/20">✦</span> Barboterapia <span className="text-white/20">✦</span> Visagismo <span className="text-white/20">✦</span> Noah Barber Studio <span className="text-white/20">✦</span> Serra - ES <span className="text-white/20">✦</span>
              </span>
           ))}
        </motion.div>
      </div>

      {/* SESSÃO DE SERVIÇOS E PREÇOS OFICIAIS (100% MODELO MR BASTOS COM DADOS DO NOAH BARBER STUDIO) */}
      <section id="servicos" className="py-32 md:py-40 px-6 md:px-16 lg:px-24 bg-[#050608] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          
          {/* Cabeçalho da Seção de Serviços */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-20">
            <div className="max-w-2xl">
              <RevealText>
                <p className="text-[#DFBA73] uppercase tracking-[0.45em] text-xs font-semibold flex items-center gap-3 mb-4 font-mono">
                  <span className="w-10 h-[1px] bg-[#DFBA73]"></span>
                  Tabela Oficial
                </p>
              </RevealText>
              <RevealText delay={0.1}>
                <h2 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">
                  Nossos <span className="text-[#DFBA73] italic">Serviços</span> & Valores
                </h2>
              </RevealText>
              <RevealText delay={0.2}>
                <p className="text-gray-300 font-light text-base md:text-lg leading-relaxed">
                  Excelência clássica, navalha afiada e respeito ao seu tempo. Escolha seu serviço ou combo preferido e garanta seu horário.
                </p>
              </RevealText>
            </div>
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="hidden md:block mt-8 md:mt-0">
               <button 
                 type="button" 
                 onClick={() => openBooking()} 
                 className="text-[#DFBA73] uppercase tracking-[0.2em] text-xs font-semibold border border-[#DFBA73]/40 px-8 py-4 hover:bg-[#DFBA73] hover:text-black transition-all duration-300 cursor-pointer font-mono"
               >
                 Agendar Qualquer Horário
               </button>
            </motion.div>
          </div>

          {/* 3 CARDS DE DESTAQUE (MODELO MR BASTOS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
            {SERVICES_HIGHLIGHT.map((service, idx) => (
              <motion.article
                key={service.id}
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.15, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                className={`group relative overflow-hidden bg-gray-900 rounded-2xl border border-white/10 ${
                  idx === 1 ? "md:-translate-y-6 md:border-[#DFBA73]/50 shadow-[0_20px_50px_rgba(223,186,115,0.18)]" : ""
                }`}
                style={{ height: idx === 1 ? '520px' : '460px' }}
              >
                <img
                  src={service.img}
                  alt={service.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[1.5s] ease-out md:group-hover:scale-110 opacity-90 md:opacity-60 md:group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/40 md:via-[#050608]/60 to-transparent opacity-90 md:group-hover:opacity-100 transition-opacity pointer-events-none" />
                
                {/* Badge Superior */}
                <div className="absolute top-6 left-6 z-10 pointer-events-none">
                  <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-mono font-bold shadow-md">
                    {service.badge}
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 translate-y-0 md:translate-y-8 md:group-hover:translate-y-0 transition-transform duration-700 ease-out pointer-events-none z-10">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-3xl font-serif text-white">{service.title}</h3>
                  </div>
                  <p className="text-gray-300 md:text-gray-400 text-sm font-light mb-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 delay-100 max-w-[90%] md:max-w-[85%] leading-relaxed">
                    {service.desc}
                  </p>
                  <div className="flex justify-between items-center border-t border-white/10 pt-5">
                    <span className="text-[#DFBA73] font-mono tracking-widest text-2xl font-bold">{service.price}</span>
                    <div className="px-4 py-2 rounded-full border border-[#DFBA73] md:border-white/20 bg-[#DFBA73] md:bg-transparent text-black md:text-white flex items-center gap-2 text-xs uppercase tracking-wider font-semibold md:group-hover:bg-[#DFBA73] md:group-hover:border-[#DFBA73] md:group-hover:text-black transition-all duration-300 font-mono">
                      <span>Agendar</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openBooking(service.id)}
                  aria-label={`Agendar ${service.title} por ${service.price}`}
                  className="absolute inset-0 z-20 cursor-pointer rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#DFBA73] focus-visible:outline-offset-[-2px]"
                />
              </motion.article>
            ))}
          </div>

          {/* TABELA COMPLETA DE SERVIÇOS E COMBOS (MODELO MR BASTOS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* SERVIÇOS INDIVIDUAIS (COLUNA DA ESQUERDA) */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 bg-[#02050A]/70 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-md"
            >
              <div className="flex items-center gap-3 mb-8 pb-5 border-b border-white/10">
                <Scissors className="w-5 h-5 text-[#DFBA73]" />
                <h3 className="font-serif text-2xl text-white tracking-wide">Serviços Individuais</h3>
              </div>

              <ul className="space-y-6">
                {INDIVIDUAL_SERVICES.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openBooking(item.id)}
                      className="w-full text-left group flex items-baseline justify-between py-3 border-b border-white/[0.04] hover:border-[#DFBA73]/40 cursor-pointer transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#DFBA73] focus-visible:outline-offset-4 rounded-lg"
                    >
                      <span className="block flex-1 pr-4">
                        <span className="flex items-center gap-3">
                          <span className="text-white text-lg font-serif group-hover:text-[#F5D799] transition-colors">
                            {item.name}
                          </span>
                        </span>
                        <span className="block text-gray-400 text-xs font-light mt-0.5">
                          {item.desc}
                        </span>
                      </span>

                      <span className="flex items-center gap-4 shrink-0">
                        <span className="text-white font-mono text-lg font-semibold tracking-wider group-hover:text-[#DFBA73] transition-colors">
                          {item.price}
                        </span>
                        <span className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 group-hover:border-[#DFBA73] group-hover:bg-[#DFBA73] group-hover:text-black transition-all duration-300">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* COMBOS ESPECIAIS (COLUNA DA DIREITA - MODELO MR BASTOS) */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 flex flex-col justify-between gap-6"
            >
              <div className="bg-gradient-to-b from-[#DFBA73]/10 via-[#02050A]/90 to-[#02050A] border border-[#DFBA73]/30 rounded-3xl p-6 md:p-10 relative overflow-hidden h-full flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#DFBA73]/10 rounded-full blur-3xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-8 pb-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-[#DFBA73]" />
                      <h3 className="font-serif text-2xl text-white tracking-wide">Combos</h3>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#DFBA73] font-semibold font-mono">
                      Mais Vantagem
                    </span>
                  </div>

                  <ul className="space-y-5">
                    {COMBOS.map((combo) => (
                      <li key={combo.id}>
                        <button
                          type="button"
                          onClick={() => openBooking(combo.id)}
                          className="w-full text-left block p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#DFBA73]/50 hover:bg-[#DFBA73]/5 cursor-pointer transition-all duration-300 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#DFBA73] focus-visible:outline-offset-2"
                        >
                          <span className="flex items-center justify-between mb-1.5">
                            <span className="text-white font-serif text-xl group-hover:text-[#F5D799] transition-colors">
                              {combo.name}
                            </span>
                            <span className="text-[#DFBA73] font-mono text-xl font-bold">
                              {combo.price}
                            </span>
                          </span>
                          <span className="block text-gray-400 text-xs font-light mb-3">
                            {combo.desc}
                          </span>
                          <span className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-medium">
                              {combo.badge}
                            </span>
                            <span className="text-xs uppercase tracking-widest text-[#DFBA73] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform font-mono">
                              Agendar Combo <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center font-mono">
                  <p className="text-xs text-gray-400 font-light">
                    Atendimento com hora marcada ou ordem de chegada.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* SESSÃO: A EXPERIÊNCIA (100% MODELO MR BASTOS COM RETRATOS DO NOAH BARBER STUDIO) */}
      <ExperienciaSection />

      {/* SESSÃO: O ESTÚDIO & EQUIPE (100% MODELO MR BASTOS COM RETRATOS OFICIAIS DO NOAH E ADRIAN) */}
      <NossaAreaSection onSelectBarber={openBookingForBarber} />

      {/* MEGA BRAIN FINAL CTA & FOOTER (100% MODELO MR BASTOS) */}
      <section className="relative bg-[#02050A] text-[#DFBA73] min-h-screen flex flex-col items-center justify-center overflow-hidden border-t border-white/5">
        {/* Fundo Parallax Sombrio com Foto Autêntica */}
        <motion.div 
          style={{ y: footerY, opacity: footerOpacity, backgroundImage: `url('/studio/hero-1.jpg')` }}
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#02050A] via-[#02050A]/90 to-transparent pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-8 flex flex-col items-center justify-center flex-1 py-32">
          
          {/* Medalhão da Logo em Círculo com Vidro Soprado */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-24 h-24 rounded-full border border-[#DFBA73]/40 flex items-center justify-center mb-12 backdrop-blur-md bg-black/60 shadow-[0_0_30px_rgba(223,186,115,0.25)]"
          >
            <LogoNoahBarber variant="emblem" size={76} />
          </motion.div>

          {/* Título Monumental */}
          <div className="text-center space-y-4 mb-16 relative">
             <motion.h2 
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
               className="text-[3.5rem] sm:text-[4.5rem] md:text-[8rem] font-serif leading-[0.88] tracking-tighter uppercase text-white"
             >
               A Sua Nova <br /> 
               <span className="text-transparent [-webkit-text-stroke:2px_#DFBA73] hover:text-[#DFBA73] transition-colors duration-1000">
                 Assinatura
               </span>
             </motion.h2>
             <motion.p 
               initial={{ opacity: 0, y: 15 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2, duration: 0.8 }}
               className="text-lg md:text-2xl text-gray-300 font-light max-w-2xl mx-auto italic leading-relaxed"
             >
               Onde exclusividade e técnica refinada se encontram para redefinir o seu estilo.
             </motion.p>
          </div>

          {/* Botão Magnético Gigante com Brilho Refletivo */}
          <motion.div 
             initial={{ opacity: 0, y: 50 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.8, duration: 1, type: "spring" }}
             onClick={() => openBooking()} 
             className="relative group cursor-pointer"
           >
             <div className="absolute -inset-4 rounded-full bg-[#DFBA73]/25 blur-2xl group-hover:bg-[#DFBA73]/50 transition-all duration-700" />
             <MagneticButton className="relative bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black px-16 py-8 rounded-full uppercase tracking-[0.4em] text-sm font-black overflow-hidden transform hover:scale-110 transition-transform duration-500 font-mono shadow-2xl shadow-[#DFBA73]/30 cursor-pointer">
               <motion.div 
                 animate={{ y: ["0%", "-100%", "0%"] }}
                 transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[45deg]"
               />
               <span className="relative z-10 flex items-center gap-4">
                 <Calendar className="w-5 h-5 text-black" /> Reservar Horário
               </span>
             </MagneticButton>
           </motion.div>
        </div>

        {/* Rodapé Oficial (Modelo Mr. Bastos) */}
        <motion.footer 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.5, duration: 2 }}
          className="w-full border-t border-white/10 py-8 flex flex-col md:flex-row items-center justify-between px-6 md:px-12 z-20 bg-[#02050A]/90 backdrop-blur-xl"
        >
           <div className="flex items-center gap-2 mb-4 md:mb-0">
              <LogoNoahBarber variant="horizontal" size={32} />
           </div>
           <p className="text-gray-400 text-[10px] tracking-[0.3em] uppercase font-mono">
             © {new Date().getFullYear()} NOAH BARBER STUDIO • O PADRÃO DE EXCELÊNCIA.
           </p>
           <div className="flex flex-wrap items-center gap-6 mt-4 md:mt-0 font-mono">
              <button 
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("trigger-pwa-install"));
                  }
                }}
                className="text-[#DFBA73] hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" /> Baixar Aplicativo
              </button>
              <Link
                href="/politica-de-privacidade"
                className="text-gray-400 hover:text-[#DFBA73] transition-colors text-xs"
              >
                Privacidade & LGPD
              </Link>
              <a 
                href="https://www.google.com/search?q=Barbearia+do+Noah&client=opera-gx&hs=wL4&sca_esv=5f8377d5827c25f8&sxsrf=AKL5yDgHlFqxLSoauMLXprWfX-I3ndAKGg:1795401111532&udm=local&lsack=l6UDa7HyH5ul1sQPmqrEqQw&sa=X&ved=2ahUKEwjxme2rhp2YAxWbkpUCHRoVMcUQjGp6BAgrEAA&biw=1919&bih=969&dpr=1#" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-amber-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              >
                <Star className="w-3.5 h-3.5 fill-amber-300" /> Avalie no Google (5.0 ★)
              </a>
              <a 
                href="https://instagram.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-[#DFBA73] transition-colors text-xs"
              >
                Instagram
              </a>
              <a 
                href="https://wa.me/5527992693638?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20um%20hor%C3%A1rio%20no%20Noah%20Barber%20Studio" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-emerald-400 hover:text-white transition-colors text-xs"
              >
                WhatsApp (27) 99269-3638
              </a>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=Noah+Barber+Studio+Av+Paulo+Pereira+Gomes+281+Morada+de+Laranjeiras+Serra+ES" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Noah Barber Studio no Google Maps (Serra - ES)" 
                className="text-gray-400 hover:text-[#DFBA73] transition-colors"
              >
                <MapPin className="w-4 h-4" />
              </a>
           </div>
        </motion.footer>
      </section>

      {/* BOTÃO FLUTUANTE DE WHATSAPP / SOCIAL */}
      <FloatingSocialButtons />

    </div>
  );
}
