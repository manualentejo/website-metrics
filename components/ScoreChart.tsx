"use client";

import type { ReportRow } from "@/lib/types";

const METRICS: { key: keyof ReportRow; label: string; color: string }[] = [
  { key: "performanceScore", label: "Performance", color: "#4f46e5" },
  { key: "accessibilityScore", label: "Acessibilidade", color: "#059669" },
  { key: "bestPracticesScore", label: "Boas Práticas", color: "#d97706" },
  { key: "seoScore", label: "SEO", color: "#db2777" },
];

export default function ScoreChart({ reports }: { reports: ReportRow[] }) {
  if (reports.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-text-sub-600">
        Sem dados ainda. A primeira análise roda na próxima sexta-feira.
      </div>
    );
  }

  const width = 640;
  const height = 160;
  const padding = 8;
  const n = reports.length;

  const x = (i: number) => (n === 1 ? width / 2 : padding + (i * (width - 2 * padding)) / (n - 1));
  const y = (score: number) => height - padding - (score / 100) * (height - 2 * padding);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        {[0, 25, 50, 75, 100].map((tick) => (
          <line
            key={tick}
            x1={0}
            x2={width}
            y1={y(tick)}
            y2={y(tick)}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        ))}
        {METRICS.map((metric) => {
          const points = reports
            .map((r, i) => {
              const value = r[metric.key];
              if (typeof value !== "number") return null;
              return `${x(i)},${y(value)}`;
            })
            .filter(Boolean)
            .join(" ");
          if (!points) return null;
          return (
            <polyline
              key={metric.key}
              points={points}
              fill="none"
              stroke={metric.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-4">
        {METRICS.map((metric) => {
          const latest = reports[reports.length - 1]?.[metric.key];
          return (
            <div key={metric.key} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: metric.color }}
              />
              <span className="text-text-sub-600">{metric.label}</span>
              <span className="font-medium text-text-strong-950">
                {typeof latest === "number" ? Math.round(latest) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
