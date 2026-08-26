// Vincula uma ficha de profissional a um login (cria ou acha o auth user pelo
// e-mail e marca role=profissional). Só admin — conferido pela service_role.
import { Router, type Request, type Response } from "express";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, requireAuth } from "../config";

const router = Router();

// ─── POST /api/admin/profissional-link ───────────────────────────────────────
// Admin vincula uma linha de `profissionais` a um auth user (por e-mail):
// cria/acha o user, promove paciente->profissional, seta profissionais.profile_id.
// Segurança: exige Bearer válido do usuário logado E que ele seja role='admin'.
router.post(
  "/api/admin/profissional-link",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: "Auth not configured" });
      return;
    }

    // uid validado pelo middleware requireAuth
    const callerUid = res.locals.uid as string;

    const profissional_id = String(req.body?.profissional_id ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    if (!profissional_id || !email) {
      res.status(400).json({ error: "profissional_id e email são obrigatórios" });
      return;
    }

    const adminHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    };

    // (2) confere que o chamador é admin (service_role, ignora RLS)
    try {
      const roleRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${callerUid}&select=role`,
        { headers: adminHeaders }
      );
      if (!roleRes.ok) {
        const body = await roleRes.text();
        console.error("[prof-link] Erro ao ler role:", roleRes.status, body);
        res.status(500).json({ error: "Erro interno de autenticação" });
        return;
      }
      const rows = (await roleRes.json()) as Array<{ role?: string }>;
      if (!rows[0] || rows[0].role !== "admin") {
        res.status(403).json({ error: "Apenas administradores" });
        return;
      }
    } catch (err) {
      console.error("[prof-link] Erro inesperado (role):", err);
      res.status(500).json({ error: "Erro interno de autenticação" });
      return;
    }

    // (3) cria-ou-acha o auth user alvo pelo e-mail (mesmo padrão do /wa/verify)
    let targetUid: string;
    try {
      const listRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`,
        { headers: adminHeaders }
      );
      if (!listRes.ok) {
        const body = await listRes.text();
        console.error("[prof-link] Erro ao listar usuários:", listRes.status, body);
        res.status(500).json({ error: "Erro interno de autenticação" });
        return;
      }
      const listBody = (await listRes.json()) as {
        users?: Array<{ id: string; email?: string }>;
      };
      const existing = (listBody.users ?? []).find(
        (u) => (u.email ?? "").toLowerCase() === email
      );

      if (existing) {
        targetUid = existing.id;
      } else {
        const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
          method: "POST",
          headers: adminHeaders,
          body: JSON.stringify({ email, email_confirm: true }),
        });
        if (!createRes.ok) {
          const body = await createRes.text();
          console.error("[prof-link] Erro ao criar usuário:", createRes.status, body);
          res.status(500).json({ error: "Erro ao criar usuário" });
          return;
        }
        const created = (await createRes.json()) as { id: string };
        targetUid = created.id;
      }
    } catch (err) {
      console.error("[prof-link] Erro inesperado (find/create user):", err);
      res.status(500).json({ error: "Erro interno de autenticação" });
      return;
    }

    // (4) promove -> profissional (NÃO rebaixa admin). Idempotente e robusto:
    // promove sempre que o role atual NÃO for admin — cobre 'paciente' e também
    // o caso de a linha do profile ainda não estar visível (lag do trigger):
    // nesse caso currentRole é undefined (!== 'admin') e a gente promove mesmo
    // assim. Valida o resultado do PATCH antes de seguir pro vínculo.
    try {
      const roleRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${targetUid}&select=role`,
        { headers: adminHeaders }
      );
      let currentRole: string | undefined;
      if (roleRes.ok) {
        const rows = (await roleRes.json()) as Array<{ role?: string }>;
        currentRole = rows[0]?.role;
      }
      if (currentRole !== "admin") {
        const promoteRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${targetUid}`,
          {
            method: "PATCH",
            headers: { ...adminHeaders, Prefer: "return=minimal" },
            body: JSON.stringify({ role: "profissional" }),
          }
        );
        if (!promoteRes.ok) {
          const body = await promoteRes.text();
          console.error("[prof-link] Erro ao promover role:", promoteRes.status, body);
          res.status(500).json({ error: "Erro ao atualizar perfil" });
          return;
        }
      }
    } catch (err) {
      console.error("[prof-link] Erro ao atualizar role do alvo:", err);
      res.status(500).json({ error: "Erro ao atualizar perfil" });
      return;
    }

    // (5) vincula profissionais.profile_id = targetUid
    try {
      const updRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profissionais?id=eq.${profissional_id}`,
        {
          method: "PATCH",
          headers: { ...adminHeaders, Prefer: "return=minimal" },
          body: JSON.stringify({ profile_id: targetUid }),
        }
      );
      if (!updRes.ok) {
        const body = await updRes.text();
        console.error("[prof-link] Erro ao vincular profissional:", updRes.status, body);
        res.status(500).json({ error: "Erro ao vincular profissional" });
        return;
      }
    } catch (err) {
      console.error("[prof-link] Erro inesperado (update profissionais):", err);
      res.status(500).json({ error: "Erro ao vincular profissional" });
      return;
    }

    // (6) ok
    res.status(200).json({ ok: true, profile_id: targetUid });
  }
);

export default router;
