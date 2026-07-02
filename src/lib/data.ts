import { supabase } from "./supabase";
import { getSessionUserId } from "./auth";
import type {
  Profile,
  Profissional,
  Consulta,
  Receita,
  Conversa,
  Mensagem,
  Avaliacao,
  MetricsOverview,
  StatusConsulta,
  Triagem,
  HumorRegistro,
  RoomTokenResponse,
} from "./types";

// ---------------------------------------------------------------------------
// Patient functions
// ---------------------------------------------------------------------------

export async function getProfile(): Promise<Profile | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function atualizarProfile(p: Partial<Profile>): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Usuário não autenticado");

  const { error } = await supabase
    .from("profiles")
    .update(p)
    .eq("id", userId);

  if (error) throw error;
}

export async function listProfissionais(): Promise<Profissional[]> {
  const { data, error } = await supabase
    .from("profissionais")
    .select("*")
    .eq("ativo", true);

  if (error) throw error;
  return (data ?? []) as Profissional[];
}

export async function getConsultas(): Promise<Consulta[]> {
  // RLS enforces ownership — no extra filter needed
  const { data, error } = await supabase
    .from("consultas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Consulta[];
}

export async function criarSolicitacao(input: {
  tipo: "online" | "presencial";
  profissional_id?: string | null;
  obs?: string;
}): Promise<void> {
  const paciente_id = await getSessionUserId();
  if (!paciente_id) throw new Error("Usuário não autenticado");

  const { error } = await supabase.from("consultas").insert({
    paciente_id,
    tipo: input.tipo,
    profissional_id: input.profissional_id ?? null,
    obs: input.obs ?? null,
    // status defaults to 'solicitada' via DB default
  });

  if (error) throw error;
}

export async function getReceitas(): Promise<Receita[]> {
  // RLS enforces ownership
  const { data, error } = await supabase
    .from("receitas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Receita[];
}

export async function registrarHumor(valor: number): Promise<void> {
  const paciente_id = await getSessionUserId();
  if (!paciente_id) throw new Error("Usuário não autenticado");

  const dia = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { error } = await supabase.from("humor_registros").insert({
    paciente_id,
    valor,
    dia,
  });

  if (error) throw error;
}

export async function getHumoresUltima7Dias(): Promise<number[]> {
  // 7 posições: índice 0 = 6 dias atrás … índice 6 = hoje. 0 quando sem registro.
  const userId = await getSessionUserId();
  const out = [0, 0, 0, 0, 0, 0, 0];
  if (!userId) return out;

  const desde = new Date();
  desde.setDate(desde.getDate() - 6);
  const desdeStr = desde.toISOString().slice(0, 10); // YYYY-MM-DD
  const hojeStr = new Date().toISOString().slice(0, 10);

  // RLS já restringe ao próprio paciente; filtro por dia p/ a janela.
  const { data, error } = await supabase
    .from("humor_registros")
    .select("valor,dia,created_at")
    .gte("dia", desdeStr)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // base de comparação de datas em UTC (mesma base do dia gravado)
  const baseHoje = Date.parse(hojeStr + "T00:00:00Z");
  for (const r of (data ?? []) as Pick<HumorRegistro, "valor" | "dia">[]) {
    const diaMs = Date.parse(r.dia + "T00:00:00Z");
    const idx = 6 - Math.round((baseHoje - diaMs) / 86400000);
    if (idx >= 0 && idx <= 6) out[idx] = r.valor; // último registro do dia prevalece
  }
  return out;
}

export async function cancelarConsulta(consultaId: string): Promise<void> {
  // própria consulta — RLS consultas_own_update garante a posse.
  const { error } = await supabase
    .from("consultas")
    .update({ status: "cancelada" })
    .eq("id", consultaId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Atendimento virtual (vídeo) — room-token p/ a sala Jitsi da consulta
// ---------------------------------------------------------------------------

export async function getRoomToken(
  consultaId: string
): Promise<RoomTokenResponse> {
  // O JWT da sala é emitido SÓ no server (segredo server-side). O server valida
  // via service_role que o caller é o paciente OU o profissional DAQUELA
  // consulta. Manda o access_token do usuário logado p/ essa validação.
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Usuário não autenticado");

  const res = await fetch("/api/consulta/room-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ consulta_id: consultaId }),
  });

  if (!res.ok) {
    let msg = `Falha ao entrar na sala (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch {
      // resposta sem JSON — mantém msg padrão
    }
    throw new Error(msg);
  }

  return (await res.json()) as RoomTokenResponse;
}

/**
 * Notifica o paciente por WhatsApp que a consulta foi AGENDADA (confirmação).
 * Best-effort: chamado pelo admin/profissional logo após confirmar/definir a
 * agenda. O server valida (admin OU profissional DAQUELA consulta) e carrega o
 * telefone via service_role. Sem telefone NÃO é erro → { ok:false, skipped }.
 * Só lança em falha real de rede/servidor (5xx) p/ não travar o fluxo.
 */
export async function notificarConsulta(
  consultaId: string
): Promise<{ ok: boolean; skipped?: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Usuário não autenticado");

  const res = await fetch("/api/consulta/notificar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ consulta_id: consultaId }),
  });

  // 5xx = falha real (Evolution/servidor) → lança p/ o caller decidir.
  if (res.status >= 500) {
    let msg = `Falha ao notificar (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch {
      // resposta sem JSON — mantém msg padrão
    }
    throw new Error(msg);
  }

  // Demais respostas (200 ok / 200 skipped / 4xx) NÃO travam o fluxo:
  // devolvemos {ok:false} quando não foi possível notificar.
  try {
    const body = (await res.json()) as { ok?: boolean; skipped?: string };
    return { ok: Boolean(body?.ok), skipped: body?.skipped };
  } catch {
    return { ok: false, skipped: "sem resposta" };
  }
}

/**
 * Nota clínica assistida por IA: o PROFISSIONAL da consulta envia o que observou
 * (ditado local ou digitado) e o server (Gemini) devolve uma evolução estruturada.
 * É um rascunho a revisar — o profissional salva via profSalvarObsClinica.
 */
export async function gerarNotaIA(
  consultaId: string,
  texto: string
): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Usuário não autenticado");

  const res = await fetch("/api/consulta/nota-ia", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ consulta_id: consultaId, texto }),
  });

  if (!res.ok) {
    let msg = `Falha ao gerar a nota (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch {
      // resposta sem JSON — mantém msg padrão
    }
    throw new Error(msg);
  }

  return ((await res.json()) as { nota: string }).nota;
}

// ---------------------------------------------------------------------------
// Triagem clínica (autoavaliação PHQ-9 / GAD-7) — RLS é a dona do acesso
// ---------------------------------------------------------------------------
// DADO DE SAÚDE sensível. severidade/score são calculados no cliente pelo módulo
// PURO src/triagem/instrumentos.ts; aqui só persistimos e lemos sob RLS.

export async function criarTriagem(input: {
  instrumento: "phq9" | "gad7";
  respostas: number[];
  score: number;
  severidade: string;
  risco_ideacao: boolean;
}): Promise<void> {
  const paciente_id = await getSessionUserId();
  if (!paciente_id) throw new Error("Usuário não autenticado");

  const { error } = await supabase.from("triagens").insert({
    paciente_id,
    instrumento: input.instrumento,
    respostas: input.respostas,
    score: input.score,
    severidade: input.severidade,
    risco_ideacao: input.risco_ideacao,
  });

  if (error) throw error;
}

export async function getMinhasTriagens(): Promise<Triagem[]> {
  // RLS triagens_own_all restringe ao próprio paciente.
  const { data, error } = await supabase
    .from("triagens")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Triagem[];
}

export async function profTriagensPaciente(
  pacienteId: string
): Promise<Triagem[]> {
  // RLS triagens_prof_select já restringe às triagens de pacientes que têm
  // consulta com este profissional; o filtro recorta o paciente desejado.
  const { data, error } = await supabase
    .from("triagens")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Triagem[];
}

export async function adminListTriagens(): Promise<Triagem[]> {
  // RLS triagens_admin_select libera todas.
  const { data, error } = await supabase
    .from("triagens")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Triagem[];
}

// ---------------------------------------------------------------------------
// Admin functions
// ---------------------------------------------------------------------------

export async function adminListSolicitacoes(): Promise<Consulta[]> {
  const { data, error } = await supabase
    .from("consultas")
    .select("*")
    .eq("status", "solicitada")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Consulta[];
}

export async function adminConfirmarConsulta(
  id: string,
  dados: {
    profissional_id: string;
    data: string;
    hora: string;
    link_ou_local?: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from("consultas")
    .update({
      status: "agendada",
      profissional_id: dados.profissional_id,
      data: dados.data,
      hora: dados.hora,
      link_ou_local: dados.link_ou_local ?? null,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function adminMarcarRealizada(id: string): Promise<void> {
  const { error } = await supabase
    .from("consultas")
    .update({ status: "realizada" })
    .eq("id", id);

  if (error) throw error;
}

export async function adminLancarReceita(input: {
  consulta_id: string;
  paciente_id: string;
  profissional_id: string;
  resumo: string;
}): Promise<void> {
  const { error } = await supabase.from("receitas").insert({
    consulta_id: input.consulta_id,
    paciente_id: input.paciente_id,
    profissional_id: input.profissional_id,
    resumo: input.resumo,
  });

  if (error) throw error;
}

export async function adminCriarProfissional(input: {
  nome: string;
  especialidade?: string;
  registro?: string;
  bio?: string;
}): Promise<void> {
  const { error } = await supabase.from("profissionais").insert({
    nome: input.nome,
    especialidade: input.especialidade ?? null,
    registro: input.registro ?? null,
    bio: input.bio ?? null,
  });

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Professional functions (role='profissional'; RLS restricts to own rows)
// ---------------------------------------------------------------------------

export async function profMinhaFicha(): Promise<Profissional | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profissionais")
    .select("*")
    .eq("profile_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as Profissional) ?? null;
}

export async function profMinhaAgenda(): Promise<Consulta[]> {
  // RLS restricts to the professional's own consultas
  const { data, error } = await supabase
    .from("consultas")
    .select("*")
    .order("data", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Consulta[];
}

export async function profMarcarRealizada(consultaId: string): Promise<void> {
  const { error } = await supabase
    .from("consultas")
    .update({ status: "realizada" })
    .eq("id", consultaId);

  if (error) throw error;
}

export async function profDefinirAgenda(
  consultaId: string,
  dados: { data: string; hora: string; link_ou_local?: string }
): Promise<void> {
  // Ao agendar, o profissional ASSUME o atendimento: precisa setar
  // profissional_id com a própria ficha. Sem isso, pedidos pendentes nascem
  // com profissional_id=NULL e o WITH CHECK da RLS bloqueia o UPDATE.
  const ficha = await profMinhaFicha();
  if (!ficha) throw new Error("Profissional não encontrado");

  const { error } = await supabase
    .from("consultas")
    .update({
      status: "agendada",
      profissional_id: ficha.id,
      data: dados.data,
      hora: dados.hora,
      link_ou_local: dados.link_ou_local ?? null,
    })
    .eq("id", consultaId);

  if (error) throw error;
}

export async function profLancarReceita(input: {
  consulta_id: string;
  paciente_id: string;
  resumo: string;
}): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Usuário não autenticado");

  const ficha = await profMinhaFicha();
  if (!ficha) throw new Error("Profissional não encontrado");

  const { error } = await supabase.from("receitas").insert({
    consulta_id: input.consulta_id,
    paciente_id: input.paciente_id,
    profissional_id: ficha.id,
    resumo: input.resumo,
  });

  if (error) throw error;
}

export async function profAtualizarBio(bio: string): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Usuário não autenticado");

  const { error } = await supabase
    .from("profissionais")
    .update({ bio })
    .eq("profile_id", userId);

  if (error) throw error;
}

export async function profAtualizarFicha(dados: {
  bio?: string;
  especialidade?: string;
  registro?: string;
}): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Usuário não autenticado");

  const patch: Record<string, string> = {};
  if (dados.bio !== undefined) patch.bio = dados.bio;
  if (dados.especialidade !== undefined) patch.especialidade = dados.especialidade;
  if (dados.registro !== undefined) patch.registro = dados.registro;

  // RLS prof_self_update restringe à própria linha.
  const { error } = await supabase
    .from("profissionais")
    .update(patch)
    .eq("profile_id", userId);

  if (error) throw error;
}

export async function profCancelarConsulta(consultaId: string): Promise<void> {
  // consulta do profissional — RLS consultas_prof_update garante a posse.
  const { error } = await supabase
    .from("consultas")
    .update({ status: "cancelada" })
    .eq("id", consultaId);

  if (error) throw error;
}

export async function profSalvarObsClinica(
  consultaId: string,
  obs_profissional: string
): Promise<void> {
  // anotação clínica na consulta dele — RLS consultas_prof_update permite.
  const { error } = await supabase
    .from("consultas")
    .update({ obs_profissional })
    .eq("id", consultaId);

  if (error) throw error;
}

export async function profHistoricoPaciente(
  pacienteId: string
): Promise<{ consultas: Consulta[]; receitas: Receita[] }> {
  // RLS (consultas_prof_select / receitas_prof_select) já restringe ao que é do
  // profissional; o filtro por paciente_id apenas recorta o paciente desejado.
  const [cRes, rRes] = await Promise.all([
    supabase
      .from("consultas")
      .select("*")
      .eq("paciente_id", pacienteId)
      .order("created_at", { ascending: false }),
    supabase
      .from("receitas")
      .select("*")
      .eq("paciente_id", pacienteId)
      .order("created_at", { ascending: false }),
  ]);

  if (cRes.error) throw cRes.error;
  if (rRes.error) throw rRes.error;

  return {
    consultas: (cRes.data ?? []) as Consulta[],
    receitas: (rRes.data ?? []) as Receita[],
  };
}

// ---------------------------------------------------------------------------
// Common (professional/admin) — patient names
// ---------------------------------------------------------------------------

export async function getNomesPacientes(
  ids: string[]
): Promise<Record<string, string>> {
  if (!ids.length) return {};

  // RLS (profiles_prof_patient_read p/ prof; profiles_admin_all p/ admin)
  // decide o que volta; ids ausentes simplesmente não aparecem no mapa.
  const { data, error } = await supabase
    .from("profiles")
    .select("id,nome")
    .in("id", ids);

  if (error) throw error;

  const map: Record<string, string> = {};
  for (const p of (data ?? []) as { id: string; nome: string | null }[]) {
    map[p.id] = p.nome ?? "";
  }
  return map;
}

// ---------------------------------------------------------------------------
// AI conversation (patient) — RLS owner-only
// ---------------------------------------------------------------------------

export async function listConversas(): Promise<Conversa[]> {
  const { data, error } = await supabase
    .from("conversas")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Conversa[];
}

export async function criarConversa(titulo?: string): Promise<string> {
  const paciente_id = await getSessionUserId();
  if (!paciente_id) throw new Error("Usuário não autenticado");

  const { data, error } = await supabase
    .from("conversas")
    .insert({ paciente_id, titulo: titulo ?? null })
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: string }).id;
}

export async function getMensagens(conversaId: string): Promise<Mensagem[]> {
  const { data, error } = await supabase
    .from("mensagens")
    .select("*")
    .eq("conversa_id", conversaId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Mensagem[];
}

export async function salvarMensagem(
  conversaId: string,
  papel: "user" | "assistant",
  conteudo: string
): Promise<void> {
  const { error } = await supabase.from("mensagens").insert({
    conversa_id: conversaId,
    papel,
    conteudo,
  });

  if (error) throw error;

  // bump updated_at da conversa (RLS owner-only garante a posse)
  await supabase
    .from("conversas")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversaId);
}

// ---------------------------------------------------------------------------
// NPS (patient)
// ---------------------------------------------------------------------------

export async function enviarAvaliacao(
  consultaId: string,
  nota: number,
  comentario?: string
): Promise<void> {
  const paciente_id = await getSessionUserId();
  if (!paciente_id) throw new Error("Usuário não autenticado");

  const { error } = await supabase.from("avaliacoes").insert({
    consulta_id: consultaId,
    paciente_id,
    nota,
    comentario: comentario ?? null,
  });

  if (error) throw error;
}

export async function getAvaliacoes(): Promise<Avaliacao[]> {
  // RLS enforces ownership (paciente_id = auth.uid())
  const { data, error } = await supabase
    .from("avaliacoes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Avaliacao[];
}

// ---------------------------------------------------------------------------
// Metrics (admin) — RPC metrics_overview()
// ---------------------------------------------------------------------------

export async function getMetricsOverview(): Promise<MetricsOverview> {
  const { data, error } = await supabase.rpc("metrics_overview");

  if (error) throw error;
  return data as MetricsOverview;
}

// ---------------------------------------------------------------------------
// Admin — gestão geral (RLS admin libera tudo)
// ---------------------------------------------------------------------------

export async function adminListTodasConsultas(filtros?: {
  status?: StatusConsulta;
}): Promise<Consulta[]> {
  let q = supabase
    .from("consultas")
    .select("*")
    .order("created_at", { ascending: false });

  if (filtros?.status) q = q.eq("status", filtros.status);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Consulta[];
}

export async function adminCancelarConsulta(id: string): Promise<void> {
  const { error } = await supabase
    .from("consultas")
    .update({ status: "cancelada" })
    .eq("id", id);

  if (error) throw error;
}

export async function adminEditarProfissional(
  id: string,
  dados: Partial<{
    nome: string;
    especialidade: string | null;
    registro: string | null;
    bio: string | null;
    ativo: boolean;
  }>
): Promise<void> {
  const { error } = await supabase
    .from("profissionais")
    .update(dados)
    .eq("id", id);

  if (error) throw error;
}

export async function adminListProfissionais(
  incluirInativos = false
): Promise<Profissional[]> {
  let q = supabase.from("profissionais").select("*").order("nome", {
    ascending: true,
  });

  if (!incluirInativos) q = q.eq("ativo", true);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Profissional[];
}

export async function adminListPacientes(): Promise<Profile[]> {
  // RLS admin libera todos os profiles; filtra os pacientes.
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "paciente")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function adminListAvaliacoes(): Promise<Avaliacao[]> {
  // RLS admin (avaliacoes_admin_select) libera todas.
  const { data, error } = await supabase
    .from("avaliacoes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Avaliacao[];
}

export async function adminVincularProfissional(
  profissionalId: string,
  email: string
): Promise<void> {
  // O vínculo exige privilégio de admin no servidor (cria/acha o auth user e
  // promove o profile). Manda o access_token do usuário logado p/ o server
  // validar que é admin antes de usar service_role.
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Usuário não autenticado");

  const res = await fetch("/api/admin/profissional-link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ profissional_id: profissionalId, email }),
  });

  if (!res.ok) {
    let msg = `Falha ao vincular profissional (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch {
      // resposta sem JSON — mantém msg padrão
    }
    throw new Error(msg);
  }
}
