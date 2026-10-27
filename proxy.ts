import withAuth from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

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
