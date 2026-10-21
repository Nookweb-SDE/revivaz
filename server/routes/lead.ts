// Destino REAL do formulário "Agendar consulta" da landing. Antes disso o botão
// só fazia setAgendarOk(true): o visitante achava que tinha agendado e não tinha.
//
// Rota PÚBLICA (o visitante não tem sessão), então: rate-limit por IP, gravação
// via service_role (a tabela leads não aceita escrita do navegador) e avisos
// best-effort — se a Evolution falhar, o lead JÁ está salvo.
import { Router, type Request, type Response } from "express";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SCHEMA_HEADERS } from "../config";
import { telefoneValido, emailValido } from "../validacao";
import { isLeadRateLimited } from "../lib/limitadores";

const router = Router();

// ─── POST /api/lead ──────────────────────────────────────────────────────────
// Destino REAL do formulário "Agendar consulta" da landing. Antes disso o botão
// só fazia setAgendarOk(true): o visitante achava que tinha agendado e não tinha.
//
// Rota PÚBLICA (o visitante não tem sessão), então:
//  - rate-limit por IP, para não virar caixa de spam;
//  - grava via service_role (a tabela leads não aceita escrita do navegador);
//  - confirma no WhatsApp de quem pediu e avisa o admin — best-effort: se a
//    Evolution falhar, o lead JÁ está salvo e a resposta continua sendo sucesso.
router.post("/api/lead", async (req: Request, res: Response): Promise<void> => {
  const fwd = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(fwd) ? fwd[0] : (fwd || "").toString().split(",")[0].trim()) ||
    req.socket.remoteAddress ||
    "desconhecido";

  if (isLeadRateLimited(ip, Date.now())) {
    res.status(429).json({ error: "Muitos pedidos. Tente de novo mais tarde." });
    return;
  }

  const nome = String(req.body?.nome ?? "").trim().slice(0, 120);
  const telefone = String(req.body?.telefone ?? "").trim().slice(0, 32);
  const email = String(req.body?.email ?? "").trim().toLowerCase().slice(0, 160);
  const especialidade = String(req.body?.especialidade ?? "").trim().slice(0, 80);
  const data_desejada = String(req.body?.data ?? "").trim();
  const hora_desejada = String(req.body?.hora ?? "").trim();
  // Whitelist: a origem separa os dois funis (quem quer consulta x quem quer
  // atender). Valor livre viraria lixo no painel, então qualquer outra coisa
  // cai em "landing".
  const origemPedida = String(req.body?.origem ?? "").trim();
  const origem = origemPedida === "profissional" ? "profissional" : "landing";

  if (nome.length < 2) {
    res.status(400).json({ error: "Diga seu nome, por favor." });
    return;
  }
  if (!telefoneValido(telefone)) {
    res.status(400).json({ error: "Confira o telefone com DDD." });
    return;
  }
  if (!emailValido(email)) {
    res.status(400).json({ error: "Confira o e-mail." });
    return;
  }

  if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
    // Sem banco não há como prometer nada — melhor recusar do que fingir.
    console.error("[lead] service_role não configurado — pedido NÃO salvo");
    res.status(503).json({ error: "Não consegui registrar agora. Tente pelo WhatsApp." });
    return;
  }

  try {
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        ...SCHEMA_HEADERS,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        nome,
        telefone,
        email: email || null,
        especialidade: especialidade || null,
        data_desejada: /^\d{4}-\d{2}-\d{2}$/.test(data_desejada) ? data_desejada : null,
        hora_desejada: /^\d{2}:\d{2}/.test(hora_desejada) ? hora_desejada : null,
        origem,
      }),
    });
    if (!insertRes.ok) {
      const body = await insertRes.text();
      console.error("[lead] Erro ao gravar:", insertRes.status, body);
      res.status(500).json({ error: "Não consegui registrar agora. Tente de novo." });
      return;
    }
    const criado = (await insertRes.json()) as Array<{ id: string }>;
    const leadId = criado[0]?.id ?? "";
    console.log(`[lead] registrado id=${leadId.slice(0, 8)}… origem=${origem}`);

    // O aviso automático saiu junto com o WhatsApp. O pedido fica visível na
    // aba "Pedidos do site" do admin, que é onde a equipe age.
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[lead] Erro inesperado:", err);
    res.status(500).json({ error: "Não consegui registrar agora. Tente de novo." });
  }
});

export default router;
