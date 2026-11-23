"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { MapPin, Clock, ChevronRight, Star, ExternalLink, Scissors, Calendar } from "lucide-react";
import { BARBERS } from "@/lib/barbers";

const GOOGLE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Noah+Barber+Studio+Av+Paulo+Pereira+Gomes+281+Morada+de+Laranjeiras+Serra+ES";
const GOOGLE_REVIEW_URL = "https://www.google.com/search?q=Barbearia+do+Noah&client=opera-gx&hs=wL4&sca_esv=5f8377d5827c25f8&sxsrf=AKL5yDgHlFqxLSoauMLXprWfX-I3ndAKGg:1795401111532&udm=local&lsack=l6UDa7HyH5ul1sQPmqrEqQw&sa=X&ved=2ahUKEwjxme2rhp2YAxWbkpUCHRoVMcUQjGp6BAgrEAA&biw=1919&bih=969&dpr=1#";

// --- VÍDEOS AUTÊNTICOS DO NOAH BARBER STUDIO ---
const GALLERY_VIDEOS = [
  {
    src: "/studio/video-1.mp4",
    poster: "/studio/hero-1.jpg",
    label: "Atendimento em Ação",
    title: "Visagismo & Corte de Precisão",
    desc: "Noah Ferreira e Adrian Santos esculpindo estilos únicos sob as luminárias hexagonais.",
    col: "col-span-1 md:col-span-2 row-span-1",
  },
  {
    src: "/studio/video-2.mp4",
    poster: "/studio/hero-2.jpg",
    label: "O Estúdio",
    title: "Estrutura & Iluminação",
    desc: "Teto hexagonal de 6000K, bancadas modernas e piso marmorizado Nero Marquina.",
    col: "col-span-1 row-span-1",
  },
  {
    src: "/studio/video-3.mp4",
    poster: "/studio/hero-3.jpg",
    label: "Ritual Completo",
    title: "Barboterapia & Toalha Quente",
    desc: "Toalha aquecida, vapor de ozônio e massagem facial para relaxamento absoluto.",
    col: "col-span-1 row-span-1",
  },
  {
    src: "/studio/video-4.mp4",
    poster: "/studio/hero-1.jpg",
    label: "Alta Fidelidade",
    title: "Acabamento Cirúrgico",
    desc: "Alinhamento das linhas da nuca, costeletas e barba com navalha descartável.",
    col: "col-span-1 row-span-1",
  },
  {
    src: "/studio/video-5.mp4",
    poster: "/studio/hero-2.jpg",
    label: "Styling Masculino",
    title: "Finalização & Textura",
    desc: "Pomadas e óleos de alta performance para fixação com aspecto natural.",
    col: "col-span-1 row-span-1",
  },
  {
    src: "/studio/video-6.mp4",
    poster: "/studio/hero-3.jpg",
    label: "Conforto & Recepção",
    title: "Espaço 100% Climatizado",
    desc: "Poltronas confortáveis, cantinho do café e pontualidade no atendimento.",
    col: "col-span-1 row-span-1",
  },
  {
    src: "/studio/video-7.mp4",
    poster: "/studio/hero-1.jpg",
    label: "Experiência VIP",
    title: "O Padrão Noah Barber Studio",
    desc: "Respeito ao seu estilo e ao seu tempo em Morada de Laranjeiras, Serra - ES.",
    col: "col-span-1 row-span-1",
  },
];

const HORARIOS = [
  { dia: "Segunda – Sábado", hora: "09:00 – 20:00" },
  { dia: "Domingo", hora: "Fechado" },
];

// Card de Avaliação no Google (Google Reviews - Modelo Mr. Bastos)
function GoogleReviewCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl col-span-1 row-span-1 border border-[#DFBA73]/30 bg-gradient-to-br from-white/[0.04] via-[#DFBA73]/[0.06] to-transparent p-6 flex flex-col justify-between shadow-2xl group hover:border-[#DFBA73]/60 transition-all duration-500"
      style={{ minHeight: 250 }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#DFBA73]/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-[#DFBA73]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-[#DFBA73] text-[#DFBA73]" />
            ))}
          </div>
          <span className="text-[11px] font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
            5.0 ★ (26)
          </span>
        </div>

        <h3 className="text-white font-serif text-xl leading-tight">Avaliações no Google</h3>
        <p className="text-gray-300 text-xs mt-2 font-light leading-relaxed">
          &quot;Ótimo cabeleireiro, atencioso e excelente profissional. O Noah manda muito bem no corte e barba, ambiente de alto padrão.&quot;
        </p>
      </div>

      <a
        href={GOOGLE_REVIEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 w-full bg-gradient-to-r from-[#F5D799] via-[#DFBA73] to-[#B88B38] text-black py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#DFBA73]/20 hover:brightness-110 active:scale-[0.99] transition-all font-mono"
      >
        <Star className="w-3.5 h-3.5 fill-black" />
        <span>Ver 26 Avaliações no Google</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </motion.div>
  );
}

