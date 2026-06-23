import { supabase } from "./supabase";
import { getSessionUserId } from "./auth";
import type {
  Profile,
  Profissional,
  Consulta,
  Receita,
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
