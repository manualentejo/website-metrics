// Explicações em linguagem simples para os termos e siglas do Lighthouse.
// São exibidas nos tooltips ⓘ ao lado de cada termo.

export interface GlossaryEntry {
  title: string;
  text: string;
  good?: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  performance: {
    title: "Desempenho",
    text: "Mede a velocidade com que a página aparece e fica pronta para uso. A nota vem de 5 métricas de tempo. Imagens pesadas, muitos scripts ou servidor lento derrubam essa nota.",
    good: "Bom: 90 a 100",
  },
  accessibility: {
    title: "Acessibilidade",
    text: "Mede se pessoas com deficiência (visual, motora, auditiva) conseguem usar o site — por exemplo com leitor de tela ou só com o teclado. Contraste de cor fraco e imagens sem descrição são os problemas mais comuns.",
    good: "Bom: 90 a 100",
  },
  "best-practices": {
    title: "Boas práticas",
    text: "Verifica se o site segue padrões modernos e seguros da web: HTTPS, ausência de erros no navegador, imagens na proporção correta, bibliotecas sem falhas de segurança conhecidas.",
    good: "Bom: 90 a 100",
  },
  seo: {
    title: "SEO",
    text: "Search Engine Optimization. Verifica se o Google consegue encontrar, ler e entender a página para mostrá-la nos resultados de busca: título, descrição, links rastreáveis, página indexável.",
    good: "Bom: 90 a 100",
  },
  "first-contentful-paint": {
    title: "FCP — First Contentful Paint",
    text: "Primeira exibição de conteúdo: quanto tempo leva, depois do clique no link, até aparecer o primeiro texto ou imagem na tela. É quando a pessoa percebe que o site 'começou a carregar'.",
    good: "Bom: até 1,8 s (celular) · até 0,9 s (computador)",
  },
  "largest-contentful-paint": {
    title: "LCP — Largest Contentful Paint",
    text: "Maior exibição de conteúdo: tempo até o maior elemento visível (geralmente a imagem ou vídeo do topo, o 'hero') terminar de aparecer. É a métrica que mais pesa na sensação de 'o site carregou'.",
    good: "Bom: até 2,5 s (celular) · até 1,2 s (computador)",
  },
  "total-blocking-time": {
    title: "TBT — Total Blocking Time",
    text: "Tempo total de bloqueio: soma dos momentos em que o navegador ficou ocupado executando código e não respondia a cliques ou rolagem. Scripts de terceiros (analytics, chat, pixels) costumam ser os culpados.",
    good: "Bom: até 200 ms (celular) · até 150 ms (computador)",
  },
  "cumulative-layout-shift": {
    title: "CLS — Cumulative Layout Shift",
    text: "Mudança de layout acumulada: mede o quanto os elementos 'pulam' de lugar enquanto a página carrega — como um botão que desce porque uma imagem apareceu acima dele. É um número sem unidade; quanto menor, melhor.",
    good: "Bom: até 0,1",
  },
  "speed-index": {
    title: "Speed Index",
    text: "Índice de velocidade: mede a rapidez com que o conteúdo vai sendo preenchido visualmente na tela durante o carregamento, como um todo — não só o primeiro ou o maior elemento.",
    good: "Bom: até 3,4 s (celular) · até 1,3 s (computador)",
  },
  inp: {
    title: "INP — Interaction to Next Paint",
    text: "Interação até a próxima exibição: quanto tempo a página demora para reagir visualmente a um clique ou toque. Só é medido com visitas reais, por isso pode não aparecer na análise de laboratório.",
    good: "Bom: até 200 ms",
  },
  "core-web-vitals": {
    title: "Core Web Vitals",
    text: "As 3 métricas que o Google usa como sinal de experiência no ranqueamento de busca: LCP (carregamento), INP (resposta a cliques) e CLS (estabilidade visual).",
  },
  "lab-data": {
    title: "Dados de laboratório",
    text: "Esses números vêm de um teste simulado feito pelo Google (Lighthouse), num aparelho e conexão padronizados — não de visitas reais. Podem variar um pouco a cada análise.",
  },
  mobile: {
    title: "Celular (mobile)",
    text: "Simula um celular intermediário com internet 4G lenta. É a análise mais exigente e a que o Google usa como referência principal para a busca.",
  },
  desktop: {
    title: "Computador (desktop)",
    text: "Simula um computador com internet rápida. Normalmente tem notas melhores que a análise de celular.",
  },
  insights: {
    title: "Insights",
    text: "Problemas que afetam diretamente a nota de Desempenho, com a estimativa de quanto tempo ou peso dá para economizar corrigindo cada um. Comece pelos vermelhos.",
  },
  diagnostics: {
    title: "Diagnóstico",
    text: "Informações extras sobre o funcionamento da página. Não entram diretamente no cálculo da nota, mas ajudam a entender por que ela está baixa.",
  },
  passed: {
    title: "Auditorias aprovadas",
    text: "Verificações que o site já cumpre. Não precisam de ação.",
  },
  manual: {
    title: "Verificação manual",
    text: "Itens que uma ferramenta automática não consegue testar. Precisam ser conferidos por uma pessoa navegando no site.",
  },
  "not-applicable": {
    title: "Não aplicável",
    text: "Verificações que não se aplicam a esta página (por exemplo, regras sobre tabelas numa página sem tabelas).",
  },
  savings: {
    title: "Economia estimada",
    text: "Quanto de peso (KiB) ou de tempo (ms) a página economizaria se esse problema fosse corrigido. Quanto maior, mais vale a pena atacar.",
  },
  kib: {
    title: "KiB",
    text: "Kibibyte, unidade de tamanho de arquivo (≈ 1.000 bytes). 1.024 KiB = 1 MiB. Uma página leve tem menos de 2.000 KiB no total.",
  },
  ms: {
    title: "ms",
    text: "Milissegundo: 1/1000 de segundo. 1.000 ms = 1 s.",
  },
  "third-party": {
    title: "Terceiros",
    text: "Códigos que não são do seu site, carregados de outros serviços: Google Analytics, Tag Manager, pixels de anúncio, chats, banners de cookies. Cada um adiciona peso e tempo de carregamento.",
  },
  lighthouse: {
    title: "Lighthouse",
    text: "Ferramenta do Google que faz a análise automática do site e gera as notas. É a mesma usada pelo PageSpeed Insights e pelo Chrome.",
  },
};

