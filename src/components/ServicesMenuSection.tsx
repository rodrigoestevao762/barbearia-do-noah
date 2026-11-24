"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  MapPin, 
  Crown, 
  Flame, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Sparkle,
  LayoutGrid,
  ListFilter,
  Calendar,
  MessageCircle,
  ShieldCheck,
  Search,
  Scissors,
  ShoppingBag,
  CreditCard,
  QrCode,
  Banknote,
  Instagram,
  Check
} from "lucide-react";
import { OFFICIAL_SERVICES, ServiceItem } from "@/lib/services";
import { OFFICIAL_PRODUCTS, ProductItem } from "@/lib/products";

interface ServicesMenuSectionProps {
  onSelectService: (serviceId: string) => void;
}

type MainTab = "servicos" | "produtos";
type CategoryType = "todos" | "combo" | "corte" | "barba" | "estetica";
type ProductCategoryType = "todos" | "cabelo-barba" | "tratamento" | "bebidas";
type ViewMode = "cards" | "lista";

const CATEGORIES: { id: CategoryType; label: string; icon: any; count: number }[] = [
  { id: "todos", label: "Todos os Serviços", icon: Sparkle, count: 11 },
  { id: "combo", label: "Combos & Rituais", icon: Crown, count: 3 },
  { id: "corte", label: "Cortes de Precisão", icon: Sparkles, count: 3 },
  { id: "barba", label: "Barba & Cuidados", icon: Flame, count: 2 },
  { id: "estetica", label: "Estética & Cuidado", icon: ShieldCheck, count: 3 },
];

const PRODUCT_CATEGORIES: { id: ProductCategoryType; label: string; icon: any; count: number }[] = [
  { id: "todos", label: "Todos os Produtos", icon: Sparkle, count: 15 },
  { id: "cabelo-barba", label: "Cabelo & Barba", icon: Flame, count: 9 },
  { id: "tratamento", label: "Tratamento & Crescimento", icon: Sparkles, count: 2 },
  { id: "bebidas", label: "Bebidas & Geladeira", icon: Crown, count: 3 },
];

const WHATSAPP_CONCIERGE = "https://wa.me/5527992693638?text=Ol%C3%A1%20Noah!%20Gostaria%20de%20tirar%20d%C3%BAvidas%20sobre%20os%20servi%C3%A7os%20do%20Noah%20Barber%20Studio.";
const INSTAGRAM_URL = "https://www.instagram.com/studio.nbarber?utm_source=ig_web_button_share_sheet&hvrq=ZDNlZDc0MzIxNw==";

const HORARIOS_STUDIO = [
  { dia: "Segunda", hora: "09:00 às 20:00" },
  { dia: "Terça", hora: "09:00 às 20:00" },
  { dia: "Quarta", hora: "09:00 às 20:00" },
  { dia: "Quinta", hora: "09:00 às 20:00" },
  { dia: "Sexta", hora: "09:00 às 20:00" },
  { dia: "Sábado", hora: "09:00 às 20:00" },
  { dia: "Domingo", hora: "Fechado" },
];

