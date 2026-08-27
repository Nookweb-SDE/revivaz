/**
 * Candidatura do profissional.
 *
 * O insert passa pelo servidor, e não direto pelo supabase-js, por dois
 * motivos: o IP do aceite do termo só existe aqui, e o `profile_id` tem que vir
 * do token — nunca do corpo, senão qualquer um se candidata no lugar de outro.
 */
import { Router, type Request, type Response } from "express";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, requireAuth } from "../config";
import { cpfValido, somenteDigitos } from "../../src/lib/documentos";
import { registroValido } from "../../src/lib/conselhos";
import { ESPECIALIDADES } from "../../src/lib/especialidades";

const router = Router();

/** Sobe junto com o texto do Termo do Profissional. Mudou o texto, muda aqui. */
export const TERMO_PROFISSIONAL_VERSAO = "2026-08-26";

router.post("/api/candidatura", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: "Auth not configured" });
    return;
  }
  const uid = res.locals.uid as string;

  const nome_completo = String(req.body?.nome_completo ?? "").trim().slice(0, 160);
  const cpf = String(req.body?.cpf ?? "").trim();
  const telefone = String(req.body?.telefone ?? "").trim().slice(0, 32);
  const conselho = String(req.body?.conselho ?? "").trim();
  const registro = String(req.body?.registro ?? "").trim().slice(0, 40);
  const uf_conselho = String(req.body?.uf_conselho ?? "").trim().slice(0, 2) || null;
  const especialidade = String(req.body?.especialidade ?? "").trim();
  const cnpj = somenteDigitos(String(req.body?.cnpj ?? "")) || null;
  const bio = String(req.body?.bio ?? "").trim().slice(0, 1000) || null;
  const horasBruto = Number(req.body?.horas_semana);
  const horas_semana = Number.isFinite(horasBruto) && horasBruto > 0 ? Math.min(horasBruto, 60) : null;
  const aceite = req.body?.aceite_termo === true;

  if (nome_completo.length < 3) {
    res.status(400).json({ error: "Diga seu nome completo." });
    return;
  }
  if (!cpfValido(cpf)) {
    res.status(400).json({ error: "Confira o CPF." });
    return;
  }
  if (telefone.replace(/\D/g, "").length < 10) {
    res.status(400).json({ error: "Confira o telefone com DDD." });
    return;
  }
  if (!registroValido(conselho, registro)) {
    res.status(400).json({ error: "Confira o conselho e o número do registro." });
    return;
  }
  if (!ESPECIALIDADES.some((e) => e.valor === especialidade)) {
    res.status(400).json({ error: "Escolha uma especialidade da lista." });
    return;
  }
  if (!aceite) {
    res.status(400).json({ error: "É preciso aceitar o Termo do Profissional." });
    return;
  }

  const fwd = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(fwd) ? fwd[0] : (fwd || "").toString().split(",")[0].trim()) ||
    req.socket.remoteAddress ||
    "desconhecido";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    Prefer: "return=representation,resolution=merge-duplicates",
  };

  try {
    // upsert pelo profile_id: reenviar em pendência atualiza, não duplica
    const r = await fetch(`${SUPABASE_URL}/rest/v1/candidaturas?on_conflict=profile_id`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        profile_id: uid,
        nome_completo,
        cpf: somenteDigitos(cpf),
        telefone,
        conselho,
        registro,
        uf_conselho,
        especialidade,
        cnpj,
        bio,
        horas_semana,
        status: "recebida",
        // reenvio limpa a pendência antiga: senão o candidato continua vendo
        // na tela um motivo que ele já resolveu
        motivo: null,
        termo_versao: TERMO_PROFISSIONAL_VERSAO,
        termo_aceito_em: new Date().toISOString(),
        termo_aceito_ip: ip,
      }),
    });
    if (!r.ok) {
      const corpo = await r.text();
      console.error("[candidatura] erro ao gravar:", r.status, corpo);
      res.status(500).json({ error: "Não consegui registrar agora. Tente de novo." });
      return;
    }
    console.log(`[candidatura] recebida de uid=${uid.slice(0, 8)}… especialidade=${especialidade}`);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[candidatura] erro inesperado:", err);
    res.status(500).json({ error: "Não consegui registrar agora. Tente de novo." });
  }
});

export default router;
