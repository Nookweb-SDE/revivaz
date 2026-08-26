// Receita digital: PDF de verdade e reenvio no WhatsApp.
// Antes destas rotas os botões do /conta eram alert() falsos.
//
// Autorização por associação (service_role só para CHECAR): pode ver a receita
// o PACIENTE dela, o PROFISSIONAL que a emitiu, ou um admin.
import { Router, type Request, type Response } from "express";
import {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  EVOLUTION_API_KEY,
  EVOLUTION_URL,
  EVOLUTION_INSTANCE,
  requireAuth,
} from "../config";
import { buildReceitaPdf } from "../receitaPdf";
import { enviarWhatsApp } from "../lib/whatsapp";

const router = Router();

// ─── Receita digital: PDF + reenvio no WhatsApp ──────────────────────────────
// Antes destas rotas os botões "Baixar PDF" e "Reenviar no WhatsApp" do /conta
// eram alert() falsos: prometiam ao paciente algo que não acontecia.
//
// Autorização (service_role só p/ CHECAR associação, mesmo padrão do /room-token):
// pode ver a receita o PACIENTE dela, o PROFISSIONAL que a emitiu, ou um admin.
interface ReceitaCarregada {
  id: string;
  resumo: string;
  validade: string | null;
  created_at: string;
  paciente_id: string;
  profissional_id: string | null;
  pacienteNome: string;
  pacienteTelefone: string | null;
  profNome: string;
  profEspecialidade: string | null;
  profRegistro: string | null;
}

/**
 * Carrega a receita e decide se `callerUid` pode vê-la.
 * Retorna {status} > 0 quando deve responder erro; {receita} quando liberou.
 */
async function carregarReceitaAutorizada(
  receitaId: string,
  callerUid: string
): Promise<{ status: number; error?: string; receita?: ReceitaCarregada }> {
  const adminHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };

  const rRes = await fetch(
    `${SUPABASE_URL}/rest/v1/receitas?id=eq.${encodeURIComponent(receitaId)}` +
      `&select=id,resumo,validade,created_at,paciente_id,profissional_id`,
    { headers: adminHeaders }
  );
  if (!rRes.ok) {
    console.error("[receita] Erro ao ler receita:", rRes.status);
    return { status: 500, error: "Erro interno" };
  }
  const receitas = (await rRes.json()) as Array<{
    id: string;
    resumo: string;
    validade: string | null;
    created_at: string;
    paciente_id: string;
    profissional_id: string | null;
  }>;
  const r = receitas[0];
  // Receita inexistente responde 403, igual a receita alheia: não revela existência.
  if (!r) return { status: 403, error: "Sem acesso a esta receita" };

  // Quem é o chamador? (paciente da receita / profissional que emitiu / admin)
  let autorizado = r.paciente_id === callerUid;

  const profRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${callerUid}&select=role,nome`,
    { headers: adminHeaders }
  );
  if (!profRes.ok) {
    console.error("[receita] Erro ao ler profile do chamador:", profRes.status);
    return { status: 500, error: "Erro interno" };
  }
  const callerRows = (await profRes.json()) as Array<{ role?: string }>;
  if (callerRows[0]?.role === "admin") autorizado = true;

  // Dados do profissional emissor (precisamos deles para o PDF de qualquer jeito)
  let profNome = "Profissional";
  let profEspecialidade: string | null = null;
  let profRegistro: string | null = null;
  if (r.profissional_id) {
    const pRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profissionais?id=eq.${r.profissional_id}` +
        `&select=nome,especialidade,registro,profile_id`,
      { headers: adminHeaders }
    );
    if (pRes.ok) {
      const linhas = (await pRes.json()) as Array<{
        nome?: string;
        especialidade?: string | null;
        registro?: string | null;
        profile_id?: string | null;
      }>;
      const prof = linhas[0];
      if (prof) {
        profNome = prof.nome || profNome;
        profEspecialidade = prof.especialidade ?? null;
        profRegistro = prof.registro ?? null;
        if (prof.profile_id && prof.profile_id === callerUid) autorizado = true;
      }
    }
  }

  if (!autorizado) return { status: 403, error: "Sem acesso a esta receita" };

  // Nome e telefone do paciente (o PDF nomeia; o WhatsApp precisa do número)
  let pacienteNome = "Paciente";
  let pacienteTelefone: string | null = null;
  const pacRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${r.paciente_id}&select=nome,telefone`,
    { headers: adminHeaders }
  );
  if (pacRes.ok) {
    const linhas = (await pacRes.json()) as Array<{ nome?: string | null; telefone?: string | null }>;
    pacienteNome = linhas[0]?.nome || pacienteNome;
    pacienteTelefone = linhas[0]?.telefone ?? null;
  }

  return {
    status: 0,
    receita: {
      id: r.id,
      resumo: r.resumo,
      validade: r.validade,
      created_at: r.created_at,
      paciente_id: r.paciente_id,
      profissional_id: r.profissional_id,
      pacienteNome,
      pacienteTelefone,
      profNome,
      profEspecialidade,
      profRegistro,
    },
  };
}

// GET /api/receita/:id/pdf → application/pdf de verdade.
router.get(
  "/api/receita/:id/pdf",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }
    const callerUid = res.locals.uid as string;
    const receitaId = String(req.params.id || "").trim();
    if (!/^[0-9a-fA-F-]{36}$/.test(receitaId)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }

    try {
      const r = await carregarReceitaAutorizada(receitaId, callerUid);
      if (r.status !== 0 || !r.receita) {
        res.status(r.status).json({ error: r.error });
        return;
      }
      const bytes = await buildReceitaPdf({
        id: r.receita.id,
        resumo: r.receita.resumo,
        validade: r.receita.validade,
        emitidaEm: r.receita.created_at,
        paciente: { nome: r.receita.pacienteNome },
        profissional: {
          nome: r.receita.profNome,
          especialidade: r.receita.profEspecialidade,
          registro: r.receita.profRegistro,
        },
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="receita-${receitaId.slice(0, 8)}.pdf"`
      );
      // Documento de saúde: não pode ficar em cache de proxy.
      res.setHeader("Cache-Control", "private, no-store");
      console.log(`[receita/pdf] emitido receita=${receitaId.slice(0, 8)}…`);
      res.status(200).end(Buffer.from(bytes));
    } catch (err) {
      console.error("[receita/pdf] Erro inesperado:", err);
      res.status(500).json({ error: "Erro ao gerar o PDF" });
    }
  }
);

