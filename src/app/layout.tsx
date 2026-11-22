import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import CookieConsentBanner from "@/components/CookieConsentBanner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://barbeariadonoah.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#050608",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Barbearia do Noah | Estilo, Precisão & Atendimento Exclusivo",
  description: "Atendimento exclusivo na Barbearia do Noah. Cortes modernos e clássicos de alta precisão, barba alinhada na navalha e ambiente reservado.",
  keywords: [
    "Barbearia do Noah",
    "Noah Barber",
    "Barbearia",
    "Corte Masculino de Alta Precisão",
    "Corte Masculino Premium",
    "Barba e Cabelo",
    "Agendamento Barbearia",
  ],
  authors: [{ name: "Barbearia do Noah" }],
  icons: {
    icon: [
      { url: "/brand/logo-square-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Barbearia do Noah | Estilo, Precisão & Atendimento Exclusivo",
    description: "Atendimento exclusivo na Barbearia do Noah. Conforto, cortes de alta precisão e cuidado completo para você.",
    url: SITE_URL,
    siteName: "Barbearia do Noah",
    images: [
      {
        url: `${SITE_URL}/opengraph-image.png`,
        width: 1200,
        height: 630,
        alt: "Barbearia do Noah",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Barbearia do Noah",
    description: "Estúdio de barbearia e cortes de alta precisão na Barbearia do Noah.",
    images: [`${SITE_URL}/twitter-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BarberShop",
  "name": "Barbearia do Noah",
  "image": `${SITE_URL}/brand/logo-square-512.png`,
  "@id": SITE_URL,
  "url": SITE_URL,
  "telephone": "+55-00-00000-0000",
  "priceRange": "$$",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "09:00",
      "closes": "20:00"
    }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${playfair.variable} h-full antialiased dark`}
    >
      <head>
        <meta name="theme-color" content="#050608" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Barbearia do Noah" />
        <link rel="icon" type="image/png" sizes="512x512" href="/brand/logo-square-512.png?v=las-gold-2026" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=las-gold-2026" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png?v=las-gold-2026" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=las-gold-2026" />
        <link rel="shortcut icon" href="/favicon.ico?v=las-gold-2026" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png?v=las-gold-2026" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#050608] text-white font-sans selection:bg-[#DFBA73] selection:text-black">
        <Providers>
          {children}
          <PwaInstallPrompt />
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
