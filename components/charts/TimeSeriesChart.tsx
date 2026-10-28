"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChartTooltip from "./ChartTooltip";
import ChartEmptyState, { ChartSkeleton } from "./ChartEmptyState";
import { fmtDay, fmtDelta, fmtNumber, type Unit } from "./format";

export interface ChartPoint {
  date: string;
  value: number | null;
}

const PAD = { l: 40, r: 12, t: 12, b: 26 };

function niceMax(v: number) {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p) * p;
}

/** Quebra a linha onde há dias sem valor, em vez de ligar pontos que não existem. */
function path(points: ChartPoint[], x: (i: number) => number, y: (v: number) => number) {
  let d = "";
  let open = false;
  points.forEach((p, i) => {
    if (p.value === null) {
      open = false;
      return;
    }
    d += `${open ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)} `;
    open = true;
  });
  return d.trim();
}

/** Área sob a linha, uma por trecho contínuo (não preenche onde não há dado). */
function area(points: ChartPoint[], x: (i: number) => number, y: (v: number) => number, base: number) {
  let d = "";
  let start = -1;
  const close = (end: number) => {
    if (start < 0) return;
    d += `L${x(end).toFixed(1)},${y(base).toFixed(1)} L${x(start).toFixed(1)},${y(base).toFixed(1)} Z `;
    start = -1;
  };
  points.forEach((p, i) => {
    if (p.value === null) return close(i - 1);
    d += `${start < 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)} `;
    if (start < 0) start = i;
  });
  close(points.length - 1);
  return d.trim();
}

export default function TimeSeriesChart({
  current,
  previous,
  unit,
  label,
  previousLabel = "Período anterior",
  height = 280,
  loading = false,
  error,
}: {
  current: ChartPoint[];
  previous?: ChartPoint[] | null;
  unit: Unit;
  label: string;
  previousLabel?: string;
  height?: number;
  loading?: boolean;
  error?: string | null;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hasData = current.some((p) => p.value !== null);
  const n = current.length;

  const scale = useMemo(() => {
    const vals = [...current, ...(previous ?? [])].map((p) => p.value).filter((v): v is number => v !== null);
    if (!vals.length) return null;
    let lo = 0;
    let hi: number;
    if (unit === "score") {
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      lo = Math.max(0, Math.floor((min - 5) / 10) * 10);
      hi = Math.min(100, Math.ceil((max + 5) / 10) * 10);
      if (hi - lo < 20) hi = Math.min(100, lo + 20);
      if (hi - lo < 20) lo = Math.max(0, hi - 20);
    } else {
      hi = niceMax(Math.max(...vals));
    }
    return { lo, hi };
  }, [current, previous, unit]);

  if (loading) return <ChartSkeleton className="rounded-xl" />;
  if (error) return <ChartEmptyState kind="error" title="Não foi possível carregar o gráfico" className="h-56">{error}</ChartEmptyState>;
  if (!hasData || !scale || n < 2) return <ChartEmptyState title="Sem dados no período">Quando houver dados nesta janela, o gráfico aparece aqui.</ChartEmptyState>;

  const iw = width - PAD.l - PAD.r;
  const ih = height - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (i / (n - 1)) * iw;
  const y = (v: number) => PAD.t + ih - ((v - scale.lo) / (scale.hi - scale.lo)) * ih;
  const ticks = Array.from({ length: 5 }, (_, i) => scale.lo + ((scale.hi - scale.lo) * i) / 4);
  const labelEvery = Math.max(1, Math.round(n / (width < 480 ? 4 : 7)));

  const move = (clientX: number) => {
    const r = wrap.current!.getBoundingClientRect();
    const i = Math.round(((clientX - r.left - PAD.l) / iw) * (n - 1));
    setActive(Math.min(n - 1, Math.max(0, i)));
  };

  const cur = active !== null ? current[active] : null;
  const prev = active !== null && previous ? previous[active] : null;
  const delta = cur?.value != null && prev?.value != null ? fmtDelta(cur.value, prev.value, unit) : null;
  const up = cur?.value != null && prev?.value != null ? cur.value - prev.value : 0;
  const tipLeft = active !== null ? Math.min(Math.max(x(active) - 90, 0), width - 190) : 0;

  return (
    <div
      ref={wrap}
      className="relative w-full select-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-strong-950"
      tabIndex={0}
      role="group"
      aria-label={`${label}. Use as setas para percorrer os dias.`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
        else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? n) - 1));
        else if (e.key === "Home") setActive(0);
        else if (e.key === "End") setActive(n - 1);
        else if (e.key === "Escape") setActive(null);
        else return;
        e.preventDefault();
      }}
      onBlur={() => setActive(null)}
      onPointerMove={(e) => move(e.clientX)}
      onPointerLeave={() => setActive(null)}
    >
      <svg width={width} height={height} className="block overflow-visible" aria-hidden>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={width - PAD.r} y1={y(t)} y2={y(t)} className="stroke-stroke-soft-200" strokeDasharray={t === scale.lo ? undefined : "2 4"} />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" className="fill-text-soft-400 text-[11px] tabular-nums">
              {fmtNumber(t, unit)}
            </text>
          </g>
        ))}
        {current.map((p, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={p.date} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} className="fill-text-soft-400 text-[11px]">
              {fmtDay(p.date)}
            </text>
          ) : null
        )}
        {previous && <path d={path(previous, x, y)} fill="none" className="stroke-stroke-sub-300" strokeWidth={1.5} strokeDasharray="4 4" />}
        <path
          d={area(current, x, y, scale.lo)}
          className="fill-text-strong-950"
          fillOpacity={0.05}
          stroke="none"
        />
        <path d={path(current, x, y)} fill="none" className="stroke-text-strong-950" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {active !== null && (
          <g>
            <line x1={x(active)} x2={x(active)} y1={PAD.t} y2={PAD.t + ih} className="stroke-stroke-sub-300" />
            {prev?.value != null && <circle cx={x(active)} cy={y(prev.value)} r={3.5} className="fill-bg-white-0 stroke-stroke-sub-300" strokeWidth={1.5} />}
            {cur?.value != null && <circle cx={x(active)} cy={y(cur.value)} r={4} className="fill-bg-white-0 stroke-text-strong-950" strokeWidth={2} />}
          </g>
        )}
      </svg>

      {active !== null && cur && (
        <ChartTooltip
          style={{ left: tipLeft, top: 0 }}
          title={fmtDay(cur.date).replace("/", " / ") + (prev ? ` · vs ${fmtDay(prev.date)}` : "")}
          rows={[
            {
              color: "bg-text-strong-950",
              label,
              value: cur.value === null ? "sem dado" : fmtNumber(cur.value, unit),
              sub: delta ? <span className={up > 0 ? "text-success-base" : up < 0 ? "text-error-base" : "text-text-sub-600"}>{delta}</span> : undefined,
            },
            ...(previous
              ? [{ color: "bg-stroke-sub-300", label: previousLabel, value: prev?.value == null ? "sem dado" : fmtNumber(prev.value, unit) }]
              : []),
          ]}
        />
      )}

      <div className="mt-2 flex items-center gap-4 pl-10 text-paragraph-xs text-text-sub-600">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-text-strong-950" />
          {label}
        </span>
        {previous && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-stroke-sub-300" />
            {previousLabel}
          </span>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {cur ? `${fmtDay(cur.date)}: ${cur.value === null ? "sem dado" : fmtNumber(cur.value, unit)}` : ""}
      </p>
    </div>
  );
}
