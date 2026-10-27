import { NextResponse } from "next/server";
import withAuth from "next-auth/middleware";

export default withAuth(
  () => NextResponse.next(),
  {
    pages: { signIn: "/login" },
    callbacks: {
      // Para as APIs, deixamos a requisição seguir e cada rota responde 401 em JSON
      // (redirecionar um fetch para a página de login quebraria o cliente).
      authorized: ({ token, req }) => Boolean(token) || req.nextUrl.pathname.startsWith("/api/"),
    },
  }
);

export const config = {
  matcher: [
    /*
     * Protege todas as rotas exceto:
     * - /login (página de login)
     * - /api/auth/* (NextAuth)
     * - /api/cron/* (protegido pelo próprio CRON_SECRET)
     * - arquivos estáticos do Next
     */
    "/((?!login|api/auth|api/cron|_next/static|_next/image|favicon.ico).*)",
  ],
};
