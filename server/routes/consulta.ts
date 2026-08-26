// Rotas da consulta: sala de vídeo (JWT Jitsi escopado), confirmação por
// WhatsApp e a nota clínica assistida por IA.
// Em todas, a service_role serve só para CHECAR associação antes de agir.
import { Router, type Request, type Response } from "express";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  EVOLUTION_API_KEY,
  EVOLUTION_URL,
  EVOLUTION_INSTANCE,
  JITSI_DOMAIN,
  JITSI_APP_ID,
  JITSI_JWT_SECRET,
  requireAuth,
} from "../config";
import { mintJitsiJwt } from "../jitsiJwt";
import { roomName, isOnline } from "../../src/video/room";
import { composeConfirmacao } from "../../src/notificacoes/mensagens";
import { enviarWhatsApp } from "../lib/whatsapp";
import { askClaudeBridge, isClaudeBridgeConfigured } from "../lib/claudeBridge";

const router = Router();

// ─── POST /api/consulta/room-token ───────────────────────────────────────────
// Emite um JWT Jitsi (curto) que restringe o portador à sala DAQUELA consulta.
// Segurança: exige Bearer válido do usuário; o caller precisa ser o paciente
// OU o profissional vinculado da consulta (validado via service_role, ignorando
// RLS só p/ checar associação). A consulta tem de ser 'online' e estar
// 'agendada'/'realizada'. moderator = o profissional. O secret nunca sai do
// server e o token/secret nunca são logados.
router.post(
  "/api/consulta/room-token",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }
    // Sem config Jitsi → 503 (front degrada p/ link externo via jitsiConfigured)
    if (!JITSI_DOMAIN || !JITSI_APP_ID || !JITSI_JWT_SECRET) {
      res.status(503).json({ error: "vídeo não configurado" });
      return;
    }

    // uid validado pelo middleware requireAuth
    const callerUid = res.locals.uid as string;

    const consulta_id = String(req.body?.consulta_id ?? "").trim();
    if (!consulta_id) {
      res.status(400).json({ error: "consulta_id é obrigatório" });
      return;
    }

    const adminHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    };

    // (2) carrega a consulta via service_role (ignora RLS p/ checar associação)
    let consulta: {
      id: string;
      paciente_id: string | null;
      profissional_id: string | null;
      tipo: string | null;
      status: string | null;
    };
    try {
      const cRes = await fetch(
        `${SUPABASE_URL}/rest/v1/consultas?id=eq.${encodeURIComponent(
          consulta_id
        )}&select=id,paciente_id,profissional_id,tipo,status`,
        { headers: adminHeaders }
      );
      if (!cRes.ok) {
        const body = await cRes.text();
        console.error("[room-token] Erro ao ler consulta:", cRes.status, body);
        res.status(500).json({ error: "Erro interno" });
        return;
      }
      const rows = (await cRes.json()) as Array<typeof consulta>;
      if (!rows[0]) {
        res.status(404).json({ error: "Consulta não encontrada" });
        return;
      }
      consulta = rows[0];
    } catch (err) {
      console.error("[room-token] Erro inesperado (consulta):", err);
      res.status(500).json({ error: "Erro interno" });
      return;
    }

    // (3) autorização: caller é paciente OU o profissional vinculado da consulta
    let isPaciente = consulta.paciente_id === callerUid;
    let isProfissional = false;
    if (!isPaciente && consulta.profissional_id) {
      try {
        const pRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profissionais?id=eq.${encodeURIComponent(
            consulta.profissional_id
          )}&profile_id=eq.${callerUid}&select=id`,
          { headers: adminHeaders }
        );
        if (pRes.ok) {
          const rows = (await pRes.json()) as Array<{ id: string }>;
          isProfissional = rows.length > 0;
        }
      } catch (err) {
        console.error("[room-token] Erro ao checar profissional:", err);
        res.status(500).json({ error: "Erro interno" });
        return;
      }
    }
    if (!isPaciente && !isProfissional) {
      res.status(403).json({ error: "Você não participa desta consulta" });
      return;
    }

    // (4) regras de negócio: online + status agendada/realizada
    if (!isOnline(String(consulta.tipo ?? ""))) {
      res.status(400).json({ error: "consulta não é online" });
      return;
    }
    if (
      consulta.status !== "agendada" &&
      consulta.status !== "realizada"
    ) {
      res.status(400).json({ error: "consulta não está disponível para vídeo" });
      return;
    }

    // (5) nome p/ context — best-effort (não bloqueia a sala se falhar)
    let userName = "Participante";
    try {
      const nRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${callerUid}&select=nome`,
        { headers: adminHeaders }
      );
      if (nRes.ok) {
        const rows = (await nRes.json()) as Array<{ nome?: string | null }>;
        const nome = rows[0]?.nome;
        if (nome && String(nome).trim()) userName = String(nome).trim();
      }
    } catch {
      // best-effort — mantém "Participante"
    }

    // (6) emite o JWT restrito à sala desta consulta
    const room = roomName(consulta.id);
    const moderator = isProfissional; // o profissional é o moderador
    const jwt = mintJitsiJwt({
      secret: JITSI_JWT_SECRET,
      appId: JITSI_APP_ID,
      domain: JITSI_DOMAIN,
      room,
      userId: callerUid,
      userName,
      moderator,
      nowSec: Math.floor(Date.now() / 1000),
    });

    console.log(
      `[room-token] sala emitida consulta=${consulta.id.slice(0, 8)}… moderator=${moderator}`
    );
    res.status(200).json({ token: jwt, room, domain: JITSI_DOMAIN });
  }
);

