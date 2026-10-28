import { Card, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import ScoreGauge from "@/components/ScoreGauge";
import { inputClass } from "@/components/ui/fields";

const COLORS: { token: string; cls: string; use: string }[] = [
  { token: "background", cls: "bg-background", use: "Fundo da aplicação" },
  { token: "card", cls: "bg-card", use: "Painéis, cartões, campos" },
  { token: "primary", cls: "bg-primary", use: "Ação principal, texto forte" },
  { token: "secondary", cls: "bg-secondary", use: "Cabeçalhos de tabela, fundos suaves" },
  { token: "accent", cls: "bg-accent", use: "Item ativo e hover" },
  { token: "border", cls: "bg-border", use: "Divisórias e bordas" },
  { token: "muted-foreground", cls: "bg-muted-foreground", use: "Texto secundário" },
  { token: "success", cls: "bg-success", use: "Bom (90–100), no ar" },
  { token: "warning", cls: "bg-warning", use: "Atenção (50–89), em andamento" },
  { token: "destructive", cls: "bg-destructive", use: "Ruim (0–49), erro" },
  { token: "info", cls: "bg-info", use: "Informação neutra" },
];

const TYPE: { cls: string; label: string; use: string }[] = [
  { cls: "text-lg font-semibold", label: "Título de página · 18 px", use: "Um por tela" },
  { cls: "text-sm font-semibold", label: "Título de cartão · 14 px", use: "Cabeçalhos de seção" },
  { cls: "text-[13px]", label: "Corpo e controles · 13 px", use: "Texto padrão, botões, campos" },
  { cls: "text-xs text-muted-foreground", label: "Apoio · 12 px", use: "Descrições, legendas" },
  { cls: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground", label: "Rótulo · 11 px", use: "Cabeçalho de tabela" },
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="p-5">{children}</div>
    </Card>
  );
}

export default function DesignSystemDoc() {
  return (
    <div className="space-y-4">
      <Block title="Princípios">
        <ul className="list-disc space-y-1 pl-4 text-[13px] text-muted-foreground">
          <li>Preto e branco sobre fundo cinza claro; cor só para dizer se uma nota é boa, atenção ou ruim.</li>
          <li>Cantos levemente arredondados: 6 px nos controles, 8 px nos cartões. Círculo só em foto de perfil, bolinhas de status e anéis de nota.</li>
          <li>Fonte Inter. Quatro tamanhos de texto e uma altura de controle (32 ou 36 px), para tudo alinhar.</li>
        </ul>
      </Block>

      <Block title="Cores">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLORS.map((c) => (
            <div key={c.token} className="flex items-center gap-3">
              <span className={`h-9 w-9 flex-shrink-0 rounded-md border border-border ${c.cls}`} />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-foreground">{c.token}</span>
                <span className="block truncate text-xs text-muted-foreground">{c.use}</span>
              </span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Tipografia">
        <div className="divide-y divide-border">
          {TYPE.map((t) => (
            <div key={t.label} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <span className={t.cls}>{t.label}</span>
              <span className="text-xs text-muted-foreground">{t.use}</span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Raios e alturas">
        <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
          {[
            ["rounded-sm · 4 px", "rounded-sm"],
            ["rounded-md · 6 px", "rounded-md"],
            ["rounded-lg · 8 px", "rounded-lg"],
          ].map(([label, cls]) => (
            <div key={label} className="flex items-center gap-2.5">
              <span className={`h-9 w-9 border border-input bg-secondary ${cls}`} />
              {label}
            </div>
          ))}
          <div className="flex items-center gap-2">Controles: 32 px (pequeno) e 36 px (padrão)</div>
        </div>
      </Block>

      <Block title="Botões">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Principal</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="ghost">Discreto</Button>
          <Button variant="destructive">Excluir</Button>
          <Button size="sm">Pequeno</Button>
          <Button disabled>Desativado</Button>
        </div>
      </Block>

      <Block title="Campos e seletores">
        <div className="flex flex-wrap items-center gap-2">
          <input className={`${inputClass} w-56`} placeholder="https://seusite.com" readOnly />
          <Select wrapperClassName="w-48" defaultValue="">
            <option value="">Sem workspace</option>
            <option>Mino</option>
          </Select>
          <span className="inline-flex h-8 w-[136px] items-center gap-2 rounded-md border border-input bg-card pl-2.5 text-xs font-medium shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            No ar
          </span>
        </div>
      </Block>

      <Block title="Etiquetas e notas">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex gap-2">
            <Badge>Neutro</Badge>
            <Badge tone="success">Bom</Badge>
            <Badge tone="warning">Atenção</Badge>
            <Badge tone="destructive">Crítico</Badge>
            <Badge tone="info">Info</Badge>
          </div>
          <div className="flex items-center gap-4">
            <ScoreGauge score={96} label="" size={40} />
            <ScoreGauge score={72} label="" size={40} />
            <ScoreGauge score={38} label="" size={40} />
            <ScoreGauge score={91} label="Desempenho" size={84} />
          </div>
        </div>
      </Block>
    </div>
  );
}
