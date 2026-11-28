"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface CenterModalPortalProps {
  children: ReactNode;
  onBackdropClick?: () => void;
  zIndexClass?: string;
}

/**
 * Portal centralizado na viewport inteira (document.body) com margem de segurança
 * para notch/câmera superior e barra inferior na versão app PWA / mobile.
 */
export function CenterModalPortal({
  children,
  onBackdropClick,
  zIndexClass = "z-[200]",
}: CenterModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      onClick={onBackdropClick}
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center overflow-y-auto bg-black/80 backdrop-blur-sm px-3 sm:px-5 pt-[max(calc(env(safe-area-inset-top,0px)+1.5rem),3.75rem)] pb-[max(calc(env(safe-area-inset-bottom,0px)+1.5rem),2.5rem)] overscroll-contain`}
      style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
    >
      {children}
    </div>,
    document.body
  );
}
