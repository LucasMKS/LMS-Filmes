import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/AppLayout";
import { Providers } from "@/components/Providers";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | LMS Filmes",
    default: "LMS Filmes | Sua Coleção de Cinema",
  },
  description: "Descubra, avalie e organize seus filmes e séries favoritos. O LMS Filmes é o seu diário cinematográfico pessoal.",
  keywords: ["filmes", "séries", "avaliação", "watchlist", "cinema"],
  authors: [{ name: "Lucas" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LMS Filmes",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "LMS Filmes | Sua Coleção de Cinema",
    description: "Descubra, avalie e organize seus filmes e séries favoritos.",
    url: "https://filmes.lucasmks.com.br",
    siteName: "LMS Filmes",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LMS Filmes",
    description: "Sua coleção pessoal de filmes e séries.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased `}
        suppressHydrationWarning={true}
      >
        <Providers>
          <AppLayout>
            <div className="bg-[#0a0a0f]">
              {children}
            </div>
          </AppLayout>
          <PwaInstallPrompt />
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
