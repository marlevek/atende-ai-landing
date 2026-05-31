# AtendeSite — landing page

Landing pública do produto em `atendesite.com.br`.

Stack: **HTML + Tailwind via CDN** + **Cloudflare Workers Assets** (estáticos + Worker que trata o form do contato e envia e-mail via Resend).

> Inicialmente foi montado como Pages Functions (`functions/api/lead.js`), mas a Cloudflare unificou Workers + Pages e o fluxo "Connect to Git" sempre cria Worker — então migramos pra **Workers Assets** (`wrangler.jsonc` + `src/index.js`). O comportamento pro usuário final é idêntico.

---

## Estrutura

```
atende-ai-landing/
├── wrangler.jsonc          ← config do Worker (gerada pelo PR autoconfig da Cloudflare, ajustada com main + binding ASSETS)
├── src/
│   └── index.js            ← Worker: rota /api/lead + delega o resto pra ASSETS
├── public/
│   ├── index.html          ← landing inteira (1 arquivo)
│   └── _headers            ← security headers (HSTS, X-Frame, etc)
├── .gitignore
└── README.md
```

## Como funciona

- `wrangler.jsonc` declara que o Worker é `src/index.js` e os estáticos vivem em `public/`.
- Toda request entra no Worker.
  - `POST /api/lead` → handler `tratarLead()` que valida, anti-bot (honeypot), e chama API Resend
  - Qualquer outra → `env.ASSETS.fetch(request)` serve o arquivo correspondente em `public/`

## Rodar local

Abrir `public/index.html` direto no navegador serve pra ver visual. O form não funciona porque depende do Worker.

Pra rodar o Worker local com Wrangler:

```
npm install -g wrangler
wrangler dev
```

Roda em `http://localhost:8787`. As secrets vão em `.dev.vars` (gitignored):

```
RESEND_API_KEY=re_xxx
RESEND_FROM=onboarding@resend.dev
RESEND_LEAD_TO=marlevek@gmail.com
```

## Deploy

Push pro GitHub → Cloudflare faz deploy automático (depois que você configurou a integração inicial).

### Variáveis no Cloudflare

Dashboard → projeto **atende-ai-landing** → **Settings → Variables and Secrets** → **Add variable**:

| Variable | Value | Type |
|---|---|---|
| `RESEND_API_KEY` | chave da Resend (`re_...`) | **Secret** |
| `RESEND_FROM` | `onboarding@resend.dev` (provisório) ou `leads@atendeai.codertec.com.br` (após verificar domínio na Resend) | Plaintext |
| `RESEND_LEAD_TO` | `marlevek@gmail.com` (ou o e-mail que recebe os leads) | Plaintext |

Depois de salvar, aba **Deployments** → último deploy → **⋯** → **Retry deployment** pra aplicar.

## Domínio `atendesite.com.br`

Domínio próprio do produto (registrado em 2026-05-30), apontado pro Worker via
Cloudflare → projeto **atende-ai-landing** → **Custom domains**. Como é apex
(raiz), o DNS é resolvido pela Cloudflare (CNAME flattening / registros que o
próprio painel da Cloudflare orienta ao adicionar o custom domain). SSL
(Let's Encrypt) é emitido automaticamente após a propagação.

> Worker direto (sempre disponível, sem domínio): `atende-ai-landing.marlevek.workers.dev`

## Resend — verificar o domínio remetente (opcional, depois)

Pra mandar de `leads@atendeai.codertec.com.br` em vez do sandbox da Resend:
- Resend → **Domains** → **Add** → `atendeai.codertec.com.br`
- Seguir os DNS records (TXT/MX/SPF/DKIM) — todos no cPanel HostGator
- Quando verificar, trocar `RESEND_FROM` na Cloudflare pra `leads@atendeai.codertec.com.br`

## TODO (placeholders no código)

- `public/index.html` — depoimentos de Climátis/Odontolevek/Carolina (procurar `[depoimento pendente]`)
- Cloudflare env vars — `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_LEAD_TO`
