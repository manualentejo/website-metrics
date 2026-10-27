# MINO — Painel de Métricas de Sites

Painel interno para acompanhar semanalmente as métricas do Google Lighthouse (via PageSpeed Insights API v5) dos sites da MINO.

## Stack
- Next.js 14 (App Router) + Tailwind CSS + Inter
- Postgres (Neon) via Drizzle
- Cron job na Vercel: toda sexta-feira às 15h (horário de Brasília) → `0 18 * * 5` UTC

## Variáveis de ambiente
Veja `.env.example`. Necessárias na Vercel:
- `DATABASE_URL` — string de conexão do Neon Postgres
- `PAGESPEED_API_KEY` — chave da API do PageSpeed Insights (Google Cloud Console)
- `CRON_SECRET` — gerado automaticamente pela Vercel ao criar o projeto; usado para autenticar o cron

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
