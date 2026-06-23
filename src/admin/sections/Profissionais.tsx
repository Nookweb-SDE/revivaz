import React, { useEffect, useState } from "react";
import { listProfissionais, adminCriarProfissional } from "../../lib/data";
import type { Profissional } from "../../lib/types";
import { T, card, sectionTitle, btnPrimary, btnGhost } from "../../conta/ui";

const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: T.gray600,
  marginBottom: 4,
  fontFamily: "'Nunito',sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1.5px solid ${T.gray200}`,
  fontSize: 14,
  fontFamily: "'Nunito',sans-serif",
  color: T.gray950,
  boxSizing: "border-box",
  outline: "none",
};

// ---------------------------------------------------------------------------
// Create Form
// ---------------------------------------------------------------------------

function CriarProfissionalForm({ onDone }: { onDone: () => void }) {
  const [nome, setNome] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [registro, setRegistro] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("Nome é obrigatório.");
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      await adminCriarProfissional({
        nome,
        especialidade: especialidade || undefined,
        registro: registro || undefined,
        bio: bio || undefined,
      });
      setNome("");
      setEspecialidade("");
      setRegistro("");
      setBio("");
      setOpen(false);
      onDone();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar profissional.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        style={{ ...btnPrimary, marginBottom: 20 }}
        onClick={() => setOpen(true)}
      >
        + Cadastrar profissional
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{
        ...card,
        marginBottom: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        background: T.teal050,
        border: `1.5px solid ${T.teal300}`,
      }}
    >
      <h3 style={{ ...sectionTitle, margin: 0 }}>Novo profissional</h3>

      <div>
        <label style={label}>Nome *</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Dr. Ana Beatriz Silva"
          style={inputStyle}
          required
        />
      </div>
      <div>
        <label style={label}>Especialidade</label>
        <input
          type="text"
          value={especialidade}
          onChange={(e) => setEspecialidade(e.target.value)}
          placeholder="Psicologia Clínica"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={label}>Registro (CRP / CRM)</label>
        <input
          type="text"
          value={registro}
          onChange={(e) => setRegistro(e.target.value)}
          placeholder="CRP 06/12345"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={label}>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Breve apresentação do profissional…"
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {erro && (
        <p style={{ color: T.red, fontSize: 12, margin: 0 }}>{erro}</p>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          style={{ ...btnPrimary, padding: "10px 18px" }}
          disabled={loading}
        >
          {loading ? "Salvando…" : "Cadastrar"}
        </button>
        <button
          type="button"
          style={{ ...btnGhost, alignSelf: "center" }}
          onClick={() => setOpen(false)}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Profissional Card
// ---------------------------------------------------------------------------

function ProfissionalCard({ profissional }: { profissional: Profissional }) {
  return (
    <div style={{ ...card, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <p
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: 15,
              color: T.gray950,
              fontFamily: "'Nunito',sans-serif",
            }}
          >
            {profissional.nome}
          </p>
          {profissional.especialidade && (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 13,
                color: T.teal700,
                fontFamily: "'Nunito',sans-serif",
                fontWeight: 600,
              }}
            >
              {profissional.especialidade}
            </p>
          )}
          {profissional.registro && (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 12,
                color: T.gray600,
                fontFamily: "'Nunito',sans-serif",
              }}
            >
              {profissional.registro}
            </p>
          )}
          {profissional.bio && (
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                color: T.gray700,
                fontFamily: "'Nunito',sans-serif",
                lineHeight: 1.5,
              }}
            >
              {profissional.bio}
            </p>
          )}
        </div>
        <span
          style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            background: profissional.ativo ? "#D1FAE5" : T.gray200,
            color: profissional.ativo ? "#065F46" : T.gray600,
            fontFamily: "'Nunito',sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          {profissional.ativo ? "Ativo" : "Inativo"}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profissionais Section
// ---------------------------------------------------------------------------

export function Profissionais() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErro(null);
    try {
      const data = await listProfissionais();
      setProfissionais(data);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 40,
          color: T.gray600,
          fontFamily: "'Nunito',sans-serif",
        }}
      >
        Carregando profissionais…
      </div>
    );
  }

  if (erro) {
    return (
      <div style={{ color: T.red, padding: 20, fontFamily: "'Nunito',sans-serif" }}>
        {erro}{" "}
        <button style={btnGhost} onClick={load}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ ...sectionTitle, fontSize: 18, marginBottom: 16 }}>
        Profissionais ({profissionais.length})
      </h2>

      <CriarProfissionalForm onDone={load} />

      {profissionais.length === 0 ? (
        <div
          style={{
            ...card,
            textAlign: "center",
            padding: 40,
            color: T.gray600,
            fontFamily: "'Nunito',sans-serif",
          }}
        >
          Nenhum profissional cadastrado ainda.
        </div>
      ) : (
        profissionais.map((p) => <ProfissionalCard key={p.id} profissional={p} />)
      )}
    </div>
  );
}
