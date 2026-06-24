import React, { useEffect, useState, useCallback } from "react";
import {
  User,
  Stethoscope,
  BadgeCheck,
  FileText,
  Save,
  Check,
  AlertCircle,
} from "lucide-react";
import { T, card, sectionTitle, btnPrimary } from "../../conta/ui";
import { profMinhaFicha, profAtualizarFicha } from "../../lib/data";
import type { Profissional } from "../../lib/types";

/* ─── estilos de campo (alinhados ao AgendarForm da Agenda) ─── */
const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${T.gray200}`,
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "'Nunito',sans-serif",
  color: T.gray950,
  background: T.white,
  minHeight: 44,
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 700,
  fontSize: 12,
  color: T.gray700,
  marginBottom: 4,
};

/* ─── spinner (padrão das áreas protegidas) ─── */
function Spinner(): JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ display: "flex", justifyContent: "center", padding: "40px 16px" }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: `3px solid ${T.teal100}`,
          borderTopColor: T.teal700,
          animation: "revivaz-spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes revivaz-spin{to{transform:rotate(360deg)}}`}</style>
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        Carregando ficha…
      </span>
    </div>
  );
}

/* ─── componente principal ─── */
export default function MeuPerfil(): JSX.Element {
  const [ficha, setFicha] = useState<Profissional | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState<string | null>(null);

  // campos editáveis
  const [especialidade, setEspecialidade] = useState("");
  const [registro, setRegistro] = useState("");
  const [bio, setBio] = useState("");

  // estado de salvamento
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroCarregar(null);
    try {
      const f = await profMinhaFicha();
      setFicha(f);
      if (f) {
        setEspecialidade(f.especialidade ?? "");
        setRegistro(f.registro ?? "");
        setBio(f.bio ?? "");
      }
    } catch (e) {
      setErroCarregar(
        e instanceof Error ? e.message : "Não foi possível carregar seu perfil."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const handleSalvar = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSalvando(true);
      setErroSalvar(null);
      setSalvo(false);
      try {
        await profAtualizarFicha({
          especialidade: especialidade.trim(),
          registro: registro.trim(),
          bio: bio.trim(),
        });
        setSalvo(true);
        // reflete os valores normalizados localmente
        setFicha((prev) =>
          prev
            ? {
                ...prev,
                especialidade: especialidade.trim() || null,
                registro: registro.trim() || null,
                bio: bio.trim() || null,
              }
            : prev
        );
      } catch (err) {
        setErroSalvar(
          err instanceof Error ? err.message : "Não foi possível salvar as alterações."
        );
      } finally {
        setSalvando(false);
      }
    },
    [especialidade, registro, bio]
  );

  // limpa o "salvo" assim que o profissional volta a editar
  function aoEditar<T>(setter: (v: T) => void) {
    return (v: T) => {
      if (salvo) setSalvo(false);
      setter(v);
    };
  }

  if (carregando) {
    return <Spinner />;
  }

  if (erroCarregar) {
    return (
      <div
        role="alert"
        style={{
          ...card,
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          borderColor: T.red,
        }}
      >
        <AlertCircle
          size={18}
          color={T.red}
          strokeWidth={2.5}
          aria-hidden="true"
          style={{ flexShrink: 0, marginTop: 1 }}
        />
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: T.gray950,
            }}
          >
            Não foi possível carregar seu perfil
          </p>
          <p
            style={{
              margin: "4px 0 12px",
              fontFamily: "'Nunito',sans-serif",
              fontSize: 13,
              color: T.gray600,
            }}
          >
            {erroCarregar}
          </p>
          <button
            onClick={() => void carregar()}
            style={{ ...btnPrimary, padding: "8px 16px", fontSize: 13, minHeight: 38 }}
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  if (!ficha) {
    return (
      <div
        role="status"
        style={{
          ...card,
          textAlign: "center",
          padding: "32px 16px",
          color: T.gray600,
          fontFamily: "'Nunito',sans-serif",
          fontSize: 14,
        }}
      >
        Sua ficha de profissional ainda não foi criada. Fale com um administrador
        para vincular seu cadastro.
      </div>
    );
  }

  return (
    <div>
      <h3 style={sectionTitle}>Meu perfil</h3>

      <form onSubmit={handleSalvar} style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Nome — somente leitura */}
        <div>
          <span style={labelStyle}>
            <User size={13} color={T.teal500} strokeWidth={2.5} aria-hidden="true" />
            Nome
          </span>
          <div
            style={{
              ...inputStyle,
              background: T.gray050,
              color: T.gray700,
              display: "flex",
              alignItems: "center",
              cursor: "default",
            }}
            aria-readonly="true"
          >
            {ficha.nome || "—"}
          </div>
          <p
            style={{
              margin: "4px 0 0",
              fontFamily: "'Nunito',sans-serif",
              fontSize: 11,
              color: T.gray600,
            }}
          >
            O nome é gerenciado pela administração.
          </p>
        </div>

        {/* Especialidade */}
        <div>
          <label style={labelStyle} htmlFor="prof-especialidade">
            <Stethoscope size={13} color={T.teal500} strokeWidth={2.5} aria-hidden="true" />
            Especialidade
          </label>
          <input
            id="prof-especialidade"
            type="text"
            value={especialidade}
            onChange={(e) => aoEditar(setEspecialidade)(e.target.value)}
            placeholder="Ex.: Psicologia clínica"
            style={inputStyle}
            disabled={salvando}
          />
        </div>

        {/* Registro */}
        <div>
          <label style={labelStyle} htmlFor="prof-registro">
            <BadgeCheck size={13} color={T.teal500} strokeWidth={2.5} aria-hidden="true" />
            Registro profissional
          </label>
          <input
            id="prof-registro"
            type="text"
            value={registro}
            onChange={(e) => aoEditar(setRegistro)(e.target.value)}
            placeholder="Ex.: CRP 00/00000"
            style={inputStyle}
            disabled={salvando}
          />
        </div>

        {/* Bio */}
        <div>
          <label style={labelStyle} htmlFor="prof-bio">
            <FileText size={13} color={T.teal500} strokeWidth={2.5} aria-hidden="true" />
            Sobre você
          </label>
          <textarea
            id="prof-bio"
            value={bio}
            onChange={(e) => aoEditar(setBio)(e.target.value)}
            placeholder="Conte um pouco sobre sua abordagem e experiência…"
            rows={5}
            style={{
              ...inputStyle,
              minHeight: 110,
              resize: "vertical",
              lineHeight: 1.5,
              paddingTop: 10,
            }}
            disabled={salvando}
          />
        </div>

        {/* feedback de erro */}
        {erroSalvar && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'Nunito',sans-serif",
              fontSize: 13,
              color: T.red,
            }}
          >
            <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" style={{ flexShrink: 0 }} />
            {erroSalvar}
          </div>
        )}

        {/* ações */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {salvo && !salvando && (
            <span
              role="status"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontFamily: "'Nunito',sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: T.green500,
              }}
            >
              <Check size={15} strokeWidth={2.5} aria-hidden="true" />
              Alterações salvas
            </span>
          )}
          <button
            type="submit"
            disabled={salvando}
            style={{
              ...btnPrimary,
              padding: "10px 18px",
              fontSize: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              opacity: salvando ? 0.6 : 1,
              cursor: salvando ? "default" : "pointer",
            }}
          >
            <Save size={16} strokeWidth={2.5} aria-hidden="true" />
            {salvando ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
