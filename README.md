# Arena Brasil · Reservas (protótipo)

Protótipo navegável, mobile-first, do agendamento de quadras de areia (visão do aluno).
4 quadras (1–2 cobertas, 3–4 ao ar livre), blocos de 1h com tarifa diurna/noturna,
multi-seleção de horários, "Minhas reservas" com cancelamento e export `.ics`.

Sem backend: a ocupação é simulada e as reservas ficam no `localStorage` do aparelho.

```sh
npm install
npm run dev      # http://localhost:5173 (também exposto na rede para testar no celular)
npm run build    # gera dist/
```

## Deploy no Netlify
Conecte o repositório — `netlify.toml` já define `npm run build` e publica `dist/`.
`public/_redirects` garante que rotas como `/minhas-reservas` funcionem ao recarregar.
