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
  themeColor: "#050608",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Noah Barber Studio | Atendimento Exclusivo & Alta Precisão",
  description: "Noah Barber Studio em Morada de Laranjeiras, Serra - ES. Cortes de alta precisão, visagismo, barba na toalha aquecida e atendimento exclusivo por Noah Ferreira e Adrian Santos.",
  keywords: [
    "Noah Barber Studio",
    "Barbearia do Noah",
    "Noah Ferreira",
    "Adrian Santos",
    "Barbearia Serra ES",
    "Morada de Laranjeiras",
    "Corte Masculino de Alta Precisão",
    "Barboterapia",
    "Agendamento Online",
  ],
  authors: [{ name: "Noah Barber Studio" }],
  icons: {
    icon: [
      { url: "/brand/logo-square-512.png?v=noah-2026", sizes: "512x512", type: "image/png" },
      { url: "/icon-512.png?v=noah-2026", sizes: "512x512", type: "image/png" },
      { url: "/icon-192.png?v=noah-2026", sizes: "192x192", type: "image/png" },
      { url: "/icon.png?v=noah-2026", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png?v=noah-2026", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Noah Barber Studio | Atendimento Exclusivo & Alta Precisão",
    description: "Noah Barber Studio em Serra - ES. Cortes milimétricos, visagismo e barboterapia em ambiente reservado de alto padrão.",
    url: SITE_URL,
    siteName: "Noah Barber Studio",
    images: [
      {
        url: `${SITE_URL}/brand/noah-og-banner.png?v=noah-2026`,
        width: 1200,
        height: 630,
        alt: "Noah Barber Studio Oficial",
      },
      {
        url: `${SITE_URL}/opengraph-image.png?v=noah-2026`,
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
    description: "Estúdio de barbearia privativo e cortes de alta precisão no Noah Barber Studio.",
    images: [`${SITE_URL}/brand/noah-og-banner.png?v=noah-2026`],
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
        <link rel="icon" type="image/png" sizes="512x512" href="/brand/logo-square-512.png?v=noah-gold-2026" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=noah-gold-2026" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png?v=noah-gold-2026" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=noah-gold-2026" />
        <link rel="shortcut icon" href="/favicon.ico?v=noah-gold-2026" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png?v=noah-gold-2026" />
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
