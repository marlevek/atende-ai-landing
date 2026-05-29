# Atende AI — landing page

Landing pública do produto, em `atendeai.codertec.com.br`.

Stack: **HTML + Tailwind via CDN** (sem build step) + **Cloudflare Pages Functions** pro form de contato (que envia e-mail via Resend).

---

## Estrutura

```
atende-ai-landing/
├── index.html              ← a landing inteira (1 arquivo)
├── functions/
│   └── api/
│       └── lead.js         ← POST /api/lead → envia e-mail via Resend
├── _headers                ← security headers (HSTS, X-Frame, etc)
├── .gitignore
└── README.md
```

## Rodar local

Não precisa servidor — abre o `index.html` direto no navegador.

O form **não funciona** localmente (depende da Function que só roda no Cloudflare). Pra testar form local, ver "Wrangler" abaixo.

## Deploy

1. Push pro GitHub (repo `atende-ai-landing`).
2. Cloudflare Dashboard → Pages → Create a project → Connect to Git → escolher o repo.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** (vazio)
   - **Build output directory:** `/`
4. Em **Environment variables** (Production e Preview):
   - `RESEND_API_KEY` — chave da Resend
   - `RESEND_FROM` — `leads@atendeai.codertec.com.br` (ou outro remetente verificado)
   - `RESEND_LEAD_TO` — e-mail que recebe os leads (ex.: `marlevek@gmail.com`)
5. Deploy. Cloudflare te dá uma URL `*.pages.dev`.

## Apontar `atendeai.codertec.com.br`

1. No projeto do Cloudflare Pages → **Custom domains** → **Set up a custom domain** → `atendeai.codertec.com.br`.
2. Cloudflare vai te mostrar o CNAME alvo (algo como `atende-ai-landing.pages.dev`).
3. Como o DNS do `codertec.com.br` está na HostGator, criar lá:
   - cPanel → **Zone Editor** → **Manage** do domínio `codertec.com.br`
   - **Add Record** → tipo `CNAME`, name `atendeai`, value `atende-ai-landing.pages.dev`, TTL 14400
4. Aguardar propagação (~5-30 min). Cloudflare verifica e ativa o SSL automaticamente.

## Resend — verificar o domínio remetente

Pra mandar de `leads@atendeai.codertec.com.br`, no Resend → Domains → Add → `atendeai.codertec.com.br` → seguir os DNS records (TXT/MX). Tudo isso vai no cPanel HostGator também.

Se não quiser verificar agora, usar o domínio sandbox do Resend e deixar `RESEND_FROM=onboarding@resend.dev` provisoriamente.

## TODO (placeholders no código)

- `index.html` — depoimentos de Climátis/Odontolevek/Carolina (procurar `[depoimento pendente]`)
- `index.html` — WhatsApp da Codertec no link `wa.me/5541999999999` (procurar comentário `TODO`)
- Cloudflare env vars — `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_LEAD_TO`

## Wrangler (opcional, pra testar local)

```
npm install -g wrangler
wrangler pages dev .
```

Aí roda em `http://localhost:8788` com as Functions ativas. Variáveis num arquivo `.dev.vars`:

```
RESEND_API_KEY=re_xxx
RESEND_FROM=onboarding@resend.dev
RESEND_LEAD_TO=marlevek@gmail.com
```
