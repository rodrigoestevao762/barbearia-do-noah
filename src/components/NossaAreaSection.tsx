"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { MapPin, Clock, ChevronRight, Star, ExternalLink, Scissors, Calendar } from "lucide-react";
import { BARBERS } from "@/lib/barbers";

const GOOGLE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Noah+Barber+Studio+Av+Paulo+Pereira+Gomes+281+Morada+de+Laranjeiras+Serra+ES";
const GOOGLE_REVIEW_URL = "https://www.google.com/search?q=Barbearia+do+Noah&client=opera-gx&hs=wL4&sca_esv=5f8377d5827c25f8&sxsrf=AKL5yDgHlFqxLSoauMLXprWfX-I3ndAKGg:1795401111532&udm=local&lsack=l6UDa7HyH5ul1sQPmqrEqQw&sa=X&ved=2ahUKEwjxme2rhp2YAxWbkpUCHRoVMcUQjGp6BAgrEAA&biw=1919&bih=969&dpr=1#";

const GALLERY_PHOTOS = [
  {
    src: "/studio/hero-1.jpg",
    label: "Iluminação Hexagonal LED",
    desc: "Matriz geométrica de 6000K que elimina sombras nas têmporas e nuca.",
    col: "col-span-1 md:col-span-2 row-span-1",
  },
  {
    src: "/studio/hero-2.webp",
    label: "Visagismo no Espelho em Arco",
    desc: "Halo de iluminação indireta que valoriza a silhueta e o contorno facial.",
    col: "col-span-1 row-span-1",
  },
  {
    src: "/studio/hero-3.webp",
    label: "Cantinho do Café & Espera",
    desc: "Espaço climatizado com poltronas confortáveis e café especial.",
    col: "col-span-1 row-span-1",
  },
  {
    src: "/studio/hero-1.jpg",
    label: "Piso Nero Marquina & Poltrona Cognac",
    desc: "Mármore preto polido reflexivo e couro caramelo ergonômico.",
    col: "col-span-1 row-span-1",
  },
  {
    src: "/studio/hero-2.webp",
    label: "Acabamento Cirúrgico",
    desc: "Lâminas descartáveis, toalha aquecida e assepsia completa.",
    col: "col-span-1 md:col-span-2 row-span-1",
  },
];

const HORARIOS = [
  { dia: "Segunda a Sábado", hora: "09:00 – 20:00" },
  { dia: "Domingo", hora: "Fechado" },
];

function GoogleReviewCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl col-span-1 row-span-1 border border-[#C5A880]/35 bg-gradient-to-br from-[#0E1117] via-[#141720] to-[#08090C] p-6 flex flex-col justify-between shadow-2xl group hover:border-[#C5A880]/60 transition-all duration-300"
      style={{ minHeight: 220 }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A880]/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-[#C5A880]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-[#C5A880] text-[#C5A880]" />
            ))}
          </div>
          <span className="text-[11px] font-mono font-bold text-[#E2CCA6] bg-[#C5A880]/15 px-2.5 py-0.5 rounded-full border border-[#C5A880]/30">
            5.0 ★ no Google
          </span>
        </div>

        <h3 className="text-white font-serif text-xl leading-tight">Avaliações Reais</h3>
        <p className="text-gray-300 text-xs mt-2 font-light leading-relaxed">
          &quot;Ótimo cabeleireiro, atencioso e excelente profissional. O Noah manda muito bem no corte e barba, ambiente de alto padrão.&quot;
        </p>
      </div>

      <a
        href={GOOGLE_REVIEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 w-full bg-gradient-to-r from-[#E2CCA6] via-[#C5A880] to-[#8F6B38] text-black py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 bronze-glow hover:brightness-110 active:scale-[0.99] transition-all font-mono"
      >
        <Star className="w-3.5 h-3.5 fill-black" />
        <span>Ver 26 Avaliações no Google</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </motion.div>
  );
}

