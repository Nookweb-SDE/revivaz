// E-mail de acesso: link de um clique + senha temporária (o código numérico
// do Supabase; o projeto do Diogo gera 8 dígitos). Função pura, para o teste conferir o que sai.

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** "29707570" → "2970 7570": em duas metades, mais fácil de ler e digitar no celular. */
export function formatarCodigo(codigo: string): string {
  if (!/^\d{6,10}$/.test(codigo)) return codigo;
  const meio = Math.ceil(codigo.length / 2);
  return `${codigo.slice(0, meio)} ${codigo.slice(meio)}`;
}

export function emailAcesso(link: string, codigo: string): { assunto: string; html: string; texto: string } {
  const c = esc(formatarCodigo(codigo));
  const l = esc(link);
  // Mesmo desenho do e-mail da NookTrack (cartão escuro, faixa de cor no topo,
  // cadeado 3D ao lado do título, botão em degradê, selo de validade e o link
  // cru embaixo), nas cores da Revivaz. Tabela + estilo inline: é o que o
  // Gmail e o Outlook respeitam.
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#EEF2F4;font-family:Nunito,Segoe UI,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F4;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:430px;background:#0B1D3A;border-radius:22px;border-top:3px solid #00BFD8;overflow:hidden">
<tr><td align="center" style="padding:26px 30px 6px">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="padding-right:12px"><div style="background:#FFFFFF;border-radius:14px;padding:6px;width:44px;height:44px"><img src="cid:logo@revivaz" width="44" height="44" alt="Revivaz" style="display:block"></div></td>
    <td><div style="color:#FFFFFF;font-size:26px;font-weight:800;letter-spacing:.5px;line-height:1">Revivaz</div>
        <div style="color:#7FA3B3;font-size:10px;font-weight:700;letter-spacing:.32em;margin-top:5px">SAÚDE MENTAL</div></td>
  </tr></table>
</td></tr>
<tr><td style="padding:20px 30px 0">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="padding-right:14px;vertical-align:middle"><img src="cid:cadeado@revivaz" width="40" alt="" style="display:block"></td>
    <td style="vertical-align:middle"><div style="color:#FFFFFF;font-size:17px;font-weight:800">Seu acesso à Revivaz</div>
        <div style="color:#8FA4B8;font-size:13px;margin-top:3px">Link seguro · uso único</div></td>
  </tr></table>
</td></tr>
<tr><td style="padding:18px 30px 0;color:#D5DEE6;font-size:15px;line-height:1.6">
  Olá!<br>Recebemos um pedido para entrar na sua conta. Clique no botão abaixo para entrar.
</td></tr>
<tr><td style="padding:22px 30px 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="border-radius:14px;background:#00BFD8;background:linear-gradient(90deg,#5FE0F0,#00A5BD)">
    <a href="${l}" style="display:block;padding:17px 12px;color:#06263A;font-weight:800;font-size:16px;text-decoration:none">Entrar na Revivaz &rarr;</a>
  </td></tr></table>
</td></tr>
<tr><td style="padding:12px 30px 0">
  <div style="background:#10324A;border:1px solid #1E5A6E;border-radius:999px;padding:11px 12px;text-align:center;color:#9FE6F0;font-size:12px;font-weight:700">Expira em pouco tempo · uso pessoal</div>
</td></tr>
<tr><td style="padding:18px 30px 0">
  <div style="background:#13284A;border:1px dashed #2E6E86;border-radius:14px;padding:14px;text-align:center">
    <div style="color:#8FA4B8;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">ou digite a senha temporária</div>
    <div style="color:#FFFFFF;font-size:26px;font-weight:800;letter-spacing:.2em;margin-top:6px">${c}</div>
  </div>
</td></tr>
<tr><td style="padding:18px 30px 0;color:#7F93A6;font-size:12px;text-align:center">Se o botão não abrir, copie e cole este link no navegador</td></tr>
<tr><td style="padding:10px 30px 0">
  <div style="background:#13284A;border:1px solid #22406A;border-radius:14px;padding:14px 16px;text-align:center;word-break:break-all"><a href="${l}" style="color:#5FE0F0;font-size:13px;text-decoration:none">${l}</a></div>
</td></tr>
<tr><td style="padding:20px 30px 28px;color:#7F93A6;font-size:12px;line-height:1.6;text-align:center">
  No primeiro acesso você cria a sua própria senha.<br>Não pediu este acesso? É só ignorar este e-mail.<br>Em crise, ligue <strong style="color:#D5DEE6">188 (CVV)</strong>, 24 horas.
</td></tr>
</table>
</td></tr></table></body></html>`;
  const texto = `Seu acesso à Revivaz

Entrar: ${link}

Ou use a senha temporária: ${formatarCodigo(codigo)}

No primeiro acesso você cria a sua própria senha.
Não pediu este acesso? É só ignorar este e-mail.
Em crise, ligue 188 (CVV), 24 horas.`;
  return { assunto: "Seu acesso à Revivaz", html, texto };
}
