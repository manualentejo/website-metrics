"use client";

import { useEffect, useRef, useState } from "react";
import { RiCheckLine, RiRestartLine } from "@remixicon/react";
import { Card, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { notification } from "@/hooks/use-notification";
import { DEFAULT_PREFS, FONTS, PREFS_COOKIE, THEMES, accentOf, normalizePrefs, serializePrefs, themeVars, type Prefs } from "@/lib/theme";

/** Troca as variáveis do tema na página inteira, na hora (a escolha também é salva na conta). */
function apply(p: Prefs) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(themeVars(p))) root.style.setProperty(k, v);
}

const swatchText = (hex: string) => hex;

/** Painel de personalização: tema de cores (prontos ou cor própria) e fonte. Mudanças valem na hora e ficam salvas. */
export default function AppearanceForm({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [hex, setHex] = useState(initial.color ?? "#1d3fbb");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function persist(next: Prefs, quiet = false) {
    document.cookie = `${PREFS_COOKIE}=${serializePrefs(next)}; path=/; max-age=31536000; samesite=lax`;
    const res = await fetch("/api/profile/prefs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) }).catch(() => null);
    if (!res?.ok) notification({ status: "error", variant: "filled", title: "Não consegui salvar na conta", description: "A escolha vale neste navegador." });
    else if (!quiet) notification({ status: "success", variant: "filled", title: "Aparência salva" });
  }

  function change(patch: Partial<Prefs>, { debounce = false } = {}) {
    const next = normalizePrefs({ ...prefs, ...patch });
    setPrefs(next);
    apply(next);
    if (timer.current) clearTimeout(timer.current);
    if (debounce) timer.current = setTimeout(() => persist(next), 600);
    else void persist(next);
  }

  async function reset() {
    if (timer.current) clearTimeout(timer.current);
    setPrefs(DEFAULT_PREFS);
    setHex("#1d3fbb");
    apply(DEFAULT_PREFS);
    document.cookie = `${PREFS_COOKIE}=${serializePrefs(DEFAULT_PREFS)}; path=/; max-age=31536000; samesite=lax`;
    await fetch("/api/profile/prefs", { method: "DELETE" }).catch(() => null);
    notification({ status: "success", variant: "filled", title: "Aparência restaurada" });
  }

  const isDefault = prefs.theme === DEFAULT_PREFS.theme && prefs.font === DEFAULT_PREFS.font;
  const customAdjusted = prefs.theme === "custom" && prefs.color && accentOf(prefs).toLowerCase() !== prefs.color.toLowerCase();
  const ring = (on: boolean) => `${on ? "ring-2 ring-stroke-strong-950" : "ring-1 ring-stroke-soft-200 hover:ring-stroke-sub-300"} ring-inset`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Prévia" description="É assim que botões, destaques e o menu aparecem com a sua escolha." />
        <div className="flex flex-wrap items-center gap-3 p-5">
          <span className="inline-flex h-9 items-center rounded-lg bg-bg-strong-950 px-4 text-label-sm text-text-white-0">Botão principal</span>
          <span className="inline-flex h-9 items-center rounded-lg bg-[color:var(--accent-soft)] px-4 text-label-sm text-text-strong-950">Item selecionado</span>
          <span className="inline-flex h-9 items-center rounded-lg bg-bg-white-0 px-4 text-label-sm text-text-strong-950 ring-2 ring-stroke-strong-950">Campo em foco</span>
          <Badge tone="success" dot>No ar</Badge>
        </div>
      </Card>

      <Card>
        <CardHeader title="Cor do painel" description="Muda botões principais, logo, destaques e o menu lateral." />
        <div className="space-y-4 p-5">
          <div role="radiogroup" aria-label="Tema de cores" className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {THEMES.map((t) => {
              const on = prefs.theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => change({ theme: t.id, color: null })}
                  className={`flex flex-col items-start gap-2 rounded-xl bg-bg-white-0 p-3 text-left transition ${ring(on)}`}
                >
                  <span className="flex w-full items-center justify-between">
                    <span className="size-6 rounded-full" style={{ background: swatchText(accentOf({ theme: t.id, color: null, font: "inter" })) }} />
                    {on && <RiCheckLine className="size-4 text-text-strong-950" aria-hidden />}
                  </span>
                  <span className="text-label-sm text-text-strong-950">{t.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-bg-weak-50 p-3">
            <label className="flex items-center gap-2 text-label-sm text-text-strong-950">
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : "#1d3fbb"}
                onChange={(e) => {
                  setHex(e.target.value);
                  change({ theme: "custom", color: e.target.value }, { debounce: true });
                }}
                aria-label="Escolher uma cor própria"
                className="h-9 w-12 cursor-pointer rounded-md border-0 bg-transparent p-0"
              />
              Cor personalizada
            </label>
            <input
              value={hex}
              onChange={(e) => {
                const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                setHex(v);
                if (/^#[0-9a-fA-F]{6}$/.test(v)) change({ theme: "custom", color: v }, { debounce: true });
              }}
              maxLength={7}
              spellCheck={false}
              aria-label="Código da cor (hexadecimal)"
              className="h-9 w-28 rounded-lg bg-bg-white-0 px-3 font-mono text-paragraph-sm text-text-strong-950 ring-1 ring-inset ring-stroke-soft-200 focus:outline-none focus:ring-2 focus:ring-stroke-strong-950"
            />
            {prefs.theme === "custom" && <Badge tone="info">Em uso</Badge>}
            {customAdjusted && <p className="basis-full text-paragraph-xs text-text-sub-600">Escurecemos um pouco essa cor para o texto branco dos botões continuar legível.</p>}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Fonte" description="Sete opções, todas gratuitas e boas para ler em tela. Algumas ajudam na acessibilidade." />
        <div role="radiogroup" aria-label="Fonte" className="grid gap-2 p-5 sm:grid-cols-2">
          {FONTS.map((f) => {
            const on = prefs.font === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => change({ font: f.id })}
                className={`flex items-start justify-between gap-3 rounded-xl bg-bg-white-0 p-3.5 text-left transition ${ring(on)}`}
              >
                <span className="min-w-0" style={{ fontFamily: `var(--font-${f.id}), system-ui, sans-serif` }}>
                  <span className="block text-lg leading-snug text-text-strong-950">{f.name}</span>
                  <span className="mt-0.5 block text-sm text-text-sub-600">Notas do Lighthouse e auditoria GEO · 0123456789</span>
                  <span className="mt-1 block font-sans text-xs text-text-soft-400" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>{f.note}</span>
                </span>
                {on && <RiCheckLine className="mt-1 size-5 flex-shrink-0 text-text-strong-950" aria-hidden />}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="text-paragraph-xs text-text-sub-600">Suas escolhas ficam salvas na sua conta e valem em qualquer aparelho. Só você vê o painel desse jeito.</p>
        <Button variant="outline" onClick={reset} disabled={isDefault}>
          <RiRestartLine className="size-4" />
          Restaurar padrão
        </Button>
      </div>
    </div>
  );
}
