"use client";
import { RiBarChartLine, RiFileTextLine, RiSpeedUpLine } from "@remixicon/react";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

import { buttonClass } from "@/components/ui/Button";

const FEATURES = [
  { icon: RiSpeedUpLine, title: "Notas do Lighthouse", text: "Desempenho, acessibilidade, boas práticas e SEO de cada site, no computador e no celular." },
  { icon: RiBarChartLine, title: "Visitas por página e aparelho", text: "Quantas pessoas visitam, quais páginas e de que aparelho, sem cookies." },
  { icon: RiFileTextLine, title: "Relatório semanal em PDF", text: "Todos os sites em um arquivo, com o que fazer no Framer para melhorar." },
];

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.084 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.651-.389-3.917z" />
    </svg>
  );
}

export default function LoginPage() {
  const { data: session, status } = useSession();

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-foreground text-xs font-bold text-primary">M</span>
          <span className="text-sm font-semibold tracking-tight">Métricas</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">Saiba como seus sites estão indo, sem precisar ser especialista.</h2>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary-foreground/10">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="block text-[13px] text-primary-foreground/60">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/50">Lighthouse via PageSpeed Insights</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">M</span>
            <span className="text-sm font-semibold tracking-tight">Métricas</span>
          </div>

          {session?.user ? (
            <>
              <h1 className="text-xl font-semibold tracking-tight">Você já está conectado</h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground">Entrou como {session.user.email}.</p>
              <div className="mt-6 flex flex-col gap-2">
                <Link href="/" className={buttonClass("primary", "md", "w-full")}>Ir para o painel</Link>
                <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className={buttonClass("outline", "md", "w-full")}>
                  Entrar com outra conta
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight">Entrar</h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground">Use sua conta Google para acessar o painel.</p>
              <button
                type="button"
                disabled={status === "loading"}
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className={buttonClass("outline", "md", "mt-6 w-full")}
              >
                <GoogleIcon />
                Continuar com Google
              </button>
              <p className="mt-6 text-xs text-muted-foreground">
                O acesso é só para quem foi convidado. Se você não consegue entrar, peça a quem compartilhou o painel para liberar seu e-mail.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
