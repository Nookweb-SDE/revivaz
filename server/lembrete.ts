// Lembrete de consulta 24h antes, por WhatsApp. Roda de hora em hora e marca
// `lembrete_enviado` para nunca mandar duas vezes.
import {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  EVOLUTION_API_KEY,
  EVOLUTION_URL,
  EVOLUTION_INSTANCE,
} from "./config";
import { composeLembrete } from "../src/notificacoes/mensagens";
import { enviarWhatsApp } from "./lib/whatsapp";

// ─── Scheduler de LEMBRETE (24h antes) ───────────────────────────────────────
// De hora em hora: busca consultas status='agendada' com data = AMANHÃ e
// lembrete_enviado=false → envia composeLembrete ao paciente → marca a flag
// (service_role). Idempotente pela flag (não duplica). Só roda se Evolution +
// Supabase service_role estiverem configurados. NUNCA loga telefone/texto.
export function amanhaISO(): string {
  // Data (YYYY-MM-DD) de amanhã no fuso do Brasil (America/Sao_Paulo).
  // A coluna `consultas.data` é `date` sem fuso, preenchida pela UI brasileira
  // (UTC-3). Calcular em UTC erra o dia entre ~21h e meia-noite BRT (o UTC já
  // virou o dia seguinte), pulando/antecipando o lembrete. en-CA formata ISO.
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

export async function enviarLembretesPendentes(): Promise<void> {
  const adminHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };
  const dia = amanhaISO();

  let consultas: Array<{
    id: string;
    paciente_id: string | null;
    data: string | null;
    hora: string | null;
    tipo: string | null;
    link_ou_local: string | null;
  }> = [];
  try {
    const cRes = await fetch(
      `${SUPABASE_URL}/rest/v1/consultas?status=eq.agendada&data=eq.${dia}` +
        `&lembrete_enviado=eq.false` +
        `&select=id,paciente_id,data,hora,tipo,link_ou_local`,
      { headers: adminHeaders }
    );
    if (!cRes.ok) {
      const body = await cRes.text();
      console.error("[lembrete] Erro ao buscar consultas:", cRes.status, body);
      return;
    }
    consultas = (await cRes.json()) as typeof consultas;
  } catch (err) {
    console.error("[lembrete] Erro inesperado (busca):", err);
    return;
  }

  if (!consultas.length) return;
  console.log(`[lembrete] ${consultas.length} consulta(s) p/ amanhã`);

  for (const c of consultas) {
    if (!c.paciente_id) continue;
    // telefone + nome do paciente
    let nome: string | null = null;
    let telefone: string | null = null;
    try {
      const pacRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(
          c.paciente_id
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
      console.error("[lembrete] Erro ao ler paciente:", err);
      continue;
    }

    // sem telefone → marca como enviado p/ não reprocessar toda hora (degrade)
    if (!telefone || !String(telefone).replace(/\D/g, "")) {
      await marcarLembreteEnviado(adminHeaders, c.id);
      continue;
    }

    const texto = composeLembrete({
      nome,
      data: c.data,
      hora: c.hora,
      tipo: c.tipo,
      link: c.link_ou_local,
    });
    const ok = await enviarWhatsApp(String(telefone), texto);
    if (ok) {
      const marcado = await marcarLembreteEnviado(adminHeaders, c.id);
      if (marcado) {
        console.log(`[lembrete] enviado consulta=${c.id.slice(0, 8)}…`);
      } else {
        // Enviou mas NÃO conseguiu marcar a flag → na próxima passada (1h) a
        // consulta volta no filtro e o paciente recebe DE NOVO. Logamos em
        // WARN p/ o operador agir (idealmente marcar a flag à mão) antes do
        // próximo ciclo, evitando spam silencioso.
        console.warn(
          `[lembrete] ENVIADO mas flag NÃO marcada consulta=${c.id.slice(
            0,
            8
          )}… (risco de duplicar na próxima passada)`
        );
      }
    }
    // se falhou o envio: NÃO marca → tenta de novo na próxima passada (1h).
  }
}

// Marca lembrete_enviado=true. Retorna true só se o PATCH respondeu 2xx —
// não confia cegamente que a marcação ocorreu (RLS transitória, 5xx, etc.).
async function marcarLembreteEnviado(
  adminHeaders: Record<string, string>,
  consultaId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/consultas?id=eq.${encodeURIComponent(consultaId)}`,
      {
        method: "PATCH",
        headers: { ...adminHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ lembrete_enviado: true }),
      }
    );
    if (!res.ok) {
      console.error("[lembrete] PATCH flag não-2xx:", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[lembrete] Erro ao marcar flag:", err);
    return false;
  }
}

// Só agenda se temos como enviar (Evolution) e ler (service_role).
const lembreteHabilitado =
  !!EVOLUTION_URL &&
  !!EVOLUTION_INSTANCE &&
  !!EVOLUTION_API_KEY &&
  !!SUPABASE_URL &&
  !!SUPABASE_SERVICE_ROLE_KEY;

if (lembreteHabilitado) {
  const LEMBRETE_INTERVAL_MS = 3_600_000; // de hora em hora
  setInterval(() => {
    enviarLembretesPendentes().catch((err) =>
      console.error("[lembrete] passada falhou:", err)
    );
  }, LEMBRETE_INTERVAL_MS);
  console.log("[lembrete] scheduler ativo (de hora em hora)");
} else {
  console.log("[lembrete] scheduler inativo (Evolution/Supabase não configurado)");
}

