import React, { useCallback, useEffect, useState } from "react";
import { Activity, ChevronRight, Leaf } from "lucide-react";
import { T } from "./ui";
import {
  usuario as mockUsuario,
  consultas as mockConsultas,
  receitas as mockReceitas,
  humorSemana as mockHumor,
} from "./sampleData";
import type { ConsultaUI, ReceitaUI, UsuarioUI } from "./types";
import { useSession } from "./useSession";
import Login from "./Login";
import Header from "./sections/Header";
import ProximaConsulta from "./sections/ProximaConsulta";
import Atalhos from "./sections/Atalhos";
import ListaConsultas from "./sections/ListaConsultas";
import Receitas from "./sections/Receitas";
import ContinuarConversa from "./sections/ContinuarConversa";
import ChatIA from "./sections/ChatIA";
import Triagem from "./sections/Triagem";
import RegistroHumor from "./sections/RegistroHumor";
import AvaliarNPS from "./sections/AvaliarNPS";
import Perfil from "./sections/Perfil";
import ConsultaDetalhe from "./sections/ConsultaDetalhe";
import Autocuidado from "./sections/Autocuidado";
import CriseBar from "./CriseBar";
import SalaVideo from "../video/SalaVideo";
import { jitsiConfigured } from "../video/config";
import { supabaseConfigured } from "../lib/supabase";
import {
  getProfile,
  getConsultas,
  getReceitas,
  listProfissionais,
  listConversas,
  getAvaliacoes,
  criarSolicitacao,
  registrarHumor,
  getHumoresUltima7Dias,
  cancelarConsulta,
  getRoomToken,
} from "../lib/data";
import { sair } from "../lib/auth";
import type { Profissional, Conversa, Profile } from "../lib/types";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Derive initials from a display name, e.g. "Dra. Paula Lima" → "PL" */
function initials(nome: string): string {
  const parts = nome
    .replace(/^(Dr\.|Dra\.)\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function profById(
  id: string | null,
  profissionais: Profissional[]
): Profissional | undefined {
  return id ? profissionais.find((p) => p.id === id) : undefined;
}

/** Days between today and a future date, floored */
function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T00:00:00");
  return Math.max(0, Math.floor((target.getTime() - today.getTime()) / 86_400_000));
}

// ─── Triagem entry card ("Como você está? — autoavaliação") ──────────────────

function TriagemEntryCard({ onAbrir }: { onAbrir: () => void }) {
  return (
    <section style={{ padding: "0 16px" }}>
      <button
        type="button"
        onClick={onAbrir}
        style={{
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          background: T.teal050,
          border: `1px solid ${T.teal100}`,
          borderRadius: 16,
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 44,
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            flexShrink: 0,
            background: T.white,
            border: `1px solid ${T.teal100}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Activity size={24} color={T.teal700} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 15,
              color: T.teal900,
            }}
          >
            Como você está? (autoavaliação)
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: T.teal700,
              marginTop: 2,
              lineHeight: 1.35,
            }}
          >
            Responda em 2 minutos e entenda como anda seu ânimo e sua
            tranquilidade. Não é diagnóstico.
          </div>
        </div>
        <ChevronRight size={20} color={T.teal700} aria-hidden="true" />
      </button>
    </section>
  );
}

// ─── Autocuidado entry card ───────────────────────────────────────────────────

function AutocuidadoEntryCard({ onAbrir }: { onAbrir: () => void }) {
  return (
    <section style={{ padding: "0 16px" }}>
      <button
        type="button"
        onClick={onAbrir}
        style={{
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          background: "#f0fdf4",
          border: `1px solid ${T.teal100}`,
          borderRadius: 16,
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 44,
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            flexShrink: 0,
            background: T.white,
            border: `1px solid ${T.teal100}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Leaf size={24} color={T.teal700} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 15,
              color: T.teal900,
            }}
          >
            Autocuidado guiado
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: T.teal700,
              marginTop: 2,
              lineHeight: 1.35,
            }}
          >
            Respiração 4-7-8 e Grounding 5-4-3-2-1 — para acalmar em minutos.
          </div>
        </div>
        <ChevronRight size={20} color={T.teal700} aria-hidden="true" />
      </button>
    </section>
  );
}

// ─── layout wrapper (shared between demo + real modes) ──────────────────────

