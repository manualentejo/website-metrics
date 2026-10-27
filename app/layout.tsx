import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MINO · Métricas de Sites",
  description: "Painel interno de acompanhamento semanal do Google Lighthouse",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans bg-surface text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
