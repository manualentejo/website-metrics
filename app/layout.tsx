import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { Atkinson_Hyperlegible, DM_Sans, IBM_Plex_Sans, Inter, Lexend, Nunito_Sans, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { PREFS_COOKIE, parsePrefsCookie, themeVars } from "@/lib/theme";

// Todas as fontes do seletor de aparência. Só a escolhida é baixada pelo navegador (as outras não são pré-carregadas).
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const atkinson = Atkinson_Hyperlegible({ subsets: ["latin"], display: "swap", weight: ["400", "700"], variable: "--font-atkinson", preload: false });
const lexend = Lexend({ subsets: ["latin"], display: "swap", variable: "--font-lexend", preload: false });
const dm = DM_Sans({ subsets: ["latin"], display: "swap", variable: "--font-dm", preload: false });
const source = Source_Sans_3({ subsets: ["latin"], display: "swap", variable: "--font-source", preload: false });
const plex = IBM_Plex_Sans({ subsets: ["latin"], display: "swap", weight: ["400", "500", "600"], variable: "--font-plex", preload: false });
const nunito = Nunito_Sans({ subsets: ["latin"], display: "swap", variable: "--font-nunito", preload: false });

export const metadata: Metadata = {
  title: "MINO · Métricas de Sites",
  description: "Painel interno de acompanhamento semanal do Google Lighthouse",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // O tema vem de um cookie, então a página já é desenhada com a cor e a fonte escolhidas, sem piscar.
  const prefs = parsePrefsCookie((await cookies()).get(PREFS_COOKIE)?.value);
  const fonts = [inter, atkinson, lexend, dm, source, plex, nunito].map((f) => f.variable).join(" ");
  return (
    <html lang="pt-BR" className={fonts} style={themeVars(prefs) as CSSProperties}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
