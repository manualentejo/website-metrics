# Design system (rascunho para decidir no Claude)

Não aparece no aplicativo. Os valores vivem em `app/globals.css` (cores, raio), `tailwind.config.ts` (raios) e `components/ui/*`.

## Princípios
- Preto e branco sobre fundo cinza claro; cor só para dizer se uma nota é boa, atenção ou ruim.
- Cantos levemente arredondados: 6 px nos controles, 8 px nos cartões. Círculo só em foto de perfil, bolinhas de status e anéis de nota.
- Fonte Inter. Uma altura de controle (32 px pequeno, 36 px padrão).

## Cores (HSL, em `app/globals.css`)
| Token | Valor | Uso |
|---|---|---|
| background | 0 0% 96% | Fundo da aplicação |
| card | 0 0% 100% | Painéis, cartões, campos |
| primary | 0 0% 9% | Ação principal, texto forte |
| secondary | 0 0% 96% | Cabeçalho de tabela, fundos suaves |
| accent | 0 0% 93% | Item ativo e hover |
| border / input | 0 0% 90% / 86% | Divisórias e bordas |
| muted-foreground | 0 0% 42% | Texto secundário |
| success | 152 55% 36% | Nota 90–100, no ar |
| warning | 36 90% 44% | Nota 50–89, em andamento |
| destructive | 0 68% 50% | Nota 0–49, erro |
| info | 217 70% 50% | Informação neutra |

## Tipografia
- Título de página 18 px semibold · título de cartão 14 px semibold · corpo e controles 13 px · apoio 12 px · rótulo 11 px caixa alta.

## Componentes
Button (primary, outline, secondary, ghost, destructive; sm e md), Select, campos de texto, Badge, Card, Segmented, ScoreGauge, StatusSelect, Avatar, EmptyState.
