/** @type {import('next').NextConfig} */
const nextConfig = {
  // Páginas já visitadas ficam em cache no navegador por 60 s: voltar e alternar entre sites é instantâneo.
  // Ações que alteram dados chamam router.refresh(), que ignora esse cache.
  experimental: { staleTimes: { dynamic: 60, static: 300 } },
  async redirects() {
    return [
      // A página Análises foi removida; o histórico de cada site fica em /site/[id]/history.
      { source: "/analises", destination: "/", permanent: false },
      // SEO agora é uma categoria dentro de Desempenho; Concorrentes ficou dentro de GEO.
      { source: "/site/:id/seo", destination: "/site/:id/performance?cat=seo", permanent: false },
      { source: "/site/:id/competitors", destination: "/site/:id/geo", permanent: false },
    ];
  },
};

export default nextConfig;