function GalleryCard({
  item,
  index,
}: {
  item: (typeof GALLERY_PHOTOS)[0];
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay: index * 0.08 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden rounded-2xl cursor-pointer ${item.col} border border-white/[0.06] hover:border-[#C5A880]/50 transition-all shadow-xl`}
      style={{
        minHeight: item.col.includes("row-span-2") ? 480 : item.col.includes("col-span-2") ? 260 : 220,
      }}
    >
      <motion.div
        animate={{ scale: hovered ? 1.05 : 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${item.src})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090C]/90 via-[#08090C]/35 to-transparent" />
      
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-gradient-to-br from-[#C5A880]/15 via-transparent to-transparent pointer-events-none"
      />
      
      <div className="absolute bottom-0 left-0 w-full p-5 md:p-6">
        <p className="text-[#C5A880] text-[10px] uppercase tracking-[0.25em] mb-1 font-semibold font-mono flex items-center gap-1.5">
          <span>⬡</span>
          <span>{item.label}</span>
        </p>
        <h3 className="text-white font-serif text-xl leading-tight">{item.label}</h3>
        <p className="text-gray-300 text-xs sm:text-sm mt-1 font-light leading-relaxed">
          {item.desc}
        </p>
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

  const titleY = useTransform(scrollYProgress, [0, 0.35], [40, 0]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);

  return (
    <section
      ref={sectionRef}
      id="nossa-area"
      className="relative bg-[#08090C] py-24 md:py-36 px-5 md:px-12 lg:px-24 overflow-hidden border-t border-white/[0.04]"
    >
      {/* Luzes atmosféricas champagne bronze */}
      <div className="absolute -top-60 -left-40 w-[600px] h-[600px] bg-[#C5A880]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#C5A880]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER DA SEÇÃO */}
      <div className="max-w-7xl mx-auto mb-16 md:mb-20">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10">

          {/* Título & Proposta */}
          <motion.div style={{ y: titleY, opacity: titleOpacity }} className="flex-1">
            <p className="text-[#C5A880] uppercase tracking-[0.45em] text-xs font-semibold flex items-center gap-3 mb-4 font-mono">
              <span className="w-8 h-[1px] bg-[#C5A880]" />
              <span>⬡ O Estúdio & Localização</span>
            </p>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif text-white tracking-tight leading-[1.08]">
              Arquitetura <br />
              <span className="italic text-[#C5A880]">Cyber-Luxury</span> e Conforto
            </h2>
            <p className="text-gray-300 font-light text-base md:text-lg max-w-xl mt-4 leading-relaxed">
              Cada detalhe do Noah Barber Studio foi construído para criar uma atmosfera moderna, privativa e acolhedora em Morada de Laranjeiras.
            </p>
          </motion.div>

          {/* Horários & Endereço */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col sm:flex-row lg:flex-col gap-5 lg:min-w-[340px]"
          >
            {/* Horários */}
            <div className="p-6 rounded-2xl bg-[#0E1117] border border-white/[0.06] backdrop-blur-md flex-1">
              <div className="flex items-center gap-2.5 text-[#C5A880] text-xs font-mono uppercase tracking-widest font-semibold mb-3">
                <Clock className="w-4 h-4" />
                <span>Horário de Funcionamento</span>
              </div>
              <div className="space-y-2">
                {HORARIOS.map((h) => (
                  <div key={h.dia} className="flex justify-between items-center text-sm py-1 border-b border-white/[0.04] last:border-0">
                    <span className="text-gray-400 font-light">{h.dia}</span>
                    <span className="text-white font-mono font-semibold">{h.hora}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Endereço */}
            <div className="p-6 rounded-2xl bg-[#0E1117] border border-white/[0.06] backdrop-blur-md flex-1">
              <div className="flex items-center gap-2.5 text-[#C5A880] text-xs font-mono uppercase tracking-widest font-semibold mb-2">
                <MapPin className="w-4 h-4" />
                <span>Localização Oficial</span>
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
                className="inline-flex items-center gap-1.5 text-xs text-[#C5A880] hover:text-white mt-3 transition-colors font-mono font-semibold"
              >
                <span>Traçar rota no Google Maps</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </motion.div>
        </div>
      </div>

      {/* GRID DE FOTOS & GOOGLE REVIEWS */}
      <div className="max-w-7xl mx-auto mb-20 md:mb-28">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <GalleryCard item={GALLERY_PHOTOS[0]} index={0} />
          <GalleryCard item={GALLERY_PHOTOS[1]} index={1} />
          <GoogleReviewCard />
          <GalleryCard item={GALLERY_PHOTOS[2]} index={2} />
          <GalleryCard item={GALLERY_PHOTOS[3]} index={3} />
          <GalleryCard item={GALLERY_PHOTOS[4]} index={4} />
        </div>
      </div>

      {/* EQUIPE DE BARBEIROS OFICIAL DO NOAH BARBER STUDIO */}
      <div id="equipe" className="max-w-7xl mx-auto pt-6 border-t border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[#C5A880] uppercase tracking-[0.45em] text-xs font-semibold flex items-center gap-3 mb-3 font-mono">
              <span className="w-8 h-[1px] bg-[#C5A880]" />
              <span>⬡ Equipe Profissional</span>
            </p>
            <h3 className="text-3xl md:text-5xl font-serif text-white leading-tight">
              Os Barbeiros do <span className="text-[#C5A880]">Estúdio</span>
            </h3>
          </div>
          <p className="text-gray-400 text-sm font-light max-w-md leading-relaxed">
            Profissionais dedicados a entregar alta precisão na tesoura, degradê navalhado, barboterapia e visagismo sob medida em Serra - ES.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {BARBERS.map((barber, idx) => {
            const isOwner = barber.role === "ADMIN";
            return (
              <motion.article
                key={barber.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, delay: idx * 0.15 }}
                className="group relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0E1117] hover:border-[#C5A880]/50 transition-all duration-300 shadow-2xl flex flex-col"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#141720]">
                  <img
                    src={barber.avatar}
                    alt={`${barber.name} - Noah Barber Studio`}
                    width={720}
                    height={960}
                    loading="lazy"
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1117] via-[#0E1117]/25 to-transparent pointer-events-none" />
                  
                  <div className="absolute top-4 left-4 z-10">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border font-mono ${
                        isOwner
                          ? "bg-gradient-to-r from-[#E2CCA6] to-[#C5A880] text-black border-[#C5A880]/50 shadow-lg shadow-[#C5A880]/20"
                          : "bg-[#08090C]/80 text-[#E2CCA6] border-[#C5A880]/40"
                      }`}
                    >
                      <Scissors className="w-3 h-3" />
                      {isOwner ? "Master Barber & Fundador" : "Barbeiro Profissional"}
                    </span>
                  </div>
                </div>

                <div className="p-7 flex-1 flex flex-col justify-between gap-5 -mt-6 relative z-10">
                  <div>
                    <h4 className="text-2xl font-serif text-white group-hover:text-[#E2CCA6] transition-colors">
                      {barber.name}
                    </h4>
                    <p className="text-xs font-semibold text-[#C5A880] mt-1 font-mono">
                      {barber.specialty}
                    </p>
                    <p className="text-xs text-gray-300 font-light leading-relaxed mt-3">
                      {barber.bio}
                    </p>
                  </div>

                  {onSelectBarber ? (
                    <button
                      type="button"
                      onClick={() => onSelectBarber(barber.id)}
                      className="w-full py-3.5 px-4 rounded-xl bg-white/[0.04] hover:bg-[#C5A880] text-gray-200 hover:text-black border border-white/10 hover:border-[#C5A880] text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer font-mono shadow-md"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Agendar com {barber.name.split(" ")[0]}</span>
                    </button>
                  ) : (
                    <a
                      href="#servicos"
                      className="w-full py-3.5 px-4 rounded-xl bg-white/[0.04] hover:bg-[#C5A880] text-gray-200 hover:text-black border border-white/10 hover:border-[#C5A880] text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer font-mono shadow-md"
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
