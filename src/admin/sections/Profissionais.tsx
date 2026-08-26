import React, { useEffect, useState } from "react";
import {
  adminCriarProfissional,
  adminListProfissionais,
  adminEditarProfissional,
  adminVincularProfissional,
} from "../../lib/data";
import type { Profissional } from "../../lib/types";
import { T, card, sectionTitle, btnPrimary, btnGhost } from "../../conta/ui";
import {
  Pencil,
  Power,
  PowerOff,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Save,
  X,
} from "lucide-react";

import { ESPECIALIDADES } from "../../lib/especialidades";

/* Sugestões do catálogo. Fica como <datalist> e não <select> porque a coluna é
   texto livre: profissional cadastrado antes, ou com especialidade fora da
   lista, não pode ser bloqueado na edição. */
const LISTA_ESP_ID = "catalogo-especialidades";

function DatalistEspecialidades(): JSX.Element {
  return (
    <datalist id={LISTA_ESP_ID}>
      {ESPECIALIDADES.map((e) => (
        <option key={e.valor} value={e.label} />
      ))}
    </datalist>
  );
}

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
  outline: "2px solid transparent", // foco visível vem da regra :focus-visible global
};

const iconBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: T.gray050,
  color: T.teal700,
  border: `1px solid ${T.gray200}`,
  borderRadius: 10,
  padding: "7px 12px",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "'Nunito',sans-serif",
  minHeight: 36,
};

// ---------------------------------------------------------------------------
// Create Form
// ---------------------------------------------------------------------------

