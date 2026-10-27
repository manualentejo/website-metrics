export const categoryExplanations: Record<string, { label: string; description: string }> = {
  performance: {
    label: "Performance",
    description:
      "Mede a velocidade de carregamento do site: quão rápido a página aparece e fica utilizável para quem visita. Notas baixas geralmente significam imagens pesadas, muito JavaScript ou um servidor lento.",
  },
  accessibility: {
    label: "Acessibilidade",
    description:
      "Mede o quanto o site é utilizável por pessoas com deficiência (visual, motora, etc.), por exemplo com leitores de tela. Notas baixas indicam problemas como pouco contraste de cor ou imagens sem texto alternativo.",
  },
  bestPractices: {
    label: "Boas Práticas",
    description:
      "Mede se o site segue práticas recomendadas de desenvolvimento web modernas: segurança (HTTPS), bibliotecas atualizadas, sem erros no console do navegador, entre outros.",
  },
  seo: {
    label: "SEO",
    description:
      "Mede o quanto o site está otimizado para aparecer bem nos resultados de busca do Google. Notas baixas indicam, por exemplo, falta de título, descrição ou textos que os buscadores não conseguem interpretar.",
  },
};

export const vitalExplanations: Record<string, { label: string; description: string; good: string }> = {
  fcp: {
    label: "FCP — First Contentful Paint",
    description: "Tempo até o primeiro texto ou imagem aparecer na tela, depois que alguém clica no link do site.",
    good: "Ideal: até 1.8s",
  },
  lcp: {
    label: "LCP — Largest Contentful Paint",
    description:
      "Tempo até o maior elemento visível da página (geralmente uma imagem ou bloco de texto grande) terminar de carregar. É a métrica mais importante para a sensação de 'o site carregou'.",
    good: "Ideal: até 2.5s",
  },
  tbt: {
    label: "TBT — Total Blocking Time",
    description:
      "Tempo total em que o navegador ficou 'travado' processando código e não respondeu a cliques ou toques da pessoa visitante.",
    good: "Ideal: até 0.2s",
  },
  cls: {
    label: "CLS — Cumulative Layout Shift",
    description:
      "Mede o quanto os elementos da página 'pulam' de lugar enquanto carrega (por exemplo, um botão que se move porque uma imagem carregou embaixo dele). Quanto menor, mais estável é o layout.",
    good: "Ideal: até 0.1",
  },
  speedIndex: {
    label: "Speed Index",
    description: "Mede a rapidez com que o conteúdo da página é exibido visualmente durante o carregamento, como um todo.",
    good: "Ideal: até 3.4s",
  },
};

// Explicações para as auditorias de SEO mais comuns do Lighthouse; quando a
// auditoria não está no dicionário, usamos o próprio título em inglês.
export const seoAuditExplanations: Record<string, string> = {
  "document-title": "A página não tem uma tag <title>, ou ela está vazia — o título que aparece na aba do navegador e no resultado do Google.",
  "meta-description": "Falta a meta description — o resumo que aparece embaixo do título nos resultados de busca do Google.",
  "link-text": "Existem links na página com textos pouco descritivos (como 'clique aqui'), o que dificulta o entendimento do Google sobre o destino do link.",
  "crawlable-anchors": "Alguns links não podem ser rastreados pelo Google porque não usam uma tag <a> com atributo href válido.",
  "is-crawlable": "A página está bloqueando indexadores de busca (como o Google) de rastreá-la.",
  "robots-txt": "O arquivo robots.txt do site tem erros que podem impedir o Google de rastrear partes do site corretamente.",
  "image-alt": "Existem imagens sem texto alternativo (alt), importante tanto para SEO quanto para acessibilidade.",
  hreflang: "As tags de idioma (hreflang) do site têm problemas, o que pode confundir o Google sobre qual versão de idioma mostrar.",
  canonical: "A tag canonical (que indica a versão 'oficial' da página) está ausente ou inválida.",
  "structured-data": "Os dados estruturados (Schema.org) da página têm erros de formatação.",
  "font-size": "O texto da página é pequeno demais para ser lido facilmente em celulares.",
  "tap-targets": "Botões ou links estão muito próximos uns dos outros ou pequenos demais para toque em telas pequenas.",
  viewport: "A página não tem uma tag <meta name=\"viewport\"> configurada corretamente para dispositivos móveis.",
  "http-status-code": "A página retornou um código de status HTTP de erro (como 404 ou 500) quando deveria retornar sucesso (200).",
  plugins: "A página usa plugins (como Flash) que não são indexáveis pelos buscadores modernos.",
};

export function explainSeoAudit(id: string, fallbackTitle: string): string {
  return seoAuditExplanations[id] ?? fallbackTitle;
}