// ─── POST /api/consulta/notificar ────────────────────────────────────────────
// Notifica o PACIENTE por WhatsApp que a consulta foi AGENDADA (confirmação).
// Segurança: exige Bearer válido; o caller precisa ser admin OU o profissional
// vinculado da consulta (mesmo padrão do /room-token, via service_role só p/
// checar associação). Carrega o telefone do paciente em profiles.telefone.
// Sem telefone → {ok:false, skipped:"sem telefone"} (HTTP 200, não é erro: o
// front trata best-effort). Erro real de Evolution/servidor → >= 500.
// NUNCA loga telefone inteiro nem o texto.
router.post(
  "/api/consulta/notificar",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }
    // Evolution não configurado → não é erro de negócio: pula silenciosamente.
    if (!EVOLUTION_URL || !EVOLUTION_INSTANCE || !EVOLUTION_API_KEY) {
      res.status(200).json({ ok: false, skipped: "whatsapp não configurado" });
      return;
    }

    // uid validado pelo middleware requireAuth
    const callerUid = res.locals.uid as string;

    const consulta_id = String(req.body?.consulta_id ?? "").trim();
    if (!consulta_id) {
      res.status(400).json({ error: "consulta_id é obrigatório" });
      return;
    }

    const adminHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    };

    // (2) carrega a consulta via service_role (ignora RLS p/ checar associação)
    let consulta: {
      id: string;
      paciente_id: string | null;
      profissional_id: string | null;
      data: string | null;
      hora: string | null;
      tipo: string | null;
      status: string | null;
      link_ou_local: string | null;
    };
    try {
      const cRes = await fetch(
        `${SUPABASE_URL}/rest/v1/consultas?id=eq.${encodeURIComponent(
          consulta_id
        )}&select=id,paciente_id,profissional_id,data,hora,tipo,status,link_ou_local`,
        { headers: adminHeaders }
      );
      if (!cRes.ok) {
        const body = await cRes.text();
        console.error("[notificar] Erro ao ler consulta:", cRes.status, body);
        res.status(500).json({ error: "Erro interno" });
        return;
      }
      const rows = (await cRes.json()) as Array<typeof consulta>;
      if (!rows[0]) {
        res.status(404).json({ error: "Consulta não encontrada" });
        return;
      }
      consulta = rows[0];
    } catch (err) {
      console.error("[notificar] Erro inesperado (consulta):", err);
      res.status(500).json({ error: "Erro interno" });
      return;
    }

    // (3) autorização: caller é admin OU o profissional vinculado da consulta
    let autorizado = false;
    try {
      const roleRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${callerUid}&select=role`,
        { headers: adminHeaders }
      );
      if (roleRes.ok) {
        const rows = (await roleRes.json()) as Array<{ role?: string }>;
        if (rows[0]?.role === "admin") autorizado = true;
      }
    } catch (err) {
      console.error("[notificar] Erro ao checar admin:", err);
      res.status(500).json({ error: "Erro interno" });
      return;
    }
    if (!autorizado && consulta.profissional_id) {
      try {
        const pRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profissionais?id=eq.${encodeURIComponent(
            consulta.profissional_id
          )}&profile_id=eq.${callerUid}&select=id`,
          { headers: adminHeaders }
        );
        if (pRes.ok) {
          autorizado = ((await pRes.json()) as unknown[]).length > 0;
        }
      } catch (err) {
        console.error("[notificar] Erro ao checar profissional:", err);
        res.status(500).json({ error: "Erro interno" });
        return;
      }
    }
    if (!autorizado) {
      res.status(403).json({ error: "Você não pode notificar esta consulta" });
      return;
    }

    // (4) carrega nome + telefone do paciente (profiles.id = paciente_id)
    let nome: string | null = null;
    let telefone: string | null = null;
    if (consulta.paciente_id) {
      try {
        const pacRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(
            consulta.paciente_id
          )}&select=nome,telefone`,
          { headers: adminHeaders }
        );
        if (pacRes.ok) {
          const rows = (await pacRes.json()) as Array<{
            nome?: string | null;
            telefone?: string | null;
          }>;
          nome = rows[0]?.nome ?? null;
          telefone = rows[0]?.telefone ?? null;
        }
      } catch (err) {
        console.error("[notificar] Erro ao ler paciente:", err);
        res.status(500).json({ error: "Erro interno" });
        return;
      }
    }

    // Sem telefone → não é erro: pula (login por e-mail pode não ter telefone).
    if (!telefone || !String(telefone).replace(/\D/g, "")) {
      res.status(200).json({ ok: false, skipped: "sem telefone" });
      return;
    }

    // (5) compõe a confirmação (link só p/ online; mapeia link_ou_local → link)
    const texto = composeConfirmacao({
      nome,
      data: consulta.data,
      hora: consulta.hora,
      tipo: consulta.tipo,
      link: consulta.link_ou_local,
    });

    // (6) envia. Falha de Evolution → 5xx (é o caso que o front trata como erro).
    const ok = await enviarWhatsApp(String(telefone), texto);
    if (!ok) {
      res.status(502).json({ error: "Falha ao enviar WhatsApp" });
      return;
    }

    console.log(
      `[notificar] confirmação enviada consulta=${consulta.id.slice(0, 8)}…`
    );
    res.status(200).json({ ok: true });
  }
);

// ─── POST /api/consulta/nota-ia ──────────────────────────────────────────────
// Nota clínica assistida por IA: o PROFISSIONAL da consulta envia o que observou
// (ditado local no navegador OU digitado — SEM gravação de áudio/vídeo no server)
// e o Claude (via ponte CLI da assinatura) estrutura numa evolução PT-BR. É um RASCUNHO que o profissional
// revisa e salva (humano no loop) — não é diagnóstico (compliance CFP/Anvisa).
// Segurança: só o profissional vinculado da consulta (não o paciente).
const NOTA_CLINICA_PROMPT = `Você ajuda um(a) profissional de saúde mental a ORGANIZAR a evolução clínica de um atendimento, a partir das anotações/ditado que ele(a) fornece. Você NÃO diagnostica, NÃO inventa fatos e NÃO adiciona nada que não esteja nas anotações.

Estruture o texto recebido em PT-BR, claro e conciso, nestas seções (omita a seção se não houver informação):
- **Queixa / motivo:** o que a pessoa trouxe.
- **Observações:** o que o(a) profissional observou/relatou.
- **Conduta e próximos passos:** orientações, encaminhamentos, combinados.
- **Sinais de alerta:** riscos mencionados (se houver).

Regras: use só o que está nas anotações; NÃO dê nome de doença como conclusão nem prescreva medicação; mantenha um tom profissional e respeitoso; termine com a linha "_Rascunho gerado por IA a partir das anotações do profissional — revise antes de salvar._". Responda APENAS com a nota estruturada.`;

router.post(
  "/api/consulta/nota-ia",
  async (req: Request, res: Response): Promise<void> => {
    if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }
    if (!isClaudeBridgeConfigured()) {
      res.status(503).json({ error: "IA não configurada" });
      return;
    }

    const authHeader = String(req.headers["authorization"] ?? "");
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!token) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const consulta_id = String(req.body?.consulta_id ?? "").trim();
    const texto = String(req.body?.texto ?? "").trim();
    if (!consulta_id || !texto) {
      res.status(400).json({ error: "consulta_id e texto são obrigatórios" });
      return;
    }
    if (texto.length > 8000) {
      res.status(413).json({ error: "Texto muito longo." });
      return;
    }

    const adminHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    };

    // valida o Bearer
    let callerUid: string;
    try {
      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) {
        res.status(401).json({ error: "Sessão inválida" });
        return;
      }
      const u = (await userRes.json()) as { id?: string };
      if (!u.id) {
        res.status(401).json({ error: "Sessão inválida" });
        return;
      }
      callerUid = u.id;
    } catch (err) {
      console.error("[nota-ia] Erro ao validar token:", err);
      res.status(500).json({ error: "Erro interno de autenticação" });
      return;
    }

    // carrega a consulta + autoriza SÓ o profissional vinculado
    try {
      const cRes = await fetch(
        `${SUPABASE_URL}/rest/v1/consultas?id=eq.${encodeURIComponent(
          consulta_id
        )}&select=id,profissional_id`,
        { headers: adminHeaders }
      );
      if (!cRes.ok) {
        res.status(500).json({ error: "Erro interno" });
        return;
      }
      const rows = (await cRes.json()) as Array<{
        id: string;
        profissional_id: string | null;
      }>;
      const consulta = rows[0];
      if (!consulta) {
        res.status(404).json({ error: "Consulta não encontrada" });
        return;
      }
      let autorizado = false;
      if (consulta.profissional_id) {
        const pRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profissionais?id=eq.${encodeURIComponent(
            consulta.profissional_id
          )}&profile_id=eq.${callerUid}&select=id`,
          { headers: adminHeaders }
        );
        if (pRes.ok) {
          autorizado = ((await pRes.json()) as unknown[]).length > 0;
        }
      }
      if (!autorizado) {
        res.status(403).json({ error: "Apenas o profissional da consulta" });
        return;
      }
    } catch (err) {
      console.error("[nota-ia] Erro ao autorizar:", err);
      res.status(500).json({ error: "Erro interno" });
      return;
    }

    // Claude CLI (via ponte) estrutura a nota — texto curto, não-streaming.
    // Prompt = instrução clínica + as anotações do profissional.
    try {
      const prompt = `${NOTA_CLINICA_PROMPT}\n\nANOTAÇÕES DO PROFISSIONAL:\n${texto}`;
      const nota = (await askClaudeBridge({ prompt, timeoutMs: 55_000 })).trim();
      console.log(`[nota-ia] nota gerada consulta=${consulta_id.slice(0, 8)}…`);
      res.status(200).json({ nota });
    } catch (err) {
      console.error("[nota-ia] Erro ponte Claude:", err);
      res.status(500).json({ error: "Falha ao gerar a nota. Tente novamente." });
    }
  }
);

export default router;