function CriarProfissionalForm({ onDone }: { onDone: () => void }) {
  const uid = React.useId();
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
        <label style={label} htmlFor={`${uid}-nome`}>Nome *</label>
        <input
          id={`${uid}-nome`}
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Dr. Ana Beatriz Silva"
          style={inputStyle}
          required
        />
      </div>
      <div>
        <label style={label} htmlFor={`${uid}-esp`}>Especialidade</label>
        <input
          id={`${uid}-esp`}
          type="text"
          value={especialidade}
          onChange={(e) => setEspecialidade(e.target.value)}
          placeholder="Psicologia clínica"
          list={LISTA_ESP_ID}
          style={inputStyle}
        />
        <DatalistEspecialidades />
      </div>
      <div>
        <label style={label} htmlFor={`${uid}-reg`}>Registro (CRP / CRM)</label>
        <input
          id={`${uid}-reg`}
          type="text"
          value={registro}
          onChange={(e) => setRegistro(e.target.value)}
          placeholder="CRP 06/12345"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={label} htmlFor={`${uid}-bio`}>Bio</label>
        <textarea
          id={`${uid}-bio`}
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
// Edit Form (inline) — nome/especialidade/registro/bio
// ---------------------------------------------------------------------------

function EditarProfissionalForm({
  profissional,
  onDone,
  onCancel,
}: {
  profissional: Profissional;
  onDone: () => void;
  onCancel: () => void;
}) {
  const uid = React.useId();
  const [nome, setNome] = useState(profissional.nome);
  const [especialidade, setEspecialidade] = useState(
    profissional.especialidade ?? ""
  );
  const [registro, setRegistro] = useState(profissional.registro ?? "");
  const [bio, setBio] = useState(profissional.bio ?? "");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("Nome é obrigatório.");
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      await adminEditarProfissional(profissional.id, {
        nome: nome.trim(),
        especialidade: especialidade.trim() || null,
        registro: registro.trim() || null,
        bio: bio.trim() || null,
      });
      onDone();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div>
        <label style={label} htmlFor={`${uid}-nome`}>Nome *</label>
        <input
          id={`${uid}-nome`}
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={inputStyle}
          required
        />
      </div>
      <div>
        <label style={label} htmlFor={`${uid}-esp`}>Especialidade</label>
        <input
          id={`${uid}-esp`}
          type="text"
          value={especialidade}
          onChange={(e) => setEspecialidade(e.target.value)}
          list={LISTA_ESP_ID}
          style={inputStyle}
        />
        <DatalistEspecialidades />
      </div>
      <div>
        <label style={label} htmlFor={`${uid}-reg`}>Registro (CRP / CRM)</label>
        <input
          id={`${uid}-reg`}
          type="text"
          value={registro}
          onChange={(e) => setRegistro(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div>
        <label style={label} htmlFor={`${uid}-bio`}>Bio</label>
        <textarea
          id={`${uid}-bio`}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {erro && <p style={{ color: T.red, fontSize: 12, margin: 0 }}>{erro}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          style={{ ...btnPrimary, padding: "10px 18px" }}
          disabled={loading}
        >
          <Save size={15} style={{ marginRight: 6, verticalAlign: "-3px" }} />
          {loading ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          style={{ ...btnGhost, alignSelf: "center" }}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Vincular Login (inline) — pede e-mail e chama o endpoint server
// ---------------------------------------------------------------------------

function VincularLoginForm({
  profissional,
  onDone,
  onCancel,
}: {
  profissional: Profissional;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErro("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      await adminVincularProfissional(profissional.id, trimmed);
      onDone();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao vincular login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        background: T.teal050,
        border: `1px solid ${T.teal300}`,
      }}
    >
      <label style={label}>E-mail de login do profissional</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="profissional@exemplo.com"
        style={inputStyle}
        autoFocus
      />
      <p style={{ margin: 0, fontSize: 11, color: T.gray600, fontFamily: "'Nunito',sans-serif" }}>
        Cria/encontra o login e dá a este profissional acesso ao painel dele.
      </p>

      {erro && <p style={{ color: T.red, fontSize: 12, margin: 0 }}>{erro}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          style={{ ...btnPrimary, padding: "9px 16px" }}
          disabled={loading}
        >
          {loading ? "Vinculando…" : "Vincular"}
        </button>
        <button
          type="button"
          style={{ ...btnGhost, alignSelf: "center" }}
          onClick={onCancel}
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

function ProfissionalCard({
  profissional,
  onChanged,
}: {
  profissional: Profissional;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [acaoErro, setAcaoErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const temLogin = !!profissional.profile_id;

  async function toggleAtivo() {
    setToggling(true);
    setAcaoErro(null);
    setSucesso(null);
    try {
      await adminEditarProfissional(profissional.id, {
        ativo: !profissional.ativo,
      });
      onChanged();
    } catch (err) {
      setAcaoErro(
        err instanceof Error ? err.message : "Erro ao alterar status."
      );
    } finally {
      setToggling(false);
    }
  }

  if (editing) {
    return (
      <div style={{ ...card, marginBottom: 12, border: `1.5px solid ${T.teal300}` }}>
        <h3 style={{ ...sectionTitle, margin: "0 0 12px" }}>Editar profissional</h3>
        <EditarProfissionalForm
          profissional={profissional}
          onDone={() => {
            setEditing(false);
            onChanged();
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div style={{ ...card, marginBottom: 12, opacity: profissional.ativo ? 1 : 0.72 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
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

      {/* Status do login */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 12,
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "'Nunito',sans-serif",
          color: temLogin ? T.teal700 : T.gray600,
        }}
      >
        {temLogin ? (
          <>
            <CheckCircle2 size={15} />
            Login vinculado
          </>
        ) : (
          <>
            <XCircle size={15} />
            Sem login
          </>
        )}
      </div>

      {/* Ações */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 12,
          paddingTop: 12,
          borderTop: `1px solid ${T.gray100}`,
        }}
      >
        <button
          style={iconBtn}
          onClick={() => {
            setEditing(true);
            setAcaoErro(null);
            setSucesso(null);
          }}
        >
          <Pencil size={14} />
          Editar
        </button>

        <button
          style={{
            ...iconBtn,
            color: profissional.ativo ? T.red : T.green500,
          }}
          onClick={toggleAtivo}
          disabled={toggling}
        >
          {profissional.ativo ? <PowerOff size={14} /> : <Power size={14} />}
          {toggling
            ? "…"
            : profissional.ativo
            ? "Desativar"
            : "Reativar"}
        </button>

        {!vinculando && (
          <button
            style={iconBtn}
            onClick={() => {
              setVinculando(true);
              setAcaoErro(null);
              setSucesso(null);
            }}
          >
            <LinkIcon size={14} />
            {temLogin ? "Trocar login" : "Vincular login"}
          </button>
        )}
      </div>

      {acaoErro && (
        <p style={{ color: T.red, fontSize: 12, margin: "10px 0 0" }}>
          {acaoErro}
        </p>
      )}
      {sucesso && (
        <p
          style={{
            color: T.green500,
            fontSize: 12,
            margin: "10px 0 0",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <CheckCircle2 size={14} />
          {sucesso}
        </p>
      )}

      {vinculando && (
        <VincularLoginForm
          profissional={profissional}
          onDone={() => {
            setVinculando(false);
            setSucesso("Login vinculado com sucesso.");
            onChanged();
          }}
          onCancel={() => setVinculando(false)}
        />
      )}
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
  const [incluirInativos, setIncluirInativos] = useState(false);

  async function load(incluir = incluirInativos) {
    setLoading(true);
    setErro(null);
    try {
      const data = await adminListProfissionais(incluir);
      setProfissionais(data);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(incluirInativos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incluirInativos]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <h2 style={{ ...sectionTitle, fontSize: 18, margin: 0 }}>
          Profissionais{!loading && ` (${profissionais.length})`}
        </h2>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            color: T.gray600,
            fontFamily: "'Nunito',sans-serif",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={incluirInativos}
            onChange={(e) => setIncluirInativos(e.target.checked)}
            style={{ accentColor: T.teal700, width: 16, height: 16 }}
          />
          Mostrar inativos
        </label>
      </div>

      <CriarProfissionalForm onDone={() => load(incluirInativos)} />

      {loading ? (
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
      ) : erro ? (
        <div
          style={{ color: T.red, padding: 20, fontFamily: "'Nunito',sans-serif" }}
        >
          {erro}{" "}
          <button style={btnGhost} onClick={() => load(incluirInativos)}>
            Tentar novamente
          </button>
        </div>
      ) : profissionais.length === 0 ? (
        <div
          style={{
            ...card,
            textAlign: "center",
            padding: 40,
            color: T.gray600,
            fontFamily: "'Nunito',sans-serif",
          }}
        >
          {incluirInativos
            ? "Nenhum profissional cadastrado ainda."
            : "Nenhum profissional ativo. Marque “Mostrar inativos” para ver todos."}
        </div>
      ) : (
        profissionais.map((p) => (
          <ProfissionalCard
            key={p.id}
            profissional={p}
            onChanged={() => load(incluirInativos)}
          />
        ))
      )}
    </div>
  );
}
