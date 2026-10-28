import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { Page } from "@/components/ui/Page";
import { getViewer } from "@/lib/access";
import { getSettings } from "@/lib/settings";
import { loadReportLog } from "@/lib/insights";
import { endOfDayBrt, todayBrt } from "@/lib/reportPdf";

export const dynamic = "force-dynamic";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAY = 24 * 60 * 60 * 1000;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const today = todayBrt();
  const ym = /^\d{4}-\d{2}$/.test(m ?? "") ? m! : today.slice(0, 7);
  const [year, month] = ym.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const prev = new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 7);

  const [settings, { log }] = await Promise.all([getSettings(), loadReportLog(viewer, 3000)]);
  const times = log.map((r) => r.ranAt.getTime());
  const available = (date: string) => {
    const end = endOfDayBrt(date).getTime();
    return times.some((t) => t <= end && t > end - 7 * DAY);
  };

  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  return (
    <AppShell active="relatorios">
      <Page
        title="Relatórios"
        subtitle={`Todo(a) ${WEEKDAYS[settings.weekday]} às ${String(settings.hour).padStart(2, "0")}:00 (Brasília) o relatório da semana fica disponível em PDF, com todos os sites.`}
        actions={
          <div className="flex items-center gap-1">
            <Link href={`/relatorios?m=${prev}`} aria-label="Mês anterior" className={buttonClass("outline", "icon")}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="w-36 text-center text-[13px] font-medium">{MONTHS[month - 1]} de {year}</span>
            <Link href={`/relatorios?m=${next}`} aria-label="Próximo mês" className={buttonClass("outline", "icon")}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        }
        width="max-w-5xl"
      >
        <Card className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border bg-secondary/60 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {WEEKDAYS.map((w) => (
              <div key={w} className="px-3 py-2">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} className="min-h-24 border-b border-r border-border bg-secondary/30" />;
              const date = `${ym}-${String(day).padStart(2, "0")}`;
              const isReportDay = i % 7 === settings.weekday;
              const ready = isReportDay && date <= today && available(date);
              return (
                <div
                  key={i}
                  className={`flex min-h-24 flex-col gap-1.5 border-b border-r border-border p-2 ${date === today ? "bg-accent/50" : ""}`}
                >
                  <span className={`text-xs tabular-nums ${date === today ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{day}</span>
                  {isReportDay &&
                    (ready ? (
                      <a href={`/api/reports/pdf?date=${date}`} className={buttonClass("primary", "sm", "w-full")}>
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </a>
                    ) : date > today ? (
                      <span className="text-[11px] text-muted-foreground">Agendado</span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Sem dados</span>
                    ))}
                </div>
              );
            })}
          </div>
        </Card>
        <p className="text-xs text-muted-foreground">
          O PDF traz as notas de cada site (computador primeiro, depois celular), a mudança desde a análise anterior e o que fazer no Framer para cada ponto ruim ou que pode melhorar.
        </p>
      </Page>
    </AppShell>
  );
}
