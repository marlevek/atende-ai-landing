/**
 * Worker do atende-ai-landing.
 *
 * Faz duas coisas:
 *  1. POST /api/lead → recebe o form da landing, envia e-mail via Resend.
 *  2. Qualquer outra rota → delega pro binding ASSETS (sirva o estático
 *     correspondente de `public/` conforme `wrangler.toml`).
 *
 * Variáveis injetadas pelo dashboard Cloudflare → Variables and Secrets:
 *   RESEND_API_KEY  (Secret) — chave da Resend
 *   RESEND_FROM     (Plain)  — remetente verificado (ou onboarding@resend.dev)
 *   RESEND_LEAD_TO  (Plain)  — e-mail que recebe os leads
 */

const escapar = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function tratarLead(request, env) {
  // 1. Parse seguro.
  let dados;
  try {
    dados = await request.json();
  } catch {
    return json({ ok: false, erro: 'json_invalido' }, 400);
  }

  // 2. Honeypot — bot preenche, humano não. Finge sucesso pra não treinar bot.
  if (dados.empresa_extra) {
    return json({ ok: true });
  }

  // 3. Validação mínima.
  const nome = (dados.nome || '').trim();
  const email = (dados.email || '').trim();
  if (!nome || !email || !email.includes('@')) {
    return json({ ok: false, erro: 'campos_invalidos' }, 400);
  }

  // 4. Config.
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM || 'onboarding@resend.dev';
  const to = env.RESEND_LEAD_TO;
  if (!apiKey || !to) {
    return json({ ok: false, erro: 'resend_nao_configurado' }, 503);
  }

  // 5. Monta e-mail.
  const html = `
    <h2>Novo lead — Atende AI</h2>
    <p><strong>Nome:</strong> ${escapar(nome)}</p>
    <p><strong>E-mail:</strong> ${escapar(email)}</p>
    <p><strong>WhatsApp:</strong> ${escapar(dados.whatsapp) || '—'}</p>
    <p><strong>Site:</strong> ${escapar(dados.site) || '—'}</p>
    <p><strong>Mensagem:</strong></p>
    <pre style="background:#f4f4f5;padding:12px;border-radius:6px;white-space:pre-wrap;font-family:inherit">${escapar(dados.mensagem) || '—'}</pre>
    <hr>
    <p style="color:#888;font-size:12px">Enviado pelo formulário em atendeai.codertec.com.br</p>
  `;

  // 6. Chama Resend.
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Lead Atende AI — ${nome}`,
        html,
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      return json({ ok: false, erro: 'resend_erro', detalhe: t.slice(0, 200) }, 502);
    }
  } catch (err) {
    return json({ ok: false, erro: 'rede', detalhe: String(err).slice(0, 200) }, 502);
  }

  return json({ ok: true });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API: lead
    if (url.pathname === '/api/lead' && request.method === 'POST') {
      return tratarLead(request, env);
    }

    // Tudo o mais → estáticos servidos pelo binding ASSETS
    return env.ASSETS.fetch(request);
  },
};
