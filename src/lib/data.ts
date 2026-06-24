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
  const { error } = await supabase
    .from("consultas")
    .update({
      status: "agendada",
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
