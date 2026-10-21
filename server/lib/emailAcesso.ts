// E-mail de acesso: link de um clique + senha temporária (o código de 6
// dígitos do Supabase). Função pura, para o teste conferir o que sai.

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** "482913" → "482 913": mais fácil de ler e de digitar no celular. */
export function formatarCodigo(codigo: string): string {
  return codigo.length === 6 ? `${codigo.slice(0, 3)} ${codigo.slice(3)}` : codigo;
}

export function emailAcesso(link: string, codigo: string): { assunto: string; html: string; texto: string } {
  const c = esc(formatarCodigo(codigo));
  const l = esc(link);
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#F7FAFB;font-family:Nunito,Segoe UI,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7FAFB;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#FFFFFF;border:1px solid #E2E8EC;border-radius:18px;overflow:hidden">
<tr><td style="background:#0B1D3A;background:linear-gradient(135deg,#0B1D3A,#112240);padding:24px">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="padding-right:16px"><img src="cid:cadeado@revivaz" width="52" alt="" style="display:block"></td>
    <td><div style="color:#FFFFFF;font-size:19px;font-weight:800">Seu acesso à Revivaz</div>
        <div style="color:#D6F4F8;font-size:13px;margin-top:2px">Vale por pouco tempo e só uma vez</div></td>
  </tr></table>
</td></tr>
<tr><td style="padding:22px 24px 26px;font-size:14px;line-height:1.55;color:#374151">
  Olá! Para entrar, clique no botão:
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 4px"><tr><td align="center" style="border-radius:14px;background:#007A8C">
    <a href="${l}" style="display:block;padding:15px 12px;color:#FFFFFF;font-weight:800;font-size:15px;text-decoration:none">Entrar na Revivaz</a>
  </td></tr></table>
  <div style="margin:16px 0;background:#D6F4F8;border:1px dashed #007A8C;border-radius:12px;padding:12px 14px;text-align:center">
    <div style="font-size:11px;font-weight:800;color:#007A8C;letter-spacing:.08em;text-transform:uppercase">ou use a senha temporária</div>
    <div style="font-size:24px;font-weight:800;letter-spacing:.18em;color:#004D5C">${c}</div>
  </div>
  No primeiro acesso você cria a sua própria senha.
  <div style="font-size:12px;color:#5A6672;margin-top:16px">Não pediu este acesso? É só ignorar este e-mail.<br>Em crise, ligue 188 (CVV), 24 horas.</div>
</td></tr></table>
</td></tr></table></body></html>`;
  const texto = `Seu acesso à Revivaz

Entrar: ${link}

Ou use a senha temporária: ${formatarCodigo(codigo)}

No primeiro acesso você cria a sua própria senha.
Não pediu este acesso? É só ignorar este e-mail.
Em crise, ligue 188 (CVV), 24 horas.`;
  return { assunto: "Seu acesso à Revivaz", html, texto };
}
