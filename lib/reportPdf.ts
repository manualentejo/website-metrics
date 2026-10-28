import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { and, desc, inArray, isNull, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { reports, snapshots } from "@/db/schema";
import { visibleSites } from "@/lib/insights";
import { auditStatus } from "@/lib/analysis";
import { AUDIT_PLAIN } from "@/lib/glossary";
import { CATEGORY_TIPS, METRIC_LABEL, METRIC_TIPS, metricLevel, scoreLevel, type MetricKey, type Tip } from "@/lib/framerTips";
import type { Viewer } from "@/lib/access";

const DAY = 24 * 60 * 60 * 1000;

/** Fim do dia (23:59:59 em Brasília) da data YYYY-MM-DD, em UTC. */
export function endOfDayBrt(date: string): Date {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + DAY + 3 * 60 * 60 * 1000 - 1000);
}

export function todayBrt(now = new Date()): string {
  return new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

type Rep = typeof reports.$inferSelect;

/** Relatórios válidos (sem erro) dos sites visíveis até o fim do dia informado. */
async function loadWeek(viewer: Viewer, date: string) {
  const visible = await visibleSites(viewer);
  if (!visible.length) return { visible, rows: [] as Rep[] };
  const rows = await db
    .select()
    .from(reports)
    .where(and(inArray(reports.siteId, visible.map((s) => s.id)), isNull(reports.error)))
    .orderBy(desc(reports.ranAt));
  const end = endOfDayBrt(date).getTime();
  return { visible, rows: rows.filter((r) => r.ranAt.getTime() <= end) };
}

/** A semana tem relatório se existir alguma análise nos 7 dias que terminam na data. */
export async function hasReportFor(viewer: Viewer, date: string): Promise<boolean> {
  const { rows } = await loadWeek(viewer, date);
  const start = endOfDayBrt(date).getTime() - 7 * DAY;
  return rows.some((r) => r.ranAt.getTime() > start);
}

// ---------- desenho do PDF ----------

const C = { ink: rgb(0.09, 0.09, 0.09), mute: rgb(0.42, 0.42, 0.42), line: rgb(0.88, 0.88, 0.88), good: rgb(0.1, 0.55, 0.32), mid: rgb(0.78, 0.5, 0.05), bad: rgb(0.8, 0.2, 0.2) };
const W = 595;
const H = 842;
const M = 48;

// Fontes padrão do PDF só cobrem o alfabeto latino (Windows-1252).
function clean(t: string): string {
  return t
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/›/g, ">")
    .replace(/[→↑↓]/g, "-")
    .replace(/[^ -~ -ÿ–—•…]/g, "");
}

class Doc {
  page!: PDFPage;
  y = 0;
  constructor(public pdf: PDFDocument, public reg: PDFFont, public bold: PDFFont) {
    this.newPage();
  }
  newPage() {
    this.page = this.pdf.addPage([W, H]);
    this.y = H - M;
  }
  ensure(h: number) {
    if (this.y - h < M) this.newPage();
  }
  text(t: string, o: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number } = {}) {
    const size = o.size ?? 10;
    this.ensure(size + 4);
    this.page.drawText(clean(t), { x: o.x ?? M, y: this.y - size, size, font: o.bold ? this.bold : this.reg, color: o.color ?? C.ink });
    this.y -= size + 4;
  }
  wrap(t: string, o: { size?: number; x?: number; color?: ReturnType<typeof rgb>; bold?: boolean; width?: number } = {}) {
    const size = o.size ?? 10;
    const x = o.x ?? M;
    const font = o.bold ? this.bold : this.reg;
    const max = (o.width ?? W - M) - x;
    let line = "";
    for (const word of clean(t).split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > max && line) {
        this.text(line, { size, x, color: o.color, bold: o.bold });
        line = word;
      } else line = next;
    }
    if (line) this.text(line, { size, x, color: o.color, bold: o.bold });
  }
  gap(h = 8) {
    this.y -= h;
  }
  rule() {
    this.ensure(10);
    this.page.drawLine({ start: { x: M, y: this.y - 2 }, end: { x: W - M, y: this.y - 2 }, thickness: 0.5, color: C.line });
    this.y -= 10;
  }
}

