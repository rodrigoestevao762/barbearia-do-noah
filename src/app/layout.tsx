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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://barbearia-do-noah.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#08090C",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Noah Barber Studio | Atendimento Exclusivo • Estilo Único",
  description: "Atendimento exclusivo no Noah Barber Studio em Serra - ES. Cortes modernos e clássicos de alta precisão, visagismo, barba na navalha com toalha aquecida e ambiente reservado.",
  keywords: [
    "Noah Barber Studio",
    "Barbearia do Noah",
    "Barbearia Serra ES",
    "Barbearia Morada de Laranjeiras",
    "Corte Masculino de Alta Precisão",
    "Visagismo Masculino",
    "Barba e Cabelo",
    "Noah Ferreira",
    "Adrian Santos",
    "Agendamento Barbearia",
  ],
  authors: [{ name: "Noah Barber Studio" }],
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
    title: "Noah Barber Studio | Atendimento Exclusivo • Estilo Único",
    description: "Atendimento exclusivo no Noah Barber Studio em Serra - ES. Iluminação hexagonal de alta precisão, piso marmorizado e rituais sob medida.",
    url: SITE_URL,
    siteName: "Noah Barber Studio",
    images: [
      {
        url: `${SITE_URL}/opengraph-image.png`,
        width: 1200,
        height: 630,
        alt: "Noah Barber Studio",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noah Barber Studio",
    description: "Estúdio de barbearia e cortes de alta precisão no Noah Barber Studio (Serra - ES).",
    images: [`${SITE_URL}/twitter-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BarberShop",
  "name": "Noah Barber Studio",
  "image": `${SITE_URL}/brand/logo-square-512.png`,
  "@id": SITE_URL,
  "url": SITE_URL,
  "telephone": "+55-27-99269-3638",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Av. Paulo Pereira Gomes, 281 - Loja 9",
    "addressLocality": "Serra",
    "addressRegion": "ES",
    "postalCode": "29166-828",
    "addressCountry": "BR"
  },
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
        <meta name="theme-color" content="#08090C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Noah Barber Studio" />
        <link rel="icon" type="image/png" sizes="512x512" href="/brand/logo-square-512.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#08090C] text-[#F4F6F8] font-sans selection:bg-[#C5A880] selection:text-black">
        <Providers>
          {children}
          <PwaInstallPrompt />
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
