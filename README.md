# MINO — Painel de Métricas de Sites

Painel interno para acompanhar semanalmente as métricas do Google Lighthouse (via PageSpeed Insights API v5) dos sites da MINO.

## Stack
- Next.js (App Router) + Tailwind CSS + Inter
- Postgres (Supabase, integrado à Vercel) via Drizzle
- Cron job na Vercel: toda sexta-feira às 15h (horário de Brasília) → `0 18 * * 5` UTC

## Variáveis de ambiente
Veja `.env.example`. Necessárias na Vercel:
- `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` — criadas automaticamente pela integração Supabase
- `PAGESPEED_API_KEY` — chave da API do PageSpeed Insights (Google Cloud Console)
- `CRON_SECRET` — crie manualmente (ex: `openssl rand -hex 32`) e adicione nas env vars; usada para autenticar o cron

## Setup local
```bash
npm install
npm run db:migrate   # cria as tabelas e popula os sites iniciais
npm run dev
```

## Rodar a análise manualmente
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<seu-dominio>/api/cron/lighthouse
```
