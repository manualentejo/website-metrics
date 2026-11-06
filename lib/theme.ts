// Temas do painel: cor principal + fonte, por pessoa. Serve ao servidor (aplica no primeiro desenho da página,
// sem piscar) e ao navegador (prévia na hora ao escolher). Sem dependências.

export interface ThemePreset {
  id: string;
  name: string;
  color: string;
}

export const THEMES: ThemePreset[] = [
  { id: "grafite", name: "Grafite", color: "#171717" },
  { id: "azul", name: "Azul caneta", color: "#1d3fbb" },
  { id: "verde", name: "Verde floresta", color: "#15803d" },
  { id: "roxo", name: "Roxo", color: "#6d28d9" },
  { id: "laranja", name: "Laranja", color: "#c2410c" },
  { id: "rosa", name: "Vinho", color: "#be123c" },
  { id: "turquesa", name: "Turquesa", color: "#0f766e" },
];

export interface FontOption {
  id: string;
  name: string;
  note: string;
}

// Mesmo número de fontes e de temas. Todas são gratuitas e pensadas para leitura em tela.
export const FONTS: FontOption[] = [
  { id: "inter", name: "Inter", note: "Padrão do painel, neutra e nítida" },
  { id: "atkinson", name: "Atkinson Hyperlegible", note: "Letras bem distintas, para baixa visão" },
  { id: "lexend", name: "Lexend", note: "Espaçamento amplo, facilita a leitura" },
  { id: "dm", name: "DM Sans", note: "Geométrica e moderna" },
  { id: "source", name: "Source Sans 3", note: "Compacta, ótima para tabelas" },
  { id: "plex", name: "IBM Plex Sans", note: "Técnica e muito legível" },
  { id: "nunito", name: "Nunito Sans", note: "Arredondada e amigável" },
];

export interface Prefs {
  /** id de THEMES, ou "custom" para usar `color`. */
  theme: string;
  color: string | null;
  font: string;
}

export const DEFAULT_PREFS: Prefs = { theme: "grafite", color: null, font: "inter" };

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Valida e completa o que veio do cookie, do banco ou do formulário. */
export function normalizePrefs(raw: unknown): Prefs {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Prefs>;
  const custom = r.theme === "custom" && typeof r.color === "string" && HEX.test(r.color);
  const theme = custom ? "custom" : THEMES.some((t) => t.id === r.theme) ? (r.theme as string) : DEFAULT_PREFS.theme;
  return {
    theme,
    color: custom ? (r.color as string).toLowerCase() : null,
    font: FONTS.some((f) => f.id === r.font) ? (r.font as string) : DEFAULT_PREFS.font,
  };
}

// ---------- cores ----------
type RGB = [number, number, number];
const hexToRgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgbToHex = (c: RGB) => `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

function luminance([r, g, b]: RGB) {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export const contrastWithWhite = (hex: string) => 1.05 / (luminance(hexToRgb(hex)) + 0.05);

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Escurece a cor até o texto branco ter contraste de pelo menos 4,5:1 (WCAG AA) sobre ela. */
export function ensureReadable(hex: string): string {
  let c = hexToRgb(hex);
  for (let i = 0; i < 40 && contrastWithWhite(rgbToHex(c)) < 4.5; i++) c = mix(c, [0, 0, 0], 0.06);
  return rgbToHex(c);
}

export function accentOf(prefs: Prefs): string {
  const base = prefs.theme === "custom" && prefs.color ? prefs.color : (THEMES.find((t) => t.id === prefs.theme)?.color ?? THEMES[0].color);
  return ensureReadable(base);
}

const hslTriple = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return `${Math.round(((h * 60 + 360) % 360))} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

/**
 * Variáveis CSS do tema. O "primário" do painel é --bg-strong-950 (botões principais, logo, balões do chat);
 * o hover é um tom perto dele, o realce de item ativo é a cor misturada com branco, e o foco usa a própria cor.
 */
export function themeVars(prefs: Prefs): Record<string, string> {
  const accent = accentOf(prefs);
  const rgb = hexToRgb(accent);
  const dark = luminance(rgb) < 0.05;
  const hover = rgbToHex(dark ? mix(rgb, [255, 255, 255], 0.14) : mix(rgb, [0, 0, 0], 0.14));
  const soft = rgbToHex(mix(rgb, [255, 255, 255], 0.82));
  const darker = rgbToHex(mix(rgb, [0, 0, 0], 0.25));
  const alpha = (p: number) => `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]} / ${p})`;
  return {
    "--bg-strong-950": accent,
    "--bg-surface-800": hover,
    "--stroke-strong-950": accent,
    "--accent-soft": soft,
    "--primary-base": accent,
    "--primary-dark": darker,
    "--primary-darker": darker,
    "--primary-alpha-24": alpha(0.24),
    "--primary-alpha-16": alpha(0.16),
    "--primary-alpha-10": alpha(0.1),
    "--primary": hslTriple(accent),
    "--ring": hslTriple(accent),
    "--font-sans": `var(--font-${prefs.font})`,
  };
}

/** Atributos do cookie que espelha as preferências (lido no servidor para desenhar a página já com o tema). */
export const PREFS_COOKIE = "prefs";
export const serializePrefs = (p: Prefs) => encodeURIComponent(JSON.stringify(p));
export function parsePrefsCookie(value: string | undefined): Prefs {
  if (!value) return DEFAULT_PREFS;
  try {
    return normalizePrefs(JSON.parse(decodeURIComponent(value)));
  } catch {
    return DEFAULT_PREFS;
  }
}
