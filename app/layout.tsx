import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { TEMA_FLASH_SCRIPT } from "@/lib/temalar";
import { WhatsAppButon } from "@/components/site/whatsapp-buton";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ACIKLAMA =
  "Düğün, nişan, kına ve kurumsal etkinlikleriniz için premium QR kod ile fotoğraf, video ve anı defteri toplama platformu. Anılar güvende, kontrol sizde.";

export const metadata: Metadata = {
  metadataBase: new URL("https://weddinai-site.vercel.app"),
  title: "WeddinAI — Etkinlik Anılarınız Tek Bir Bulutta",
  description: ACIKLAMA,
  applicationName: "WeddinAI",
  alternates: { canonical: "/" },
  openGraph: {
    title: "WeddinAI — Anılar güvende, kontrol sizde",
    description: ACIKLAMA,
    siteName: "WeddinAI",
    url: "/",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WeddinAI — Anılar güvende, kontrol sizde",
    description: ACIKLAMA,
  },
};

// Mobil-öncelikli: device-width + iPhone çentik/güvenli alan (env() için
// viewportFit cover şart) + marka rengi tarayıcı çubuğu.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#d2737a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Tema flash'ını önle: React boyamadan önce data-theme'i ayarla */}
        <script dangerouslySetInnerHTML={{ __html: TEMA_FLASH_SCRIPT }} />
        {/* Arama motorları için yapısal veri (Organization + WebSite) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "WeddinAI",
                  url: "https://weddinai-site.vercel.app",
                  logo: "https://weddinai-site.vercel.app/icon-512.png",
                },
                {
                  "@type": "WebSite",
                  name: "WeddinAI",
                  url: "https://weddinai-site.vercel.app",
                  inLanguage: "tr-TR",
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <WhatsAppButon />
      </body>
    </html>
  );
}
