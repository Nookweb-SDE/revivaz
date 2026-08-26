import React, { useEffect, useState } from "react";
import { useSession } from "../conta/useSession";
import { getProfile } from "../lib/data";
import { sair } from "../lib/auth";
import type { Profile } from "../lib/types";
import { T, btnPrimary, btnGhost } from "../conta/ui";
import { Solicitacoes } from "./sections/Solicitacoes";
import { Profissionais } from "./sections/Profissionais";
import PedidosSite from "./sections/PedidosSite";
import Pacientes from "./sections/Pacientes";
import { Metricas } from "./sections/Metricas";

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

// A seção <Solicitacoes/> agora lista TODAS as consultas — só a label visível
// muda para "Consultas"; o componente continua sendo o mesmo.
const TABS = ["Consultas", "Pedidos do site", "Profissionais", "Pacientes", "Métricas"] as const;
type Tab = (typeof TABS)[number];

const baseStyle: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  minHeight: "100vh",
  background: "#F0FAFB",
  color: T.gray950,
  margin: 0,
  padding: 0,
};

const headerStyle: React.CSSProperties = {
  background: T.teal900,
  color: T.white,
  padding: "0 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: 60,
  position: "sticky",
  top: 0,
  zIndex: 100,
};

const logoStyle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 18,
  letterSpacing: "-0.02em",
  color: T.white,
};

const tabBarStyle: React.CSSProperties = {
  background: T.white,
  borderBottom: `1px solid ${T.teal100}`,
  display: "flex",
  padding: "0 24px",
  gap: 0,
};

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "14px 20px",
    fontWeight: active ? 800 : 600,
    fontSize: 14,
    color: active ? T.teal700 : T.gray600,
    background: "none",
    border: "none",
    borderBottom: active ? `3px solid ${T.teal500}` : "3px solid transparent",
    cursor: "pointer",
    fontFamily: "'Nunito', sans-serif",
    transition: "color 0.15s",
    marginBottom: -1,
  };
}

const contentStyle: React.CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
  padding: "28px 20px 60px",
};

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "'Nunito',sans-serif",
        color: T.teal700,
        fontSize: 15,
      }}
    >
      Carregando…
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gate messages
// ---------------------------------------------------------------------------

function Gate({ message }: { message: string }) {
  return (
    <div
      style={{
        ...baseStyle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          background: T.white,
          borderRadius: 16,
          padding: "40px 32px",
          boxShadow: "0 2px 20px rgba(0,0,0,.07)",
          textAlign: "center",
          maxWidth: 360,
        }}
      >
        <p
          style={{
            fontSize: 32,
            margin: "0 0 12px",
          }}
        >
          🔒
        </p>
        <p
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: T.gray950,
            margin: "0 0 8px",
            fontFamily: "'Nunito',sans-serif",
          }}
        >
          {message}
        </p>
        <a
          href="/conta"
          style={{
            ...btnPrimary,
            display: "inline-block",
            marginTop: 16,
            textDecoration: "none",
          }}
        >
          Ir para /conta
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminApp
// ---------------------------------------------------------------------------

export function AdminApp() {
  const { userId, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErro, setProfileErro] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Consultas");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    setProfileErro(null);
    getProfile()
      .then((p) => setProfile(p))
      .catch((err) => {
        setProfileErro(
          err instanceof Error ? err.message : "Erro ao carregar perfil."
        );
      })
      .finally(() => setProfileLoading(false));
  }, [userId]);

  // Loading states
  if (sessionLoading || profileLoading) {
    return <Spinner />;
  }

  // Not authenticated
  if (!userId) {
    return <Gate message="Entre pelo /conta para acessar o painel admin." />;
  }

  // Profile error
  if (profileErro) {
    return (
      <div
        style={{
          ...baseStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: T.red, fontFamily: "'Nunito',sans-serif" }}>
          {profileErro}
        </p>
      </div>
    );
  }

  // Wrong role
  if (!profile || profile.role !== "admin") {
    return (
      <Gate message="Acesso restrito. Apenas administradores podem acessar esta área." />
    );
  }

  // Admin UI
  async function handleSair() {
    setSigningOut(true);
    await sair();
    window.location.href = "/conta";
  }

  return (
    <div style={baseStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <span style={logoStyle}>Revivaz Admin</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.75)",
              fontFamily: "'Nunito',sans-serif",
            }}
          >
            {profile.nome ?? userId.slice(0, 8)}
          </span>
          <button
            style={{
              ...btnGhost,
              color: "rgba(255,255,255,0.9)",
              fontSize: 13,
              fontWeight: 600,
            }}
            onClick={handleSair}
            disabled={signingOut}
          >
            {signingOut ? "Saindo…" : "Sair"}
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav style={tabBarStyle} aria-label="Abas do painel admin">
        {TABS.map((tab) => (
          <button
            key={tab}
            style={tabStyle(activeTab === tab)}
            onClick={() => setActiveTab(tab)}
            aria-selected={activeTab === tab}
            role="tab"
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={contentStyle}>
        {activeTab === "Consultas" && <Solicitacoes />}
        {activeTab === "Pedidos do site" && <PedidosSite />}
        {activeTab === "Profissionais" && <Profissionais />}
        {activeTab === "Pacientes" && <Pacientes />}
        {activeTab === "Métricas" && <Metricas />}
      </main>
    </div>
  );
}