function AppShell({
  nome,
  profile,
  consultas,
  receitas,
  humores,
  conversas,
  demo = false,
  onAgendar,
  onRegistrarHumor,
  onSair,
  onEntrar,
  onCancelar,
}: {
  nome: string;
  profile?: Profile | null;
  consultas: ConsultaUI[];
  receitas: ReceitaUI[];
  humores: number[];
  conversas: Conversa[];
  demo?: boolean;
  onAgendar: () => void;
  onRegistrarHumor: (valor: number) => void;
  onSair: () => void;
  onEntrar: (c: ConsultaUI) => void;
  onCancelar: (c: ConsultaUI) => void;
}) {
  const [chatAberto, setChatAberto] = useState(false);
  const [triagemAberta, setTriagemAberta] = useState(false);
  const [autocuidadoAberto, setAutocuidadoAberto] = useState(false);
  const [detalheAberto, setDetalheAberto] = useState<ConsultaUI | null>(null);

  // Atendimento virtual (vídeo IN-APP). A sala só abre quando o Jitsi está
  // configurado E a consulta é online E está agendada; nesse caso buscamos o
  // room-token (JWT server-side) e montamos a <SalaVideo> fullscreen. Caso
  // contrário, caímos no comportamento atual (onEntrar → window.open do link).
  const [salaLoading, setSalaLoading] = useState<string | null>(null); // consultaId em loading
  const [sala, setSala] = useState<{
    domain: string;
    room: string;
    token: string;
  } | null>(null);

  function isSalaInApp(c: ConsultaUI): boolean {
    // Demo não tem backend p/ emitir o room-token → nunca abre sala in-app.
    return (
      !demo && jitsiConfigured && c.tipo === "online" && c.status === "agendada"
    );
  }

  async function handleEntrarSala(c: ConsultaUI) {
    // Degrade com elegância: sem Jitsi (ou consulta não-online/não-agendada)
    // mantém o fluxo legado (link externo / alert no demo).
    if (!isSalaInApp(c)) {
      onEntrar(c);
      return;
    }
    if (salaLoading) return; // evita duplo clique
    setSalaLoading(c.id);
    try {
      const { domain, room, token } = await getRoomToken(c.id);
      setSala({ domain, room, token });
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Não foi possível entrar na sala. Tente novamente."
      );
    } finally {
      setSalaLoading(null);
    }
  }

  const proximaConsulta = consultas.find((c) => c.status === "agendada");
  const consultaNPS = consultas.find(
    (c) => c.status === "realizada" && !c.avaliada
  );

  // prefs may be untyped jsonb on the real profile — read defensively, mock fallback
  const prefs = (profile?.prefs ?? {}) as {
    lembretes?: boolean;
    modalidade?: "online" | "presencial";
  };

  const usuario: UsuarioUI = {
    nome,
    emergenciaNome:
      profile?.emergencia_nome ?? mockUsuario.emergenciaNome,
    emergenciaTel:
      profile?.emergencia_tel ?? mockUsuario.emergenciaTel,
    preferencias: {
      lembretes:
        typeof prefs.lembretes === "boolean"
          ? prefs.lembretes
          : mockUsuario.preferencias.lembretes,
      modalidade:
        prefs.modalidade === "online" || prefs.modalidade === "presencial"
          ? prefs.modalidade
          : mockUsuario.preferencias.modalidade,
    },
  };

  return (
    <div
      style={{
        background: T.gray050,
        minHeight: "100vh",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 80,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {chatAberto ? (
          <ChatIA demo={demo} onFechar={() => setChatAberto(false)} />
        ) : triagemAberta ? (
          <Triagem
            demo={demo}
            onFechar={() => setTriagemAberta(false)}
            onAgendar={() => {
              setTriagemAberta(false);
              onAgendar();
            }}
          />
        ) : autocuidadoAberto ? (
          <Autocuidado onFechar={() => setAutocuidadoAberto(false)} />
        ) : (
          <>
            <Header nome={nome} />
            <ProximaConsulta
              consulta={proximaConsulta}
              onAgendar={onAgendar}
              onEntrar={handleEntrarSala}
              onCancelar={onCancelar}
              onVerDetalhe={(c) => setDetalheAberto(c)}
              salaInApp={isSalaInApp}
              salaLoadingId={salaLoading}
            />
            <TriagemEntryCard onAbrir={() => setTriagemAberta(true)} />
            <AutocuidadoEntryCard onAbrir={() => setAutocuidadoAberto(true)} />
            <Atalhos />
            <ListaConsultas
              consultas={consultas}
              onEntrar={handleEntrarSala}
              onCancelar={onCancelar}
              onVerDetalhe={(c) => setDetalheAberto(c)}
              salaInApp={isSalaInApp}
              salaLoadingId={salaLoading}
            />
            <Receitas receitas={receitas} />
            <ContinuarConversa
              conversas={conversas}
              onAbrir={() => setChatAberto(true)}
            />
            <RegistroHumor semana={humores} onRegistrar={onRegistrarHumor} />
            <AvaliarNPS consulta={consultaNPS} />
            <Perfil usuario={usuario} onSair={onSair} />
          </>
        )}
      </div>
      <ConsultaDetalhe
        consulta={detalheAberto}
        onFechar={() => setDetalheAberto(null)}
        onEntrar={(c) => {
          // Fecha o detalhe e abre a sala (ou cai no fluxo legado via handleEntrarSala)
          setDetalheAberto(null);
          void handleEntrarSala(c);
        }}
        salaInApp={isSalaInApp}
        salaLoadingId={salaLoading}
      />
      {sala && (
        <SalaVideo
          domain={sala.domain}
          room={sala.room}
          token={sala.token}
          displayName={nome}
          onSair={() => setSala(null)}
        />
      )}
      <CriseBar />
    </div>
  );
}

// ─── Demo mode (no Supabase) ─────────────────────────────────────────────────

function DemoApp() {
  const mockConsultasUI: ConsultaUI[] = mockConsultas.map((c) => ({
    ...c,
    status: c.status as ConsultaUI["status"],
  }));

  const mockReceitasUI: ReceitaUI[] = mockReceitas.map((r) => ({
    id: r.id,
    profissional: r.profissional,
    data: r.data,
    resumo: r.resumo,
  }));

  return (
    <>
      {/* Demo banner */}
      <div
        role="status"
        style={{
          background: "#FFF8E1",
          border: "1px solid #F59E0B",
          borderRadius: 0,
          padding: "10px 16px",
          fontFamily: "'Nunito',sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: "#92400E",
          textAlign: "center",
        }}
      >
        Ambiente sem backend configurado (modo demonstração)
      </div>
      <AppShell
        nome={mockUsuario.nome}
        profile={null}
        consultas={mockConsultasUI}
        receitas={mockReceitasUI}
        humores={mockHumor}
        conversas={[]}
        demo
        onAgendar={() => alert("Modo demonstração — configure o backend.")}
        onRegistrarHumor={() => {}}
        onSair={() => alert("Modo demonstração — não há sessão ativa.")}
        onEntrar={() =>
          alert("Modo demonstração — entrar na consulta indisponível.")
        }
        onCancelar={() =>
          alert("Modo demonstração — cancelamento indisponível.")
        }
      />
    </>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div
      role="status"
      aria-label="Carregando sua conta…"
      style={{
        background: T.gray050,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Nunito',sans-serif",
      }}
    >
      <div style={{ textAlign: "center", color: T.gray600 }}>
        <div
          aria-hidden="true"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `3px solid ${T.teal100}`,
            borderTopColor: T.teal700,
            margin: "0 auto 16px",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: T.teal700 }}>
          Carregando…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ─── Authenticated data loader ───────────────────────────────────────────────

function AuthenticatedApp({ userId }: { userId: string }) {
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [nome, setNome] = useState<string>("Você");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [consultas, setConsultas] = useState<ConsultaUI[]>([]);
  const [receitas, setReceitas] = useState<ReceitaUI[]>([]);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [humores, setHumores] = useState<number[]>(Array(7).fill(0));

  const loadData = useCallback(async () => {
    try {
      const [
        profile,
        rawConsultas,
        rawReceitas,
        profissionais,
        rawConversas,
        avaliacoes,
        humores7,
      ] = await Promise.all([
        getProfile(),
        getConsultas(),
        getReceitas(),
        listProfissionais(),
        listConversas(),
        getAvaliacoes(),
        getHumoresUltima7Dias(),
      ]);

      setNome(profile?.nome ?? "Você");
      setProfile(profile ?? null);
      setHumores(humores7);

        // Set of consulta ids that already have an avaliação
        const avaliadas = new Set(avaliacoes.map((a) => a.consulta_id));

        // Map consultas to ConsultaUI
        const consultasUI: ConsultaUI[] = rawConsultas.map((c) => {
          const prof = profById(c.profissional_id, profissionais);
          const profNome = prof?.nome ?? "Profissional a definir";
          const esp = prof?.especialidade ?? "";
          const dataStr = c.data ?? new Date().toISOString().slice(0, 10);
          const horaStr = c.hora ?? "--:--";
          const days =
            c.status === "agendada" ? daysUntil(dataStr) : undefined;

          return {
            id: c.id,
            profissional: profNome,
            especialidade: esp,
            avatar: initials(profNome),
            data: dataStr,
            hora: horaStr,
            tipo: c.tipo,
            status: c.status,
            emDias: days,
            avaliada: avaliadas.has(c.id),
            link: c.link_ou_local ?? null,
            obs: c.obs ?? null,
          };
        });

        // Map receitas to ReceitaUI
        const receitasUI: ReceitaUI[] = rawReceitas.map((r) => {
          const prof = profById(r.profissional_id, profissionais);
          const profNome = prof?.nome ?? "Profissional";
          return {
            id: r.id,
            profissional: profNome,
            data: r.created_at.slice(0, 10),
            resumo: r.resumo,
          };
        });

        setConsultas(consultasUI);
        setReceitas(receitasUI);
        setConversas(rawConversas);
      } catch (err) {
        setDataError(
          err instanceof Error ? err.message : "Erro ao carregar dados."
        );
      } finally {
        setDataLoading(false);
      }
    }, [userId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (dataLoading) return <LoadingState />;

  if (dataError) {
    return (
      <div
        role="alert"
        style={{
          background: T.gray050,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "'Nunito',sans-serif",
        }}
      >
        <div
          style={{
            background: T.white,
            borderRadius: 16,
            padding: 24,
            maxWidth: 400,
            textAlign: "center",
            border: `1px solid ${T.gray200}`,
            boxShadow: "0 2px 12px rgba(0,0,0,.06)",
          }}
        >
          <p
            style={{
              fontWeight: 800,
              fontSize: 16,
              color: T.gray950,
              margin: "0 0 8px",
            }}
          >
            Não foi possível carregar sua conta
          </p>
          <p
            style={{
              fontWeight: 500,
              fontSize: 14,
              color: T.gray600,
              margin: "0 0 16px",
              lineHeight: 1.5,
            }}
          >
            {dataError}
          </p>
          <button
            style={{
              background: T.teal700,
              color: T.white,
              border: "none",
              borderRadius: 12,
              padding: "10px 20px",
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  async function handleAgendar() {
    try {
      await criarSolicitacao({ tipo: "online" });
      alert(
        "Solicitação enviada! Um profissional entrará em contato para confirmar o horário."
      );
      // Re-fetch to show the new solicitation (granular, sem recarregar a página)
      await loadData();
    } catch {
      alert("Não foi possível enviar a solicitação. Tente novamente.");
    }
  }

  async function handleRegistrarHumor(valor: number) {
    try {
      await registrarHumor(valor);
    } catch {
      // Silently fail — humor register is non-critical
    }
  }

  async function handleSair() {
    await sair();
    // After signing out, onAuthChange will fire → useSession → ContaApp re-renders → Login
  }

  function handleEntrar(c: ConsultaUI) {
    if (c.link) {
      window.open(c.link, "_blank", "noopener,noreferrer");
    } else {
      alert("O link da consulta ainda não foi definido pelo profissional.");
    }
  }

  async function handleCancelar(c: ConsultaUI) {
    const ok = window.confirm(
      `Deseja realmente cancelar a consulta com ${c.profissional}?`
    );
    if (!ok) return;
    try {
      await cancelarConsulta(c.id);
      // Re-fetch para refletir o status cancelado em todas as seções
      await loadData();
    } catch {
      alert("Não foi possível cancelar a consulta. Tente novamente.");
    }
  }

  return (
    <AppShell
      nome={nome}
      profile={profile}
      consultas={consultas}
      receitas={receitas}
      humores={humores}
      conversas={conversas}
      onAgendar={handleAgendar}
      onRegistrarHumor={handleRegistrarHumor}
      onSair={handleSair}
      onEntrar={handleEntrar}
      onCancelar={handleCancelar}
    />
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function ContaApp() {
  const { userId, loading } = useSession();

  // No Supabase configured → demo mode (dev/build always works)
  if (!supabaseConfigured) {
    return <DemoApp />;
  }

  if (loading) return <LoadingState />;

  if (!userId) return <Login />;

  return <AuthenticatedApp userId={userId} />;
}
