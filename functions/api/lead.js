/**
 * Cloudflare Pages Function — POST /api/lead
 *
 * Recebe o form da landing, envia e-mail via Resend pro destino configurado
 * em RESEND_LEAD_TO. Inclui honeypot anti-spam.
 *
 * Variáveis de ambiente (configurar no Cloudflare Pages → Settings → Environment variables):
 *   RESEND_API_KEY   → chave da Resend
 *   RESEND_FROM      → remetente verificado (ex.: leads@atendeai.codertec.com.br)
 *   RESEND_LEAD_TO   → e-mail que vai receber os leads (ex.: marlevek@gmail.com)
 */

const escapar = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export async function onRequestPost({ request, env }) {
  // 1. Parse seguro do JSON.
  let dados;
  try {
    dados = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, erro: 'json_invalido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Honeypot — bot preenche, humano não. Resposta finge sucesso pra não treinar o bot.
  if (dados.empresa_extra) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Validação mínima.
  const nome = (dados.nome || '').trim();
  const email = (dados.email || '').trim();
  if (!nome || !email || !email.includes('@')) {
    return new Response(JSON.stringify({ ok: false, erro: 'campos_invalidos' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // 4. Config de envio.
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM || 'leads@atendeai.codertec.com.br';
  const to = env.RESEND_LEAD_TO || 'marlevek@gmail.com';
  if (!apiKey) {
    return new Response(JSON.stringify({ ok: false, erro: 'resend_nao_configurado' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. Monta corpo do e-mail.
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
      return new Response(JSON.stringify({ ok: false, erro: 'resend_erro', detalhe: t.slice(0, 200) }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, erro: 'rede', detalhe: String(err).slice(0, 200) }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