// POST /api/receita/whatsapp {receita_id} → manda o texto da receita ao paciente.
// Sem telefone no cadastro → 200 {ok:false, skipped} (não é erro de servidor,
// mas o front PRECISA mostrar isso em vez de dizer "enviado").
router.post(
  "/api/receita/whatsapp",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }
    if (!EVOLUTION_URL || !EVOLUTION_INSTANCE || !EVOLUTION_API_KEY) {
      res.status(200).json({ ok: false, skipped: "whatsapp não configurado" });
      return;
    }
    const callerUid = res.locals.uid as string;
    const receitaId = String(req.body?.receita_id ?? "").trim();
    if (!/^[0-9a-fA-F-]{36}$/.test(receitaId)) {
      res.status(400).json({ error: "receita_id inválido" });
      return;
    }

    try {
      const r = await carregarReceitaAutorizada(receitaId, callerUid);
      if (r.status !== 0 || !r.receita) {
        res.status(r.status).json({ error: r.error });
        return;
      }
      if (!r.receita.pacienteTelefone) {
        res.status(200).json({ ok: false, skipped: "sem telefone no cadastro" });
        return;
      }
      const validade = r.receita.validade
        ? `\nVálida até ${r.receita.validade.split("-").reverse().join("/")}.`
        : "";
      const texto =
        `Olá! Segue sua receita.\n\n` +
        `Profissional: ${r.receita.profNome}\n\n` +
        `${r.receita.resumo}${validade}\n\n` +
        `Você também pode baixar o PDF entrando na sua conta.`;
      const ok = await enviarWhatsApp(r.receita.pacienteTelefone, texto);
      if (!ok) {
        res.status(502).json({ error: "Não consegui enviar pelo WhatsApp agora" });
        return;
      }
      console.log(`[receita/whatsapp] enviada receita=${receitaId.slice(0, 8)}…`);
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[receita/whatsapp] Erro inesperado:", err);
      res.status(500).json({ error: "Erro interno" });
    }
  }
);

export default router;