export default function ServicesMenuSection({ onSelectService }: ServicesMenuSectionProps) {
  const [mainTab, setMainTab] = useState<MainTab>("servicos");
  const [activeCategory, setActiveCategory] = useState<CategoryType>("todos");
  const [activeProductCategory, setActiveProductCategory] = useState<ProductCategoryType>("todos");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Filtra serviços
  const filteredServices = useMemo(() => {
    return OFFICIAL_SERVICES.filter((service) => {
      const matchesCategory = activeCategory === "todos" || service.category === activeCategory;
      const matchesSearch = searchTerm.trim() === "" || 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.tags && service.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);

  // Filtra produtos
  const filteredProducts = useMemo(() => {
    return OFFICIAL_PRODUCTS.filter((product) => {
      const matchesCategory = activeProductCategory === "todos" || product.category === activeProductCategory;
      const matchesSearch = productSearchTerm.trim() === "" ||
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(productSearchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeProductCategory, productSearchTerm]);

  // Combo destaque para o spotlight
  const comboDestaque = OFFICIAL_SERVICES.find((s) => s.id === "combo-corte-barba-sobrancelha") || OFFICIAL_SERVICES[0];

  return (
    <section id="servicos" className="py-24 md:py-32 px-4 sm:px-6 md:px-12 bg-[#050608] relative overflow-hidden selection:bg-[#DFBA73] selection:text-black">
      {/* Luzes ambiente douradas vibrantes de alto padrão (GPU otimizadas) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[radial-gradient(ellipse_at_center,_rgba(223,186,115,0.12)_0%,_transparent_70%)] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[radial-gradient(ellipse_at_center,_rgba(184,139,56,0.08)_0%,_transparent_70%)] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* ── ATELIER EDITORIAL HEADER VIBRANTE ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DFBA73]/15 border border-[#DFBA73]/40 backdrop-blur-md shadow-lg shadow-[#DFBA73]/10">
              <span className="w-2 h-2 rounded-full bg-[#DFBA73] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#F5D799] font-bold">
                Noah Ferreira • Haute Barbiere
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-white tracking-tight">
              {mainTab === "servicos" ? (
                <>Menu de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] italic font-medium">Serviços & Rituais.</span></>
              ) : (
                <>Catálogo de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] italic font-medium">Produtos & Cosméticos.</span></>
              )}
            </h2>

            <p className="text-gray-300 text-sm sm:text-base font-light max-w-2xl leading-relaxed">
              {mainTab === "servicos"
                ? "Alta precisão capilar, alinhamento de barba e toalha aquecida em estúdio 100% privativo. Cada atendimento é um ritual individualizado, sem espera e sem ruídos."
                : "Linha profissional de finalizadores, óleos nobres, estimulantes capilares e bebidas geladas selecionadas para levar a experiência do estúdio para a sua casa."
              }
            </p>
          </div>

          {/* Badges de Localização, Horário e Contato */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center gap-2.5 text-xs font-mono">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-[#DFBA73]/30 text-gray-200 backdrop-blur-md shadow-md">
              <MapPin className="w-3.5 h-3.5 text-[#DFBA73] shrink-0" />
              <span>Av. Paulo Pereira Gomes, 281, Loja 9 — Serra - ES</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#DFBA73]/15 border border-[#DFBA73]/40 text-[#F5D799] font-bold backdrop-blur-md shadow-md shadow-[#DFBA73]/10">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>09:00 às 20:00 • Seg a Sáb</span>
            </div>
          </div>
        </div>

        {/* ── SELETOR PRINCIPAL: [ SERVIÇOS & RITUAIS ] vs [ PRODUTOS & COSMÉTICOS ] ── */}
        <div className="flex flex-wrap items-center justify-start gap-3 mb-10 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 w-fit backdrop-blur-md">
          <button
            onClick={() => setMainTab("servicos")}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest transition-all cursor-pointer ${
              mainTab === "servicos"
                ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold shadow-xl shadow-[#DFBA73]/25 scale-100"
                : "text-gray-300 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Serviços & Valores</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              mainTab === "servicos" ? "bg-black/25 text-black" : "bg-white/10 text-gray-300"
            }`}>
              {OFFICIAL_SERVICES.length}
            </span>
          </button>

          <button
            onClick={() => setMainTab("produtos")}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest transition-all cursor-pointer ${
              mainTab === "produtos"
                ? "bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black font-bold shadow-xl shadow-[#DFBA73]/25 scale-100"
                : "text-gray-300 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Produtos</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              mainTab === "produtos" ? "bg-black/25 text-black" : "bg-white/10 text-gray-300"
            }`}>
              {OFFICIAL_PRODUCTS.length}
            </span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SEÇÃO 1: SERVIÇOS & RITUAIS (QUANDO ABA SERVIÇOS ESTIVER ATIVA)
           ══════════════════════════════════════════════════════════════ */}
        {mainTab === "servicos" && (
          <div>
            {/* ── SPOTLIGHT HERO: O RITUAL SUPREMO DO NOAH BARBER STUDIO ── */}
            <div className="mb-14 relative group rounded-3xl overflow-hidden border border-[#DFBA73]/50 bg-gradient-to-br from-[#0e121a] via-[#080A0E] to-[#050608] p-6 sm:p-8 md:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_30px_rgba(223,186,115,0.18)] hover:border-[#DFBA73]/80 transition-all duration-700">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#DFBA73]/15 via-transparent to-transparent pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                {/* Foto Real do Estúdio Privativo */}
                <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] border border-[#DFBA73]/30 shadow-2xl group-hover:scale-[1.01] transition-transform duration-700">
                  <Image
                    src={comboDestaque.image}
                    alt="Estúdio Privativo Noah Barber Studio"
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-[#DFBA73]/40 text-[11px] font-mono tracking-wider text-[#F5D799] uppercase font-bold">
                    Atendimento 1 a 1 Exclusivo
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-gray-200">
                    <span className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                      <Clock className="w-3.5 h-3.5 text-[#DFBA73]" /> 75 Minutos de Imersão
                    </span>
                    <span className="bg-gradient-to-r from-[#F5D799] to-[#DFBA73] text-black font-bold px-3 py-1 rounded-lg shadow-md shadow-[#DFBA73]/20">
                      Top 1 Recomendado
                    </span>
                  </div>
                </div>

                {/* Conteúdo do Ritual Supremo */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#DFBA73] tracking-[0.2em] uppercase font-bold">
                      <Crown className="w-4 h-4 text-[#DFBA73]" />
                      <span>Experiência Suprema da Casa</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif text-white font-normal leading-tight">
                      Combo Completo <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] italic font-semibold">(Corte + Barba + Sobrancelha)</span>
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base font-light leading-relaxed">
                      O protocolo essencial de alinhamento masculino do Noah Barber Studio. Desfrute de corte capilar de precisão sob medida, barba desenhada na toalha aquecida com navalha clássica e alinhamento de sobrancelha com total discrição.
                    </p>
                  </div>

                  {/* Etapas do Ritual */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-white/10 text-xs font-light text-gray-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#DFBA73] shrink-0" />
                      <span>Corte capilar de alta precisão sob medida</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#DFBA73] shrink-0" />
                      <span>Barba desenhada com toalha aquecida e navalha</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#DFBA73] shrink-0" />
                      <span>Alinhamento de sobrancelha com discrição masculina</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#DFBA73] shrink-0" />
                      <span>Finalização nobre com pomada matte e óleo nobre</span>
                    </div>
                  </div>

                  {/* Linha de Preço e Agendamento Imediato */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">
                        Investimento no Combo
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38]">
                          R$ 100,00
                        </span>
                        <span className="text-xs font-mono text-gray-400">
                          / 75 min
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onSelectService(comboDestaque.id)}
                        className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] hover:brightness-110 text-black font-bold text-xs uppercase font-mono tracking-wider transition-all duration-300 shadow-xl shadow-[#DFBA73]/25 group cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Reservar Combo (Corte + Barba + Sobrancelha)</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <a
                        href={WHATSAPP_CONCIERGE}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-gray-300 hover:text-white transition-all shadow-sm"
                        title="Dúvidas no WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── BARRA DE CONTROLE: CATEGORIAS + MODO DE VISUALIZAÇÃO + BUSCA ── */}
            <div className="space-y-4 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Abas de Categorias */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono tracking-wider transition-all whitespace-nowrap relative cursor-pointer ${
                          isActive 
                            ? "text-black font-bold bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] shadow-lg shadow-[#DFBA73]/25" 
                            : "text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-[#DFBA73]"}`} />
                        <span>{cat.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                          isActive ? "bg-black/25 text-black font-bold" : "bg-white/10 text-gray-300"
                        }`}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Alternador de Modo (Cards vs Lista) & Campo de Busca */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {/* Busca Rápida */}
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar serviço..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-base sm:text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#DFBA73] transition-colors font-mono"
                    />
                  </div>

                  {/* Botões de Modo */}
                  <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10">
                    <button
                      onClick={() => setViewMode("cards")}
                      className={`p-2 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                        viewMode === "cards" 
                          ? "bg-gradient-to-r from-[#F5D799] to-[#DFBA73] text-black font-bold shadow-md shadow-[#DFBA73]/20" 
                          : "text-gray-400 hover:text-white"
                      }`}
                      title="Galeria Editorial de Cards"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px] font-mono">Cards</span>
                    </button>
                    <button
                      onClick={() => setViewMode("lista")}
                      className={`p-2 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                        viewMode === "lista" 
                          ? "bg-gradient-to-r from-[#F5D799] to-[#DFBA73] text-black font-bold shadow-md shadow-[#DFBA73]/20" 
                          : "text-gray-400 hover:text-white"
                      }`}
                      title="Lista Concierge Sintética"
                    >
                      <ListFilter className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px] font-mono">Lista</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Subtítulo informativo do filtro */}
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
                <span>
                  Exibindo <strong className="text-[#DFBA73]">{filteredServices.length}</strong> de {OFFICIAL_SERVICES.length} rituais
                </span>
                <span className="text-[11px] hidden sm:inline text-gray-400">
                  Estúdio climatizado • Café expresso & bebidas cortesia • Som ambiente suave
                </span>
              </div>
            </div>

            {/* ── MODO 1: GALERIA EDITORIAL DE CARDS VIBRANTES ── */}
            {viewMode === "cards" && (
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7"
              >
                <AnimatePresence>
                  {filteredServices.map((service) => (
                    <motion.div
                      layout
                      key={service.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => onSelectService(service.id)}
                      className="group relative bg-[#080A0E] backdrop-blur-md rounded-2xl overflow-hidden border border-[#DFBA73]/40 hover:border-[#DFBA73]/90 transition-all duration-500 flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_22px_rgba(223,186,115,0.15)] hover:shadow-[0_16px_50px_rgba(223,186,115,0.30)] cursor-pointer"
                    >
                      {/* Container da Imagem Editorial */}
                      <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-black/40">
                        <Image
                          src={service.image}
                          alt={service.name}
                          fill
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        
                        {/* Gradiente escuro elegante para contraste e legibilidade */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#080A0E] via-[#080A0E]/30 to-black/50" />

                        {/* Top Bar no Card */}
                        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                          <span className="text-xs font-mono tracking-widest text-[#F5D799] bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#DFBA73]/30 font-bold">
                            {service.index}
                          </span>
                          {service.badge && (
                            <span className="text-[10px] font-mono tracking-wider uppercase text-[#F5D799] bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#DFBA73]/40 font-bold shadow-md">
                              {service.badge}
                            </span>
                          )}
                        </div>

                        {/* Duração & Categoria flutuantes sobre a imagem */}
                        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between z-10 text-xs font-mono">
                          <span className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md text-gray-200 px-2.5 py-1 rounded-lg border border-white/10">
                            <Clock className="w-3.5 h-3.5 text-[#DFBA73]" />
                            {service.duration} min
                          </span>
                          <span className="text-[11px] text-[#F5D799] font-semibold bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#DFBA73]/20">
                            {service.categoryLabel}
                          </span>
                        </div>
                      </div>

                      {/* Conteúdo do Card */}
                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2.5">
                          <h4 className="text-xl sm:text-2xl font-serif font-normal text-white group-hover:text-[#F5D799] transition-colors leading-snug">
                            {service.name}
                          </h4>
                          <p className="text-gray-300 text-xs sm:text-sm font-light leading-relaxed line-clamp-3">
                            {service.description}
                          </p>
                        </div>

                        {/* Tags de Especificação */}
                        {service.tags && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {service.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-gray-300 border border-white/5"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Preço e Botão de Agendamento */}
                        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                              Valor do Serviço
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38]">
                                R$ {service.price.toFixed(2).replace(".", ",")}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectService(service.id);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] hover:brightness-110 text-black font-bold text-xs font-mono transition-all duration-300 shadow-md shadow-[#DFBA73]/20 group/btn cursor-pointer"
                          >
                            <span>Agendar</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── MODO 2: LISTA CONCIERGE SINTÉTICA ── */}
            {viewMode === "lista" && (
              <div className="bg-[#080A0E] backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="divide-y divide-white/5">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => onSelectService(service.id)}
                      className="p-4 sm:p-6 hover:bg-white/[0.04] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                    >
                      {/* Foto Miniatura + Dados Principais */}
                      <div className="flex items-center gap-4 sm:gap-5 flex-1">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 group-hover:border-[#DFBA73]/50 transition-colors">
                          <Image
                            src={service.image}
                            alt={service.name}
                            fill
                            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            sizes="80px"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-[#DFBA73] font-bold">
                              {service.index}.
                            </span>
                            <h4 className="text-lg sm:text-xl font-serif text-white group-hover:text-[#F5D799] transition-colors">
                              {service.name}
                            </h4>
                            {service.badge && (
                              <span className="text-[10px] font-mono tracking-wider uppercase text-[#F5D799] bg-[#DFBA73]/15 px-2 py-0.5 rounded border border-[#DFBA73]/30 font-bold">
                                {service.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 text-xs font-light max-w-xl line-clamp-1 sm:line-clamp-2">
                            {service.description}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] font-mono text-gray-400 pt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#DFBA73]" /> {service.duration} min
                            </span>
                            <span>•</span>
                            <span>{service.categoryLabel}</span>
                          </div>
                        </div>
                      </div>

                      {/* Preço e Botão de Ação */}
                      <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-0 border-white/5">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                            Valor
                          </span>
                          <span className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38]">
                            R$ {service.price.toFixed(2).replace(".", ",")}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectService(service.id);
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] hover:brightness-110 text-black font-bold text-xs font-mono transition-all duration-300 shadow-md shadow-[#DFBA73]/20 group/btn cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Agendar Horário</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SEÇÃO 2: PRODUTOS & COSMÉTICOS (QUANDO ABA PRODUTOS ESTIVER ATIVA)
           ══════════════════════════════════════════════════════════════ */}
        {mainTab === "produtos" && (
          <div className="space-y-8">
            {/* Barra de Filtro de Categorias de Produtos e Busca */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                {PRODUCT_CATEGORIES.map((pCat) => {
                  const Icon = pCat.icon;
                  const isActive = activeProductCategory === pCat.id;
                  return (
                    <button
                      key={pCat.id}
                      onClick={() => setActiveProductCategory(pCat.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "text-black font-bold bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] shadow-lg shadow-[#DFBA73]/25"
                          : "text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-[#DFBA73]"}`} />
                      <span>{pCat.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        isActive ? "bg-black/25 text-black font-bold" : "bg-white/10 text-gray-300"
                      }`}>
                        {pCat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Busca de Produtos */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produto ou marca..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-base sm:text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#DFBA73] transition-colors font-mono"
                />
              </div>
            </div>

            {/* Layout em 2 Colunas: Grade de Produtos (Esq) + Card de Informações e Formas de Pagamento (Dir) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Coluna da Esquerda: Grade dos Produtos */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {filteredProducts.map((prod) => {
                    const whatsappMsg = `https://wa.me/5527992693638?text=${encodeURIComponent(
                      `Olá Noah! Gostaria de reservar o produto ${prod.name} (${prod.formattedPrice}) no Noah Barber Studio.`
                    )}`;

                    return (
                      <div
                        key={prod.id}
                        className="group bg-[#0A0C10] border border-white/10 hover:border-[#DFBA73]/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 shadow-xl hover:shadow-[#DFBA73]/10 relative overflow-hidden"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono tracking-widest uppercase text-[#DFBA73] font-bold block">
                                {prod.brand || prod.categoryLabel}
                              </span>
                              <h4 className="text-base sm:text-lg font-serif text-white group-hover:text-[#F5D799] transition-colors leading-snug">
                                {prod.name}
                              </h4>
                            </div>

                            <span className="text-xs font-mono font-bold text-black bg-gradient-to-r from-[#F5D799] to-[#DFBA73] px-2.5 py-1 rounded-lg shrink-0 shadow-sm">
                              {prod.formattedPrice}
                            </span>
                          </div>

                          <p className="text-gray-300 text-xs font-light leading-relaxed">
                            {prod.description}
                          </p>
                        </div>

                        <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Pronta Entrega
                          </span>

                          <a
                            href={whatsappMsg}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-[#DFBA73]/15 border border-white/10 hover:border-[#DFBA73]/40 text-[#F5D799] font-mono text-xs font-semibold transition-all hover:scale-[1.02] cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Garantir</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coluna da Direita: Card Estilo BarberBook (Localização, Horários, Pagamentos, Contato) */}
              <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                <div className="rounded-2xl border border-[#DFBA73]/30 bg-[#0A0C10] p-6 space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#DFBA73]/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Localização */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#DFBA73] uppercase tracking-widest font-bold">
                      <MapPin className="w-3.5 h-3.5 text-[#DFBA73]" />
                      <span>Localização do Studio</span>
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed font-sans">
                      Av. Paulo Pereira Gomes, 281, Morada de Laranjeiras, Loja 9 — Serra - ES
                    </p>
                  </div>

                  {/* Horário de Funcionamento */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#DFBA73] uppercase tracking-widest font-bold">
                      <Clock className="w-3.5 h-3.5 text-[#DFBA73]" />
                      <span>Horário de Funcionamento</span>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                      {HORARIOS_STUDIO.map((item, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-center justify-between py-1 px-2.5 rounded-lg ${
                            item.dia === "Segunda" 
                              ? "bg-white/[0.06] text-white font-semibold border-l-2 border-[#DFBA73]" 
                              : "text-gray-300"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#DFBA73]" />
                            {item.dia}
                          </span>
                          <span className={item.hora === "Fechado" ? "text-red-400" : "text-gray-200"}>
                            {item.hora}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Formas de Pagamento */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <span className="text-xs font-mono text-[#DFBA73] uppercase tracking-widest font-bold block">
                      Formas de Pagamento
                    </span>

                    <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] text-gray-300">
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-1">
                        <CreditCard className="w-4 h-4 text-[#DFBA73]" />
                        <span>Crédito</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-1">
                        <CreditCard className="w-4 h-4 text-purple-400" />
                        <span>Débito</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-1">
                        <Banknote className="w-4 h-4 text-amber-400" />
                        <span>Dinheiro</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-1">
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span>PIX</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-1 col-span-2">
                        <ShieldCheck className="w-4 h-4 text-[#DFBA73]" />
                        <span>Saldo do Cliente VIP</span>
                      </div>
                    </div>
                  </div>

                  {/* Contato & Links Oficiais */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                    <a
                      href={WHATSAPP_CONCIERGE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={INSTAGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[#F5D799] font-mono text-xs font-bold transition-all"
                    >
                      <Instagram className="w-3.5 h-3.5 text-[#DFBA73]" />
                      <span>@studio.nbarber</span>
                    </a>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── BANNER INFORMATIVO FINAL & SUPORTE DIRETO ── */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-[#080A0E] border border-[#DFBA73]/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#DFBA73]/15 border border-[#DFBA73]/40 flex items-center justify-center shrink-0 text-[#DFBA73] shadow-lg shadow-[#DFBA73]/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h5 className="text-base font-serif text-white font-medium">
                Deseja incluir um produto no seu agendamento?
              </h5>
              <p className="text-xs sm:text-sm text-gray-300 font-light">
                Você pode solicitar seus cosméticos ou bebidas antecipadamente ou retirá-los diretamente com o Noah durante o seu corte.
              </p>
            </div>
          </div>

          <a
            href={WHATSAPP_CONCIERGE}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold tracking-wider uppercase transition-all shrink-0 shadow-lg shadow-emerald-500/10"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Falar no WhatsApp (27) 99269-3638</span>
          </a>
        </div>

      </div>
    </section>
  );
}
