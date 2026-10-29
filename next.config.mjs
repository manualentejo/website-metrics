/** @type {import('next').NextConfig} */
const nextConfig = {
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
