import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { TEMA_FLASH_SCRIPT } from "@/lib/temalar";

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

export const metadata: Metadata = {
  title: "WeddinAI — Etkinlik Anılarınız Tek Bir Bulutta",
  description:
    "Düğün, nişan, kına ve kurumsal etkinlikleriniz için premium QR kod ile fotoğraf, video ve anı defteri toplama platformu. Misafirleriniz uygulama indirmeden saniyeler içinde anılarını paylaşsın.",
};

// Mobil-öncelikli: device-width + iPhone çentik/güvenli alan (env() için
// viewportFit cover şart) + marka rengi tarayıcı çubuğu.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#b08d57",
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
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