// Explicação simples de auditorias comuns (Lighthouse 13). Quando não houver
// entrada aqui, a página mostra a descrição oficial do Lighthouse.
export const AUDIT_PLAIN: Record<string, string> = {
  "image-delivery-insight":
    "As imagens estão mais pesadas do que precisam: tamanho maior que o exibido, compressão baixa ou formato antigo. É a causa nº 1 de LCP alto.",
  "network-dependency-tree-insight":
    "Arquivos importantes estão sendo carregados em 'cadeia' — um só começa depois que o outro termina — atrasando a exibição da página.",
  "cache-insight":
    "Alguns arquivos ficam guardados no navegador por pouco tempo, então quem volta ao site precisa baixá-los de novo.",
  "font-display-insight":
    "O texto fica invisível enquanto a fonte personalizada carrega. O ideal é mostrar uma fonte padrão até a fonte do site chegar.",
  "cls-culprits-insight": "Lista os elementos que mais fazem o layout 'pular' durante o carregamento.",
  "lcp-breakdown-insight":
    "Mostra em quais etapas o maior elemento da página (LCP) está gastando tempo: resposta do servidor, download, renderização.",
  "lcp-discovery-insight":
    "A imagem principal (LCP) está sendo descoberta tarde pelo navegador, por exemplo por estar com carregamento 'lazy'.",
  "render-blocking-insight":
    "Arquivos CSS ou JavaScript impedem a página de aparecer até terminarem de baixar.",
  "third-parties-insight":
    "Mostra quanto peso e tempo os serviços de terceiros (analytics, pixels, chats) estão adicionando à página.",
  "document-latency-insight": "O servidor está demorando para entregar o HTML inicial da página.",
  "dom-size-insight":
    "A página tem elementos HTML demais, o que deixa o navegador mais lento para montar e atualizar a tela.",
  "duplicated-javascript-insight": "O mesmo código JavaScript está sendo baixado mais de uma vez.",
  "legacy-javascript-insight":
    "Há código JavaScript antigo, feito para navegadores velhos, que deixa os arquivos maiores sem necessidade.",
  "forced-reflow-insight":
    "Algum script força o navegador a recalcular o layout várias vezes, o que trava a página por instantes.",
  "viewport-insight": "A página não está configurada corretamente para telas de celular.",
  "inp-breakdown-insight": "Detalha o que atrasa a resposta da página a cliques e toques.",
  "unused-javascript":
    "Parte do JavaScript baixado nunca é usado nesta página. Geralmente vem de scripts de terceiros ou componentes pesados.",
  "unused-css-rules": "Parte do CSS baixado não é usado nesta página.",
  "unminified-css": "O CSS não está compactado.",
  "unminified-javascript": "O JavaScript não está compactado.",
  "total-byte-weight": "O peso total da página está alto. Páginas pesadas demoram mais, principalmente no 4G.",
  "bootup-time": "O navegador gasta muito tempo executando JavaScript ao abrir a página.",
  "mainthread-work-breakdown": "Mostra em que o navegador gasta tempo de processamento (scripts, estilos, layout).",
  "long-tasks": "Tarefas longas travam a página e a deixam sem resposta por alguns instantes.",
  "non-composited-animations":
    "Algumas animações fazem o navegador redesenhar a tela inteira a cada quadro, o que pesa principalmente no celular.",
  "unsized-images":
    "Imagens sem largura e altura definidas fazem o layout pular quando elas carregam (afeta o CLS).",
  "user-timings": "Marcações de tempo colocadas no código por ferramentas ou desenvolvedores. Apenas informativo.",
  "document-title":
    "A página não tem título (<title>) — o texto que aparece na aba do navegador e no resultado do Google.",
  "meta-description": "Falta a meta description, o resumo que aparece embaixo do título no Google.",
  "link-text": "Há links com textos genéricos como 'clique aqui' ou 'saiba mais', que não dizem para onde levam.",
  "crawlable-anchors": "Alguns links não podem ser seguidos pelo Google porque não têm um endereço (href) válido.",
  "is-crawlable": "A página está bloqueando o Google de indexá-la — ela não vai aparecer nas buscas.",
  "robots-txt": "O arquivo robots.txt tem erros que podem impedir o Google de ler partes do site.",
  "image-alt": "Há imagens sem texto alternativo (alt), usado por leitores de tela e pelo Google Imagens.",
  hreflang: "As marcações de idioma (hreflang) têm problemas e podem confundir o Google sobre qual versão mostrar.",
  canonical: "A tag canonical, que indica a versão 'oficial' da página, está ausente ou inválida.",
  "http-status-code": "A página respondeu com um código de erro (como 404 ou 500).",
  "color-contrast": "Há textos com pouco contraste em relação ao fundo, difíceis de ler para muita gente.",
  "heading-order": "Os títulos (H1, H2, H3…) não seguem uma ordem lógica, o que confunde leitores de tela.",
  "button-name": "Há botões sem nome acessível — um leitor de tela só diria 'botão'.",
  "link-name": "Há links sem texto ou descrição — um leitor de tela não consegue dizer para onde levam.",
  "html-has-lang": "A página não informa em que idioma está escrita.",
  "frame-title": "Há iframes ou embeds (vídeos, mapas, formulários) sem título; um leitor de tela não sabe o que eles contêm.",
  "landmark-one-main": "A página não tem uma região principal (<main>) marcada, o que dificulta a navegação por leitores de tela.",
  "target-size": "Botões ou links pequenos demais ou muito próximos para tocar com o dedo.",
  "errors-in-console": "O navegador registrou erros ao abrir a página — algo pode não estar funcionando.",
  "image-aspect-ratio": "Há imagens exibidas numa proporção diferente da original, aparecendo esticadas ou achatadas.",
  "image-size-responsive": "Há imagens com resolução baixa demais para a tela em que aparecem.",
  "third-party-cookies": "A página usa cookies de terceiros, que os navegadores estão bloqueando.",
  "valid-source-maps": "Faltam arquivos de mapeamento do código (source maps). Apenas informativo para desenvolvedores.",
};
