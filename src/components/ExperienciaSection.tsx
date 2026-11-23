"use client";

import { motion } from "framer-motion";
import { Award, ShieldCheck, Sparkles, Scissors, Eye, Sparkle } from "lucide-react";
import { useEffect, useState } from "react";

// Fotos Oficiais dos Atendimentos no Noah Barber Studio
const EXPERIENCIA_IMAGES = [
  "/studio/hero-2.webp", // Corte de Alta Precisão no Espelho Iluminado
  "/studio/hero-1.jpg",  // Estúdio com Iluminação Hexagonal e Bancada
];

export default function ExperienciaSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Pré-carregamento e transição cinematográfica fluida
  useEffect(() => {
    EXPERIENCIA_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % EXPERIENCIA_IMAGES.length);
    }, 5500);

    return () => clearInterval(timer);
  }, []);

  return (
    <section 
      id="experiencia" 
      className="relative min-h-screen flex items-center justify-center bg-[#08090C] overflow-hidden py-24 md:py-36 px-4 md:px-8 border-t border-white/[0.04]"
    >
      {/* SLIDESHOW DE FUNDO COM FOTOS AUTÊNTICAS DO NOAH BARBER STUDIO */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        {EXPERIENCIA_IMAGES.map((src, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={src}
              aria-hidden={!isActive}
              className={`absolute inset-0 bg-cover transition-opacity duration-1000 ease-in-out will-change-[opacity] ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
              style={{
                backgroundImage: `url(${src})`,
                backgroundPosition: "center 30%",
                transform: "translate3d(0, 0, 0)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            />
          );
        })}

        {/* OVERLAYS SUAVES - Mantém as fotos de cortes nítidas, vivas e com atmosfera premium */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08090C]/90 via-[#08090C]/50 to-[#08090C] pointer-events-none z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(8,9,12,0.75)_100%)] pointer-events-none z-10" />
      </div>

      {/* CAIXA DE TEXTO CINEMÁTICA NOAH COM VIDRO SOPRADO E BRONZE GLOW */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 w-full max-w-5xl mx-auto p-7 sm:p-12 md:p-16 lg:p-20 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.9)] border border-[#C5A880]/30 bg-[#0E1117]/85 backdrop-blur-md"
      >
        {/* Iluminação de borda champagne bronze nobre */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#C5A880]/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

        <div className="relative z-20 flex flex-col items-center text-center">
          
          {/* Subtítulo Hexagonal Badge */}
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="w-6 md:w-12 h-[1px] bg-gradient-to-r from-transparent to-[#C5A880]" />
            <p className="text-[#C5A880] uppercase tracking-[0.45em] text-xs md:text-sm font-semibold flex items-center gap-2 font-mono">
              <span>⬡</span>
              <span>A Experiência Noah Barber Studio</span>
            </p>
            <span className="w-6 md:w-12 h-[1px] bg-gradient-to-l from-transparent to-[#C5A880]" />
          </div>

          {/* Título Principal */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.6rem] font-serif font-black leading-[1.08] tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-[#E2CCA6] to-[#C5A880] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] uppercase">
            A Arte da Precisão <br className="hidden md:block" /> e da Identidade.
          </h2>

          {/* Divisor */}
          <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-[#C5A880]/80 to-transparent mb-8" />

          {/* Filosofia do Estúdio */}
          <p className="max-w-3xl text-gray-200 font-light text-base sm:text-lg md:text-xl leading-relaxed mb-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            No Noah Barber Studio, o seu tempo é sagrado e a sua imagem é prioridade absoluta. Combinamos técnicas contemporâneas de visagismo facial, iluminação geométrica uniforme e atendimento com hora marcada para você viver uma pausa revigorante na sua rotina.
          </p>

          {/* 3 Pilares da Experiência Noah */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl justify-center mb-8">
            
            {/* Pilar 1 */}
            <div className="bg-black/50 backdrop-blur-sm border border-[#C5A880]/25 hover:border-[#C5A880] p-5 rounded-2xl flex flex-col items-center text-center transition-all duration-300 hover:bg-[#C5A880]/10 group shadow-lg">
              <div className="p-3 bg-[#141720] rounded-xl border border-[#C5A880]/30 shadow-inner group-hover:scale-110 transition-transform duration-300 mb-3 text-[#C5A880]">
                <Scissors className="w-5 h-5" />
              </div>
              <h4 className="text-white font-serif text-lg font-bold mb-1">Visagismo Cirúrgico</h4>
              <p className="text-xs text-gray-400 font-light leading-relaxed">Linhas milimétricas desenhadas de acordo com o formato do seu crânio e mandíbula.</p>
            </div>

            {/* Pilar 2 */}
            <div className="bg-black/50 backdrop-blur-sm border border-[#C5A880]/25 hover:border-[#C5A880] p-5 rounded-2xl flex flex-col items-center text-center transition-all duration-300 hover:bg-[#C5A880]/10 group shadow-lg">
              <div className="p-3 bg-[#141720] rounded-xl border border-[#C5A880]/30 shadow-inner group-hover:scale-110 transition-transform duration-300 mb-3 text-[#C5A880]">
                <Eye className="w-5 h-5" />
              </div>
              <h4 className="text-white font-serif text-lg font-bold mb-1">Iluminação Hexagonal</h4>
              <p className="text-xs text-gray-400 font-light leading-relaxed">Teto LED em padrão colmeia que projeta luz homogênea sem sombras nas têmporas.</p>
            </div>

            {/* Pilar 3 */}
            <div className="bg-black/50 backdrop-blur-sm border border-[#C5A880]/25 hover:border-[#C5A880] p-5 rounded-2xl flex flex-col items-center text-center transition-all duration-300 hover:bg-[#C5A880]/10 group shadow-lg">
              <div className="p-3 bg-[#141720] rounded-xl border border-[#C5A880]/30 shadow-inner group-hover:scale-110 transition-transform duration-300 mb-3 text-[#C5A880]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-white font-serif text-lg font-bold mb-1">Conforto & Pontualidade</h4>
              <p className="text-xs text-gray-400 font-light leading-relaxed">Poltrona em couro cognac, toalha aquecida, ozonioterapia e horário 100% cumprido.</p>
            </div>

          </div>

          {/* Indicador de Transição de Fotos */}
          <div className="flex items-center gap-2 pt-2">
            {EXPERIENCIA_IMAGES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentSlide(i)}
                aria-label={`Ver foto ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                  i === currentSlide 
                    ? "w-8 bg-[#C5A880]" 
                    : "w-2.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

        </div>
      </motion.div>
    </section>
  );
}
