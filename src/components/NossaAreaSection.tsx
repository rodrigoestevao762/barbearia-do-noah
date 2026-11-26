"use client";

import { motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { MapPin, Clock, ChevronRight, Star, ExternalLink, Scissors, Calendar } from "lucide-react";
import { BARBERS } from "@/lib/barbers";

const GOOGLE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Noah+Barber+Studio+Av+Paulo+Pereira+Gomes+281+Morada+de+Laranjeiras+Serra+ES";
const GOOGLE_REVIEW_URL = "https://www.google.com/search?q=Barbearia+do+Noah&client=opera-gx&hs=wL4&sca_esv=5f8377d5827c25f8&sxsrf=AKL5yDgHlFqxLSoauMLXprWfX-I3ndAKGg:1795401111532&udm=local&lsack=l6UDa7HyH5ul1sQPmqrEqQw&sa=X&ved=2ahUKEwjxme2rhp2YAxWbkpUCHRoVMcUQjGp6BAgrEAA&biw=1919&bih=969&dpr=1#";

// --- VÍDEOS AUTÊNTICOS DO NOAH BARBER STUDIO ---
const GALLERY_VIDEOS = [
  {
    src: "/studio/video-1.mp4",
    poster: "/studio/hero-1.jpg",
    tag: "Conforto VIP",
    title: "Cadeiras Reclináveis & Barboterapia",
    desc: "Poltronas com encosto reclinável e toalha aquecida",
    col: "col-span-1 md:col-span-2 row-span-1",
  },
  {
    src: "/studio/video-2.mp4",
    poster: "/studio/hero-2.jpg",
    tag: "Estrutura Moderna",
    title: "Iluminação Hexagonal 6000K",
    desc: "Luz de alta fidelidade para corte milimétrico e visagismo",
    col: "col-span-1 row-span-1",
  },
  {
    src: "/studio/video-3.mp4",
    poster: "/studio/hero-2.jpg",
    tag: "Arte da Barbearia",
    title: "Degradê Preciso & Acabamento Navalhado",
    desc: "Cortes modernos, transição suave na zero e visagismo sob medida",
    col: "col-span-1 row-span-1",
  },
  {
    src: "/studio/video-4.mp4",
    poster: "/studio/hero-2.jpg",
    tag: "Cortesia da Casa",
    title: "Cantinho do Café & Geladeira de Bebidas",
    desc: "Café espresso sempre fresco e geladeira com bebidas geladas",
    col: "col-span-1 row-span-1",
  },
  {
    src: "/studio/video-5.mp4",
    poster: "/studio/hero-3.jpg",
    tag: "Alta Precisão",
    title: "Rituais de Corte & Estilo Masculino",
    desc: "Alinhamento de barba, texturização e finalização com produtos premium",
    col: "col-span-1 row-span-1",
  },
  {
    src: "/studio/video-6.mp4",
    poster: "/studio/hero-1.jpg",
    tag: "Cosméticos Nobres",
    title: "Bancada de Produtos Profissionais",
    desc: "Pomadas, óleos essenciais e loções de primeira linha",
    col: "col-span-1 row-span-1",
  },
  {
    src: "/studio/video-7.mp4",
    poster: "/studio/hero-2.jpg",
    tag: "Nossa Equipe",
    title: "Noah Ferreira & Adrian Santos",
    desc: "Atendimento privativo 1 a 1 focado no seu estilo e bem-estar",
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
    <div
      className="relative overflow-hidden rounded-2xl col-span-1 row-span-1 border border-[#DFBA73]/30 bg-gradient-to-br from-white/[0.04] via-[#DFBA73]/[0.06] to-transparent p-6 flex flex-col justify-between shadow-2xl group hover:border-[#DFBA73]/60 transition-all duration-300"
      style={{ minHeight: 260 }}
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
    </div>
  );
}

// Card de Vídeo estabilizado em GPU para evitar tremor e pulos durante o scroll no celular
function GalleryCard({
  item,
}: {
  item: (typeof GALLERY_VIDEOS)[0];
  index: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let playTimeout: ReturnType<typeof setTimeout> | null = null;

    // IntersectionObserver com rootMargin generoso: evita liga/desliga brusco ao rolar entre vídeos
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (playTimeout) {
            clearTimeout(playTimeout);
            playTimeout = null;
          }
          if (entry.isIntersecting) {
            playTimeout = setTimeout(() => {
              if (video.paused) {
                video.play().catch(() => {});
              }
            }, 60);
          } else {
            if (!video.paused) {
              video.pause();
            }
          }
        });
      },
      { rootMargin: "120px 0px", threshold: 0.05 }
    );

    observer.observe(video);
    return () => {
      if (playTimeout) clearTimeout(playTimeout);
      observer.disconnect();
    };
  }, []);

  const isWide = item.col.includes("col-span-2");

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl cursor-pointer ${item.col} ${
        isWide ? "h-[260px] md:h-[320px]" : "h-[260px]"
      } border border-white/10 md:hover:border-[#DFBA73]/50 transition-colors duration-300 shadow-2xl bg-[#080A0E]`}
      style={{
        contain: "layout paint",
        transform: "translate3d(0, 0, 0)",
        backfaceVisibility: "hidden",
      }}
    >
      <video
        ref={videoRef}
        src={item.src}
        poster={item.poster || "/studio/hero-1.jpg"}
        loop
        muted
        playsInline
        preload="metadata"
        disablePictureInPicture
        disableRemotePlayback
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          transform: "translate3d(0, 0, 0)",
          backfaceVisibility: "hidden",
        }}
      />

      {/* Gradiente sutil inferior para estética limpa */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050608]/80 via-transparent to-transparent pointer-events-none" />

      {/* Brilho dourado ao passar o mouse (apenas CSS, sem re-render no scroll) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#DFBA73]/15 via-transparent to-transparent pointer-events-none transition-opacity duration-300 opacity-0 md:group-hover:opacity-100" />

      {/* Linha dourada inferior */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#DFBA73] to-transparent origin-left transition-opacity duration-300 pointer-events-none opacity-0 md:group-hover:opacity-100" />

      {/* Selo minimalista e legenda autêntica das comodidades do studio */}
      <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10 flex flex-col justify-end">
        <span className="text-[10px] font-mono tracking-widest uppercase text-[#DFBA73] bg-black/85 w-fit px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1.5 shadow-md mb-1.5 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DFBA73]"></span>
          <span>{item.tag}</span>
        </span>
        <h4 className="text-white font-serif text-base sm:text-lg font-semibold leading-tight drop-shadow-md">
          {item.title}
        </h4>
        <p className="text-gray-300 text-xs font-light line-clamp-1 mt-0.5 drop-shadow">
          {item.desc}
        </p>
      </div>
    </div>
  );
}

