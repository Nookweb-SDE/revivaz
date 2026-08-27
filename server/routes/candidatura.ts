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
import { podeTransicionar, type StatusCandidatura } from "../../src/lib/candidaturaEstados";
import { verificarIdentidade } from "../lib/bigdatacorp";

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
      // Só o status: o corpo de erro do Postgres traz "Failing row contains (...)"
      // com nome, CPF e telefone dentro.
      console.error("[candidatura] erro ao gravar:", r.status);
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

/** Cabeçalhos de service_role. Ignora RLS: só para CHECAR e para promover. */
function adminHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };
}

/** true se o uid é admin. Mesmo padrão do /api/admin/profissional-link. */
async function ehAdmin(uid: string): Promise<boolean> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}&select=role`, {
    headers: adminHeaders(),
  });
  if (!r.ok) return false;
  const linhas = (await r.json()) as Array<{ role?: string }>;
  return linhas[0]?.role === "admin";
}

interface CandidaturaCarregada {
  id: string;
  profile_id: string;
  nome_completo: string;
  especialidade: string;
  conselho: string;
  registro: string;
  bio: string | null;
  cpf: string;
  cnpj: string | null;
  status: StatusCandidatura;
}

async function carregarCandidatura(id: string): Promise<CandidaturaCarregada | null> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/candidaturas?id=eq.${encodeURIComponent(id)}&select=*`,
    { headers: adminHeaders() }
  );
  if (!r.ok) return null;
  const linhas = (await r.json()) as CandidaturaCarregada[];
  return linhas[0] ?? null;
}

// POST /api/admin/candidatura/:id/verificar — evidência, não decisão.
router.post(
  "/api/admin/candidatura/:id/verificar",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }
    if (!(await ehAdmin(res.locals.uid as string))) {
      res.status(403).json({ error: "Apenas administradores" });
      return;
    }
    const cand = await carregarCandidatura(String(req.params.id));
    if (!cand) {
      res.status(404).json({ error: "Candidatura não encontrada" });
      return;
    }
    const verificacao = await verificarIdentidade({
      cpf: cand.cpf,
      cnpj: cand.cnpj ?? undefined,
    });
    await fetch(`${SUPABASE_URL}/rest/v1/candidaturas?id=eq.${cand.id}`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ verificacao }),
    });
    console.log(`[candidatura] verificada id=${cand.id.slice(0, 8)}… configurado=${verificacao.configurado}`);
    res.status(200).json({ verificacao });
  }
);

// POST /api/admin/candidatura/:id/decidir — aprovar, recusar ou pendência.
router.post(
  "/api/admin/candidatura/:id/decidir",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }
    const uid = res.locals.uid as string;
    if (!(await ehAdmin(uid))) {
      res.status(403).json({ error: "Apenas administradores" });
      return;
    }

    const acao = String(req.body?.acao ?? "");
    const motivo = String(req.body?.motivo ?? "").trim().slice(0, 500);
    const destino: Record<string, StatusCandidatura> = {
      aprovar: "aprovada",
      recusar: "recusada",
      pendencia: "pendencia",
      analisar: "em_analise",
    };
    const novoStatus = destino[acao];
    if (!novoStatus) {
      res.status(400).json({ error: "Ação inválida" });
      return;
    }
    if ((acao === "recusar" || acao === "pendencia") && motivo.length < 5) {
      res.status(400).json({ error: "Escreva o motivo: é o que o candidato vai ler." });
      return;
    }

    const cand = await carregarCandidatura(String(req.params.id));
    if (!cand) {
      res.status(404).json({ error: "Candidatura não encontrada" });
      return;
    }
    // É esta checagem que torna aprovar idempotente: aprovada → aprovada não existe.
    if (!podeTransicionar(cand.status, novoStatus)) {
      res.status(409).json({ error: `Não dá para ir de ${cand.status} para ${novoStatus}.` });
      return;
    }

    try {
      if (novoStatus === "aprovada") {
        const criar = await fetch(`${SUPABASE_URL}/rest/v1/profissionais`, {
          method: "POST",
          headers: { ...adminHeaders(), Prefer: "return=representation" },
          body: JSON.stringify({
            nome: cand.nome_completo,
            especialidade: cand.especialidade,
            registro: `${cand.conselho} ${cand.registro}`,
            bio: cand.bio,
            ativo: true,
            profile_id: cand.profile_id,
          }),
        });
        if (!criar.ok) {
          console.error("[candidatura] falha ao criar profissional:", criar.status);
          res.status(500).json({ error: "Não consegui promover agora." });
          return;
        }
        const virarProfissional = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${cand.profile_id}`,
          { method: "PATCH", headers: adminHeaders(), body: JSON.stringify({ role: "profissional" }) }
        );
        if (!virarProfissional.ok) {
          console.error("[candidatura] falha ao trocar o papel:", virarProfissional.status);
          res.status(500).json({ error: "Não consegui promover agora." });
          return;
        }
      }

      await fetch(`${SUPABASE_URL}/rest/v1/candidaturas?id=eq.${cand.id}`, {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({
          status: novoStatus,
          motivo: motivo || null,
          analisado_por: uid,
          analisado_em: new Date().toISOString(),
        }),
      });
      console.log(`[candidatura] id=${cand.id.slice(0, 8)}… ${cand.status} → ${novoStatus}`);
      res.status(200).json({ ok: true, status: novoStatus });
    } catch (err) {
      console.error("[candidatura] erro ao decidir:", err);
      res.status(500).json({ error: "Erro interno" });
    }
  }
);

export default router;
