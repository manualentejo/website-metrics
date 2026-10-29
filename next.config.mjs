/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // A página Análises foi removida; o histórico de cada site fica em /site/[id]/history.
    return [{ source: "/analises", destination: "/", permanent: false }];
  },
};

export default nextConfig;
