import React from "react";
import Image from "next/image";

interface LogoNoahBarberProps {
  size?: number;
  className?: string;
  color?: string;
  variant?: "horizontal" | "emblem" | "monogram";
}

export const LogoNoahBarber: React.FC<LogoNoahBarberProps> = ({
  size = 48,
  className = "",
  variant = "horizontal",
}) => {
  // Se for emblem ou monogram: exibe o logo oficial com acabamento bronze e sombra
  if (variant === "monogram" || variant === "emblem") {
    return (
      <div 
        className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl overflow-hidden select-none ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src="/brand/noah-logo.jpg"
          alt="Noah Barber Studio"
          width={size}
          height={size}
          priority
          className="object-cover w-full h-full drop-shadow-[0_4px_20px_rgba(197,168,128,0.3)]"
        />
      </div>
    );
  }

  // Se for horizontal (navbar, header, footer):
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div 
        className="relative inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-md shadow-black/60 border border-[#C5A880]/40"
        style={{ width: size, height: size }}
      >
        <Image
          src="/brand/noah-logo.jpg"
          alt="Noah Barber Studio"
          width={size}
          height={size}
          priority
          className="object-cover w-full h-full"
        />
      </div>
      <div className="flex flex-col text-left justify-center">
        <span className="text-base sm:text-lg md:text-xl font-serif tracking-[0.2em] text-white uppercase font-bold leading-tight group-hover:text-[#E2CCA6] transition-colors">
          NOAH BARBER STUDIO
        </span>
        <span className="text-[9px] md:text-[10px] font-mono tracking-[0.34em] text-[#C5A880] uppercase font-bold leading-tight mt-0.5">
          ATENDIMENTO EXCLUSIVO
        </span>
      </div>
    </div>
  );
};

// Aliases para compatibilidade total
export const LogoLasBarber = LogoNoahBarber;
export default LogoNoahBarber;