// Card de Vídeo com Reprodução Contínua Fluida e Efeito Hover
function GalleryCard({
  item,
  index,
}: {
  item: (typeof GALLERY_VIDEOS)[0];
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer ${item.col} border border-white/10 hover:border-[#DFBA73]/50 transition-all duration-500 shadow-2xl bg-black`}
      style={{
        minHeight: item.col.includes("col-span-2") ? 290 : 250,
      }}
    >
      <video
        ref={videoRef}
        src={item.src}
        poster={item.poster || "/studio/hero-1.jpg"}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Gradiente escuro para legibilidade do texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050608]/95 via-[#050608]/40 to-transparent pointer-events-none" />

      {/* Brilho dourado ao passar o mouse */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-gradient-to-br from-[#DFBA73]/15 via-transparent to-transparent pointer-events-none"
      />

      {/* Linha dourada inferior */}
      <motion.div
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#DFBA73] to-transparent origin-left pointer-events-none"
      />

      {/* Texto descritivo sobre o vídeo */}
      <div className="absolute bottom-0 left-0 w-full p-5 md:p-6 pointer-events-none">
        <motion.p
          animate={{ y: hovered ? 0 : 4, opacity: hovered ? 1 : 0.9 }}
          transition={{ duration: 0.3 }}
          className="text-[#DFBA73] text-[10px] uppercase tracking-[0.3em] mb-1 font-semibold font-mono flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#DFBA73] animate-pulse"></span>
          <span>{item.label}</span>
        </motion.p>
        <h3 className="text-white font-serif text-xl leading-tight group-hover:text-[#F5D799] transition-colors">
          {item.title}
        </h3>
        <motion.p
          animate={{ y: hovered ? 0 : 6, opacity: hovered ? 1 : 0.85 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="text-gray-300 text-xs sm:text-sm mt-1 font-light leading-relaxed line-clamp-2"
        >
          {item.desc}
        </motion.p>
      </div>
    </motion.div>
  );
}

export default function NossaAreaSection({
  onSelectBarber,
}: {
  onSelectBarber?: (barberId: string) => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const titleY = useTransform(scrollYProgress, [0, 0.35], [50, 0]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);

  return (
    <section
      ref={sectionRef}
      id="nossa-area"
      className="relative bg-[#02050A] py-28 md:py-40 px-5 md:px-12 lg:px-24 overflow-hidden border-t border-white/5"
    >
      {/* Luzes atmosféricas douradas */}
      <div className="absolute -top-60 -left-40 w-[600px] h-[600px] bg-[#DFBA73]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#DFBA73]/7 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute left-5 md:left-12 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent" />

      {/* ── HEADER ── */}
      <div className="max-w-7xl mx-auto mb-16 md:mb-20">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">

          {/* Título */}
          <motion.div style={{ y: titleY, opacity: titleOpacity }} className="flex-1">
            <p className="text-[#DFBA73] uppercase tracking-[0.45em] text-xs font-semibold flex items-center gap-3 mb-8 font-mono">
              <span className="w-8 h-[1px] bg-[#DFBA73]" />
              O Estúdio & Localização
            </p>

            <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif text-white tracking-tight leading-[1.05]">
              Ambiente <br />
              <span className="italic text-[#DFBA73]">Exclusivo</span> e Confortável
            </h2>
          </motion.div>

          {/* Horários & Endereço */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row lg:flex-col gap-6 lg:min-w-[320px]"
          >
            {/* Horários */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex-1">
              <div className="flex items-center gap-2.5 text-[#DFBA73] text-xs font-mono uppercase tracking-widest font-semibold mb-4">
                <Clock className="w-4 h-4" />
                <span>Horário de Funcionamento</span>
              </div>
              <div className="space-y-2">
                {HORARIOS.map((h) => (
                  <div key={h.dia} className="flex justify-between items-center text-sm py-1 border-b border-white/5 last:border-0">
                    <span className="text-gray-400 font-light">{h.dia}</span>
                    <span className="text-white font-mono font-semibold">{h.hora}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Endereço */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex-1">
              <div className="flex items-center gap-2.5 text-[#DFBA73] text-xs font-mono uppercase tracking-widest font-semibold mb-2">
                <MapPin className="w-4 h-4" />
                <span>Localização</span>
              </div>
              <p className="text-white text-sm font-medium leading-relaxed">
                Av. Paulo Pereira Gomes, 281 - Loja 9
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                Morada de Laranjeiras, Serra - ES · CEP 29166-828
              </p>
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#DFBA73] hover:text-white mt-3 transition-colors font-mono font-semibold"
              >
                <span>Abrir no Google Maps</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </motion.div>
        </div>
      </div>

      {/* ── GRID DE VÍDEOS & AVALIAÇÃO (MODELO MR BASTOS) ── */}
      <div className="max-w-7xl mx-auto mb-16 md:mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <GalleryCard item={GALLERY_VIDEOS[0]} index={0} />
          <GalleryCard item={GALLERY_VIDEOS[1]} index={1} />
          <GalleryCard item={GALLERY_VIDEOS[2]} index={2} />
          <GoogleReviewCard />
          <GalleryCard item={GALLERY_VIDEOS[3]} index={3} />
          <GalleryCard item={GALLERY_VIDEOS[4]} index={4} />
          <GalleryCard item={GALLERY_VIDEOS[5]} index={5} />
          <GalleryCard item={GALLERY_VIDEOS[6]} index={6} />
        </div>

        {/* Faixa editorial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-t border-b border-white/[0.06] py-7"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500 mb-1 font-mono">Especialidade</p>
              <p className="text-white font-serif text-2xl">Corte & Barba</p>
            </div>
            <div className="hidden sm:block w-[1px] h-8 bg-white/10" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500 mb-1 font-mono">Atendimento</p>
              <p className="text-white font-serif text-2xl">Seg – Sáb</p>
            </div>
            <div className="hidden sm:block w-[1px] h-8 bg-white/10" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500 mb-1 font-mono">Experiência</p>
              <p className="text-white font-serif text-2xl">Exclusiva</p>
            </div>
          </div>
          <div className="flex items-center gap-4 max-w-xs">
            <div className="w-10 h-[1px] bg-[#DFBA73]/50 shrink-0" />
            <p className="text-gray-300 text-sm font-light italic leading-snug">
              &quot;Não fazemos apenas cortes. Valorizamos a sua identidade.&quot;
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── NOSSA EQUIPE (MODELO MR BASTOS COM RETRATOS OFICIAIS) ── */}
      <div id="equipe" className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[#DFBA73] uppercase tracking-[0.45em] text-xs font-semibold flex items-center gap-3 mb-3 font-mono">
              <span className="w-8 h-[1px] bg-[#DFBA73]" />
              Equipe Profissional
            </p>
            <h3 className="text-3xl md:text-4xl font-serif text-white leading-tight">
              Conheça Nossa <span className="text-[#DFBA73]">Equipe</span>
            </h3>
          </div>
          <p className="text-gray-400 text-sm font-light max-w-md">
            Profissionais dedicados a entregar alta precisão na tesoura, degradê impecável, barboterapia e visagismo sob medida em Serra - ES.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {BARBERS.map((barber, idx) => {
            const isOwner = barber.role === "ADMIN";
            return (
              <motion.article
                key={barber.id}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.75, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group relative rounded-3xl overflow-hidden border border-white/10 bg-[#050608] hover:border-[#DFBA73]/50 transition-all duration-500 shadow-2xl flex flex-col"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#080A0E]">
                  <img
                    src={barber.avatar}
                    alt={`${barber.name} - Noah Barber Studio`}
                    width={720}
                    height={960}
                    loading="lazy"
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/20 to-transparent pointer-events-none" />
                  <div className="absolute top-4 left-4 z-10">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border font-mono ${
                        isOwner
                          ? "bg-gradient-to-r from-[#F5D799] to-[#DFBA73] text-black border-[#DFBA73]/50 shadow-lg shadow-[#DFBA73]/20"
                          : "bg-[#050608]/80 text-[#DFBA73] border-[#DFBA73]/40"
                      }`}
                    >
                      <Scissors className="w-3 h-3" />
                      {isOwner ? "Master Barber & Fundador" : "Barbeiro Profissional"}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between gap-4 -mt-6 relative z-10">
                  <div>
                    <h4 className="text-2xl font-serif text-white group-hover:text-[#F5D799] transition-colors">
                      {barber.name}
                    </h4>
                    <p className="text-xs font-semibold text-[#DFBA73] mt-1 font-mono">
                      {barber.specialty}
                    </p>
                    <p className="text-xs text-gray-300 font-light leading-relaxed mt-2.5">
                      {barber.bio}
                    </p>
                  </div>

                  {onSelectBarber ? (
                    <button
                      type="button"
                      onClick={() => onSelectBarber(barber.id)}
                      className="w-full py-3.5 px-4 rounded-xl bg-white/[0.04] hover:bg-[#DFBA73] text-gray-200 hover:text-black border border-white/10 hover:border-[#DFBA73] text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer font-mono shadow-md"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Agendar com {barber.name.split(" ")[0]}</span>
                    </button>
                  ) : (
                    <a
                      href="#servicos"
                      className="w-full py-3.5 px-4 rounded-xl bg-white/[0.04] hover:bg-[#DFBA73] text-gray-200 hover:text-black border border-white/10 hover:border-[#DFBA73] text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer font-mono shadow-md"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Agendar Horário</span>
                    </a>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