const levelColor = (l: ReturnType<typeof scoreLevel>) => (l === "good" ? C.good : l === "moderate" ? C.mid : l === "poor" ? C.bad : C.mute);
const fmt = (v: number | null) => (v === null ? "-" : String(Math.round(v)));
const sec = (ms: number | null) => (ms === null ? "-" : `${(ms / 1000).toFixed(1)} s`);

function delta(cur: number | null, prev: number | null | undefined) {
  if (cur === null || prev === null || prev === undefined) return "";
  const d = Math.round(cur - prev);
  return d === 0 ? " (=)" : d > 0 ? ` (+${d})` : ` (${d})`;
}

export async function buildReportPdf(viewer: Viewer, date: string): Promise<Uint8Array> {
  const { visible, rows } = await loadWeek(viewer, date);
  const end = endOfDayBrt(date).getTime();
  const weekStart = end - 7 * DAY;

  const pdf = await PDFDocument.create();
  const d = new Doc(pdf, await pdf.embedFont(StandardFonts.Helvetica), await pdf.embedFont(StandardFonts.HelveticaBold));

  const [yy, mm, dd] = date.split("-");
  d.text("Relatório semanal de sites", { size: 20, bold: true });
  d.text(`Semana encerrada em ${dd}/${mm}/${yy}. Foco no computador, depois celular.`, { size: 10, color: C.mute });
  d.gap(6);
  d.rule();

  const pick = (siteId: string, strategy: string, before = Infinity) =>
    rows.find((r) => r.siteId === siteId && r.strategy === strategy && r.ranAt.getTime() < before);

  // Resumo
  d.text("Resumo", { size: 13, bold: true });
  d.gap(2);
  const cols = [M, 190, 250, 310, 380, 450];
  ["Site", "Desemp.", "Acessib.", "Boas prát.", "SEO", "Celular"].forEach((h, i) => {
    d.page.drawText(h, { x: cols[i], y: d.y - 9, size: 8, font: d.bold, color: C.mute });
  });
  d.y -= 16;
  for (const s of visible) {
    const cur = pick(s.id, "desktop");
    if (!cur || cur.ranAt.getTime() <= weekStart) continue;
    const prev = pick(s.id, "desktop", cur.ranAt.getTime() - 3 * DAY);
    const mob = pick(s.id, "mobile");
    d.ensure(16);
    d.page.drawText(clean(s.name).slice(0, 26), { x: cols[0], y: d.y - 9, size: 10, font: d.bold, color: C.ink });
    const vals: [number | null, number | null | undefined][] = [
      [cur.performanceScore, prev?.performanceScore],
      [cur.accessibilityScore, prev?.accessibilityScore],
      [cur.bestPracticesScore, prev?.bestPracticesScore],
      [cur.seoScore, prev?.seoScore],
      [mob?.performanceScore ?? null, undefined],
    ];
    vals.forEach(([v, p], i) =>
      d.page.drawText(`${fmt(v)}${delta(v, p)}`, { x: cols[i + 1], y: d.y - 9, size: 10, font: d.reg, color: levelColor(scoreLevel(v)) })
    );
    d.y -= 16;
  }
  d.text("Valores entre parênteses mostram a mudança desde a análise anterior.", { size: 8, color: C.mute });

  // Detalhe por site
  const snaps = visible.length
    ? await db.select().from(snapshots).where(and(inArray(snapshots.siteId, visible.map((s) => s.id)), eq(snapshots.strategy, "desktop")))
    : [];

  for (const s of visible) {
    const cur = pick(s.id, "desktop");
    if (!cur || cur.ranAt.getTime() <= weekStart) continue;
    d.newPage();
    d.text(s.name, { size: 16, bold: true });
    d.text(s.url, { size: 9, color: C.mute });
    d.gap(4);
    d.rule();

    const cats: [string, number | null][] = [
      ["Desempenho", cur.performanceScore],
      ["Acessibilidade", cur.accessibilityScore],
      ["Boas práticas", cur.bestPracticesScore],
      ["SEO", cur.seoScore],
    ];
    d.text("Notas no computador", { size: 11, bold: true });
    cats.forEach(([label, v]) => d.text(`${label}: ${fmt(v)}`, { size: 10, color: levelColor(scoreLevel(v)) }));
    const mob = pick(s.id, "mobile");
    if (mob) d.text(`Celular: desempenho ${fmt(mob.performanceScore)}, SEO ${fmt(mob.seoScore)}`, { size: 10, color: C.mute });
    d.gap(6);

    const metrics: [MetricKey, number | null, string][] = [
      ["lcp", cur.lcpMs, sec(cur.lcpMs)],
      ["fcp", cur.fcpMs, sec(cur.fcpMs)],
      ["tbt", cur.tbtMs, cur.tbtMs === null ? "-" : `${Math.round(cur.tbtMs)} ms`],
      ["cls", cur.cls, cur.cls === null ? "-" : cur.cls.toFixed(3)],
      ["si", cur.speedIndexMs, sec(cur.speedIndexMs)],
    ];
    d.text("Métricas de velocidade", { size: 11, bold: true });
    metrics.forEach(([k, v, label]) => d.text(`${METRIC_LABEL[k]}: ${label}`, { size: 10, color: levelColor(metricLevel(k, v)) }));
    d.gap(6);

    // O que fazer no Framer
    const tips: { tip: Tip; why: string }[] = [];
    for (const [k, v] of metrics) {
      const lv = metricLevel(k, v);
      if (lv && lv !== "good") tips.push({ tip: METRIC_TIPS[k], why: lv === "poor" ? "Ruim" : "Pode melhorar" });
    }
    const catTips: [number | null, keyof typeof CATEGORY_TIPS][] = [
      [cur.seoScore, "seo"],
      [cur.accessibilityScore, "accessibility"],
      [cur.bestPracticesScore, "bestPractices"],
    ];
    for (const [v, k] of catTips) {
      const lv = scoreLevel(v);
      if (lv && lv !== "good") tips.push({ tip: CATEGORY_TIPS[k], why: `${lv === "poor" ? "Ruim" : "Pode melhorar"}, nota ${fmt(v)}` });
    }

    d.text("O que fazer no Framer", { size: 12, bold: true });
    if (!tips.length) d.wrap("Nenhum ponto crítico esta semana. Continue acompanhando.", { color: C.mute });
    for (const { tip, why } of tips) {
      d.gap(3);
      d.text(`${tip.title}  [${why}]`, { size: 10, bold: true });
      for (const step of tip.steps) d.wrap(`- ${step}`, { size: 9.5, x: M + 8 });
    }

    // Auditorias reprovadas na análise mais recente
    const snap = snaps.find((x) => x.siteId === s.id);
    if (snap?.analysis && snap.capturedAt.getTime() <= end && snap.capturedAt.getTime() > weekStart) {
      const failing = Object.entries(snap.analysis.audits)
        .filter(([, a]) => auditStatus(a) === "fail")
        .slice(0, 6);
      if (failing.length) {
        d.gap(8);
        d.text("Principais problemas encontrados", { size: 12, bold: true });
        for (const [id, a] of failing) {
          d.wrap(`- ${a.title}${a.displayValue ? ` (${a.displayValue})` : ""}`, { size: 9.5, x: M + 8, bold: true });
          if (AUDIT_PLAIN[id]) d.wrap(AUDIT_PLAIN[id], { size: 9, x: M + 16, color: C.mute });
        }
      }
    }
  }

  pdf.getPages().forEach((p, i, all) =>
    p.drawText(`Página ${i + 1} de ${all.length}`, { x: W - M - 60, y: 24, size: 8, font: d.reg, color: C.mute })
  );
  return pdf.save();
}
