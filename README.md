# Arena Brasil · Reservas

App mobile-first para o aluno reservar quadras de areia da Arena Brasil. Consome as rotas
públicas da [Arena Brasil Scheduler API](../arena-brasil-scheduler-api):

| Tela              | Rotas                                                                             |
| ----------------- | --------------------------------------------------------------------------------- |
| Escolha da quadra | `GET /api/v1/courts`, `GET /api/v1/available-slots`, `GET /api/v1/business-hours` |
| Horários          | `GET /api/v1/courts/{id}/slots` (janela de hoje até +30 dias numa chamada)        |
| Confirmação       | `POST /api/v1/bookings`                                                           |

A API não tem leitura pública de reservas. Por isso, **Minhas reservas** mostra o que foi
reservado neste aparelho: a resposta do `POST` fica salva no `localStorage`. O cancelamento
é pedido à arena pelo WhatsApp, com uma mensagem pronta.

## Rodando localmente

```sh
cp .env.example .env.local   # ajuste se precisar
npm install
npm run dev                  # http://localhost:5173 (também exposto na rede para testar no celular)
```

A API precisa liberar a origem do front. No repositório da API, coloque
`CORS_ALLOWED_ORIGINS=http://localhost:5173` no `.env` e rode `docker compose up`. Para ter
dados, crie um admin (`scripts/create-admin.sh`), depois cadastre quadras e o horário de
funcionamento pelas rotas de admin (veja `docs/openapi.yaml`).

## Variáveis de ambiente

| Variável              | Descrição                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`   | URL da API. Obrigatória no build de produção.                                            |
| `VITE_ARENA_WHATSAPP` | WhatsApp da arena com DDI. O padrão é o da Arena Brasil (`554896331978`).                |
| `VITE_ARENA_TIMEZONE` | Fuso da arena. O padrão é `America/Sao_Paulo` e deve ser igual ao `APP_TIMEZONE` da API. |

## Scripts

```sh
npm run lint         # oxlint (o typescript-eslint ainda não suporta TypeScript 7)
npm run format       # prettier
npm run typecheck    # tsc
npm test             # vitest + Testing Library + MSW (API simulada em src/test/server.ts)
npm run build        # gera dist/
```

O CI (`.github/workflows/ci.yml`) roda lint, formatação, typecheck, testes e build.

## Estrutura

```
src/api/        cliente HTTP tipado, endpoints e hooks do TanStack Query
src/domain/     regras do negócio: validação do formulário, slots, quadras, esportes
src/lib/        datas no fuso da arena, formatação, histórico local
src/components/ UI; steps/ são as etapas do fluxo de reserva
src/pages/      Reservar e Minhas reservas
src/test/       fixtures, servidor MSW e helpers
```

## Deploy no Netlify

Conecte o repositório: o `netlify.toml` já define `npm run build` e publica `dist/`.
Configure `VITE_API_BASE_URL` nas variáveis de ambiente do site e
coloque o domínio do site em `CORS_ALLOWED_ORIGINS` na API. O `public/_redirects` garante
que rotas como `/minhas-reservas` funcionem ao recarregar a página.
