"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import type { AppSettings } from "@/lib/settings";

const DAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function Row({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-[1fr_340px] md:gap-8">
      <div>
        <p className="text-[13px] font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center md:justify-end">{children}</div>
    </div>
  );
}

export default function SettingsForm({ initial }: { initial: AppSettings }) {
  const [s, setS] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(patch: Partial<AppSettings>) {
    setS((p) => ({ ...p, ...patch }));
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setMsg(res.ok ? "Alterações salvas." : "Não foi possível salvar.");
    setTimeout(() => setMsg(null), 2500);
  }

  return (
    <div className="space-y-6">
      <Card>
        <Row title="Relatório semanal" description="Liga ou desliga a análise semanal de todos os sites e a geração do relatório em PDF.">
          <label className="flex cursor-pointer items-center gap-3">
            <span className="text-sm text-muted-foreground">{s.enabled ? "Ligada" : "Desligada"}</span>
            <button
              type="button"
              role="switch"
              aria-checked={s.enabled}
              onClick={() => save({ enabled: !s.enabled })}
              className={`relative h-6 w-11 rounded-full transition-colors ${s.enabled ? "bg-primary" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all ${s.enabled ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </label>
        </Row>
        <Row title="Dia da semana" description="Dia em que o relatório da semana fica disponível em Relatórios.">
          <Select value={s.weekday} onChange={(e) => save({ weekday: Number(e.target.value) })} wrapperClassName="w-full">
            {DAYS.map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </Select>
        </Row>
        <Row title="Horário" description="Horário de Brasília. A execução ocorre na hora cheia escolhida.">
          <Select value={s.hour} onChange={(e) => save({ hour: Number(e.target.value) })} wrapperClassName="w-full">
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
            ))}
          </Select>
        </Row>
      </Card>
      {msg && <p role="status" className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
