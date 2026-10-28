// Soluções específicas para sites feitos no Framer, usadas no relatório em PDF.

export interface Tip { title: string; steps: string[] }

export type Level = "good" | "moderate" | "poor";

export function scoreLevel(v: number | null): Level | null {
  if (v === null) return null;
  return v >= 90 ? "good" : v >= 50 ? "moderate" : "poor";
}

/** Limites do Core Web Vitals / Lighthouse (bom, ruim). */
const LIMITS = {
  lcp: [2500, 4000],
  fcp: [1800, 3000],
  tbt: [200, 600],
  cls: [0.1, 0.25],
  si: [3400, 5800],
} as const;

export type MetricKey = keyof typeof LIMITS;

export function metricLevel(key: MetricKey, v: number | null): Level | null {
  if (v === null) return null;
  const [good, poor] = LIMITS[key];
  return v <= good ? "good" : v <= poor ? "moderate" : "poor";
}

export const METRIC_LABEL: Record<MetricKey, string> = {
  lcp: "Maior elemento visível (LCP)",
  fcp: "Primeira exibição de conteúdo (FCP)",
  tbt: "Tempo de bloqueio (TBT)",
  cls: "Mudança de layout (CLS)",
  si: "Índice de velocidade",
};

export const METRIC_TIPS: Record<MetricKey, Tip> = {
  lcp: {
    title: "Carregamento do conteúdo principal (LCP)",
    steps: [
      "Use na primeira dobra imagens do tamanho exato em que aparecem. Imagens originais enormes pesam mesmo com a otimização automática do Framer.",
      "Prefira WebP ou AVIF e evite vídeo ou animação pesada no topo; use uma imagem de capa no lugar.",
      "Não aplique efeito de entrada (Appear) no elemento principal da primeira dobra: ele atrasa a exibição.",
      "Use no máximo duas famílias de fonte e poucos pesos.",
    ],
  },
  fcp: {
    title: "Primeira exibição de conteúdo (FCP)",
    steps: [
      "Reduza a quantidade de elementos e camadas na primeira dobra.",
      "Em Site Settings > General > Custom Code, mova scripts que não são essenciais para End of body.",
    ],
  },
  si: {
    title: "Índice de velocidade",
    steps: [
      "Simplifique a primeira dobra: menos imagens grandes, menos vídeos e menos efeitos de scroll.",
      "Carregue embeds (mapas, vídeos) só quando a pessoa rolar até eles.",
    ],
  },
  tbt: {
    title: "Tempo de bloqueio (TBT)",
    steps: [
      "Remova scripts de terceiros que não sejam essenciais (chats, pixels extras) em Site Settings > General > Custom Code.",
      "Evite muitos componentes com efeitos de rolagem e variantes animadas na mesma página.",
      "Evite iframes pesados (mapas, players); prefira links ou imagens que abrem o conteúdo sob demanda.",
    ],
  },
  cls: {
    title: "Mudança de layout (CLS)",
    steps: [
      "Defina largura e altura (ou proporção) fixas em imagens, vídeos e embeds para reservar o espaço.",
      "Evite elementos que aparecem depois e empurram o conteúdo; use altura mínima nos blocos.",
      "Evite trocar de fonte entre variantes e carregue só as fontes que usa.",
    ],
  },
};

export const CATEGORY_TIPS: Record<"seo" | "accessibility" | "bestPractices", Tip> = {
  seo: {
    title: "SEO",
    steps: [
      "Em Site Settings > General, preencha título e descrição do site; em cada página, abra Page Settings > SEO e escreva título e descrição únicos (até cerca de 155 caracteres) e uma imagem social.",
      "Use um único H1 por página (selecione o texto e escolha a tag em Text > Tag) e H2/H3 na ordem.",
      "Preencha o texto alternativo (alt) de todas as imagens relevantes.",
      "Use links com texto descritivo, não só “clique aqui”.",
    ],
  },
  accessibility: {
    title: "Acessibilidade",
    steps: [
      "Aumente o contraste entre texto e fundo (principalmente cinza claro sobre branco).",
      "Use elementos semânticos: tags H1–H6 nos títulos e links ou botões de verdade em vez de frames clicáveis.",
      "Preencha o alt das imagens e coloque rótulos nos campos de formulário.",
    ],
  },
  bestPractices: {
    title: "Boas práticas",
    steps: [
      "Confira em Site Settings > Domains se o domínio está conectado com HTTPS.",
      "Remova do Custom Code scripts quebrados que geram erros no console.",
      "Use imagens com proporção correta e evite embeds desatualizados de terceiros.",
    ],
  },
};
