import React, { useEffect, useState } from "react";
import { T } from "./ui";
import {
  usuario as mockUsuario,
  consultas as mockConsultas,
  receitas as mockReceitas,
  sessoesIA,
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
import RegistroHumor from "./sections/RegistroHumor";
import AvaliarNPS from "./sections/AvaliarNPS";
import Perfil from "./sections/Perfil";
import CriseBar from "./CriseBar";
import { supabaseConfigured } from "../lib/supabase";
import {
  getProfile,
  getConsultas,
  getReceitas,
  listProfissionais,
  criarSolicitacao,
  registrarHumor,
} from "../lib/data";
import { sair } from "../lib/auth";
import type { Profissional } from "../lib/types";

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

// ─── layout wrapper (shared between demo + real modes) ──────────────────────

function AppShell({
  nome,
  consultas,
  receitas,
  humores,
  onAgendar,
  onRegistrarHumor,
  onSair,
}: {
  nome: string;
  consultas: ConsultaUI[];
  receitas: ReceitaUI[];
  humores: number[];
  onAgendar: () => void;
  onRegistrarHumor: (valor: number) => void;
  onSair: () => void;
}) {
  const proximaConsulta = consultas.find((c) => c.status === "agendada");
  const consultaNPS = consultas.find(
    (c) => c.status === "realizada" && !c.avaliada
  );

  const usuario: UsuarioUI = {
    nome,
    emergenciaNome: mockUsuario.emergenciaNome,
    emergenciaTel: mockUsuario.emergenciaTel,
    preferencias: mockUsuario.preferencias,
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
        <Header nome={nome} />
        <ProximaConsulta consulta={proximaConsulta} onAgendar={onAgendar} />
        <Atalhos />
        <ListaConsultas consultas={consultas} />
        <Receitas receitas={receitas} />
        <ContinuarConversa sessoes={sessoesIA} />
        <RegistroHumor semana={humores} onRegistrar={onRegistrarHumor} />
        <AvaliarNPS consulta={consultaNPS} />
        <Perfil usuario={usuario} onSair={onSair} />
      </div>
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
        consultas={mockConsultasUI}
        receitas={mockReceitasUI}
        humores={mockHumor}
        onAgendar={() => alert("Modo demonstração — configure o backend.")}
        onRegistrarHumor={() => {}}
        onSair={() => alert("Modo demonstração — não há sessão ativa.")}
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
  const [consultas, setConsultas] = useState<ConsultaUI[]>([]);
  const [receitas, setReceitas] = useState<ReceitaUI[]>([]);
  const [humores] = useState<number[]>(Array(7).fill(0));

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [profile, rawConsultas, rawReceitas, profissionais] = await Promise.all([
          getProfile(),
          getConsultas(),
          getReceitas(),
          listProfissionais(),
        ]);

        if (!mounted) return;

        setNome(profile?.nome ?? "Você");

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
            avaliada: undefined,
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
      } catch (err) {
        if (mounted) {
          setDataError(
            err instanceof Error ? err.message : "Erro ao carregar dados."
          );
        }
      } finally {
        if (mounted) setDataLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [userId]);

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
      // Reload page to show new solicitation
      window.location.reload();
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

  return (
    <AppShell
      nome={nome}
      consultas={consultas}
      receitas={receitas}
      humores={humores}
      onAgendar={handleAgendar}
      onRegistrarHumor={handleRegistrarHumor}
      onSair={handleSair}
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