export default function NossaAreaSection({
  onSelectBarber,
}: {
  onSelectBarber?: (barberId: string) => void;
}) {
  useEffect(() => {
    BARBERS.forEach((b) => {
      if (b.avatar) {
        const img = new window.Image();
        img.src = b.avatar;
      }
    });
  }, []);

  return (
    <section
      id="nossa-area"
      className="relative bg-[#02050A] py-28 md:py-40 px-5 md:px-12 lg:px-24 overflow-x-clip border-t border-white/5"
    >
      {/* Luzes atmosféricas douradas */}
      <div className="absolute -top-60 -left-40 w-[600px] h-[600px] bg-[#DFBA73]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#DFBA73]/7 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute left-5 md:left-12 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent" />

      {/* ── HEADER ── */}
      <div className="max-w-7xl mx-auto mb-16 md:mb-20">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">

          {/* Título */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1"
          >
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
          {BARBERS.map((barber) => {
            const isOwner = barber.role === "ADMIN";
            return (
              <article
                key={barber.id}
                className="group relative rounded-3xl overflow-hidden border border-white/10 bg-[#050608] md:hover:border-[#DFBA73]/50 transition-colors duration-300 shadow-2xl flex flex-col"
                style={{
                  contain: "layout paint",
                  transform: "translate3d(0, 0, 0)",
                  backfaceVisibility: "hidden",
                }}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#080A0E]">
                  <img
                    src={barber.avatar}
                    alt={`${barber.name} - Noah Barber Studio`}
                    width={720}
                    height={960}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover object-top md:transition-transform md:duration-700 md:group-hover:scale-105"
                    style={{
                      transform: "translate3d(0, 0, 0)",
                      backfaceVisibility: "hidden",
                    }}
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
                    <h4 className="text-2xl font-serif text-white md:group-hover:text-[#F5D799] transition-colors">
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
                      className="w-full py-3.5 px-4 rounded-xl bg-white/[0.04] hover:bg-[#DFBA73] text-gray-200 hover:text-black border border-white/10 hover:border-[#DFBA73] text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors duration-300 cursor-pointer font-mono shadow-md"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Agendar com {barber.name.split(" ")[0]}</span>
                    </button>
                  ) : (
                    <a
                      href="#servicos"
                      className="w-full py-3.5 px-4 rounded-xl bg-white/[0.04] hover:bg-[#DFBA73] text-gray-200 hover:text-black border border-white/10 hover:border-[#DFBA73] text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors duration-300 cursor-pointer font-mono shadow-md"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Agendar Horário</span>
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
