import React from "react";
import { Phone, X } from "lucide-react";
import { T, btnGhost } from "../conta/ui";

// O JitsiMeetExternalAPI é injetado por external_api.js (carregado dinamicamente).
// Tipamos como any: a API do Jitsi não tem types embutidos e não queremos dep nova.
declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

type Props = {
  domain: string;
  room: string;
  token: string;
  displayName: string;
  onSair: () => void;
};

// Carrega https://{domain}/external_api.js UMA vez (cache por domínio).
// Vários SalaVideo na mesma sessão reusam o mesmo <script>.
const scriptCache = new Map<string, Promise<void>>();

function loadExternalApi(domain: string): Promise<void> {
  if (typeof window !== "undefined" && window.JitsiMeetExternalAPI) {
    return Promise.resolve();
  }
  const cached = scriptCache.get(domain);
  if (cached) return cached;

  const p = new Promise<void>((resolve, reject) => {
    const src = `https://${domain}/external_api.js`;
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`
    );
    if (existing) {
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => {
        // Espelha o ramo de criação: limpa o cache p/ permitir nova tentativa
        // (senão a promise rejeitada fica presa e toda abertura futura falha).
        scriptCache.delete(domain);
        reject(new Error("Falha ao carregar a sala de vídeo."));
      });
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      scriptCache.delete(domain);
      reject(new Error("Falha ao carregar a sala de vídeo."));
    };
    document.body.appendChild(el);
  });

  scriptCache.set(domain, p);
  return p;
}

export default function SalaVideo({
  domain,
  room,
  token,
  displayName,
  onSair,
}: Props) {
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const apiRef = React.useRef<any>(null);
  const onSairRef = React.useRef(onSair);
  onSairRef.current = onSair;
  // displayName num ref: a sala usa o valor ATUAL na montagem, mas mudanças
  // posteriores (ficha do profissional carrega tarde) NÃO recriam a sala —
  // são aplicadas imperativamente (ver efeito abaixo). Sem isso, o moderador
  // era derrubado e reconectado no meio do atendimento.
  const displayNameRef = React.useRef(displayName);
  displayNameRef.current = displayName;

  const [loading, setLoading] = React.useState(true);
  const [erro, setErro] = React.useState<string>("");

  React.useEffect(() => {
    let cancelado = false;
    // Se a conferência não completar (JWT recusado pelo prosody, câmera/mic
    // negados, JVB inacessível), `videoConferenceJoined` nunca dispara e o
    // overlay opaco esconderia para sempre a UI de erro do Jitsi. Timeout de
    // segurança troca o estado para erro com opção de sair.
    let joinTimer: ReturnType<typeof setTimeout> | null = null;

    function falhar(msg: string) {
      if (cancelado) return;
      setErro(msg);
      setLoading(false);
    }

    loadExternalApi(domain)
      .then(() => {
        if (cancelado) return;
        if (!parentRef.current || !window.JitsiMeetExternalAPI) {
          falhar("Sala de vídeo indisponível no momento.");
          return;
        }
        const api = new window.JitsiMeetExternalAPI(domain, {
          roomName: room,
          jwt: token,
          parentNode: parentRef.current,
          userInfo: { displayName: displayNameRef.current },
          configOverwrite: {
            prejoinPageEnabled: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
          },
        });
        apiRef.current = api;

        joinTimer = setTimeout(() => {
          if (cancelado) return;
          // Só falha se ainda não entrou (loading ainda ligado).
          setLoading((stillLoading) => {
            if (stillLoading) {
              setErro(
                "Não foi possível conectar à sala. Verifique sua conexão e as permissões de câmera/microfone, e tente novamente."
              );
              return false;
            }
            return stillLoading;
          });
        }, 20000);

        api.addEventListener("videoConferenceJoined", () => {
          if (cancelado) return;
          if (joinTimer) {
            clearTimeout(joinTimer);
            joinTimer = null;
          }
          setLoading(false);
        });
        // Sinais de falha do Jitsi (nomes variam por versão; registramos os
        // conhecidos). Qualquer um troca o overlay para erro acionável.
        api.addEventListener("errorOccurred", () =>
          falhar("Erro na sala de vídeo. Tente novamente.")
        );
        api.addEventListener("connectionFailed", () =>
          falhar("Falha de conexão com a sala de vídeo. Tente novamente.")
        );
        api.addEventListener("conferenceError", () =>
          falhar("Erro na conferência. Tente novamente.")
        );
        api.addEventListener("readyToClose", () => {
          onSairRef.current();
        });
      })
      .catch((e: unknown) => {
        falhar(
          e instanceof Error ? e.message : "Erro ao iniciar a sala de vídeo."
        );
      });

    return () => {
      cancelado = true;
      if (joinTimer) {
        clearTimeout(joinTimer);
        joinTimer = null;
      }
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch {
          /* noop */
        }
        apiRef.current = null;
      }
    };
    // ⚠️ displayName NÃO entra nas deps: mudança de nome NÃO deve recriar a sala
    // (derrubaria o moderador no meio do atendimento). É aplicada via efeito
    // imperativo separado abaixo.
  }, [domain, room, token]);

  // Reflete mudança de nome (ex.: ficha do profissional carrega tarde) SEM
  // recriar a sala — usa a API imperativa do Jitsi.
  React.useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    try {
      api.executeCommand("displayName", displayName);
    } catch {
      /* noop */
    }
  }, [displayName]);

  function sair() {
    if (apiRef.current) {
      try {
        apiRef.current.dispose();
      } catch {
        /* noop */
      }
      apiRef.current = null;
    }
    onSair();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Atendimento virtual"
      style={overlay}
    >
      <style>{`@keyframes revivaz-spin{to{transform:rotate(360deg)}}`}</style>
      <header style={header}>
        <strong style={headerTitle}>Atendimento virtual</strong>
        <button
          type="button"
          onClick={sair}
          aria-label="Sair do atendimento"
          style={btnSair}
        >
          <X size={16} aria-hidden="true" />
          Sair
        </button>
      </header>

      <div style={stage}>
        <div ref={parentRef} style={jitsiHost} aria-busy={loading} />

        {loading && !erro && (
          <div style={statusOverlay} role="status" aria-live="polite">
            <div style={spinner} aria-hidden="true" />
            <span style={statusText}>Conectando à sala segura…</span>
          </div>
        )}

        {erro && (
          <div style={statusOverlay} role="alert">
            <span style={{ ...statusText, color: T.white, maxWidth: 320 }}>
              {erro}
            </span>
            <button type="button" onClick={sair} style={btnVoltar}>
              Voltar
            </button>
          </div>
        )}
      </div>

      <footer style={criseBar} aria-label="Telefones de emergência">
        <Phone size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
        <span style={criseText}>
          Em crise?{" "}
          <strong style={criseNum}>188</strong> CVV ·{" "}
          <strong style={criseNum}>192</strong> SAMU ·{" "}
          <strong style={criseNum}>136</strong> Saúde
        </span>
      </footer>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: T.teal900,
  display: "flex",
  flexDirection: "column",
  fontFamily: "'Nunito',sans-serif",
};

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 16px",
  background: "rgba(0,0,0,.2)",
  flexShrink: 0,
};

const headerTitle: React.CSSProperties = {
  color: T.white,
  fontWeight: 800,
  fontSize: 15,
};

const btnSair: React.CSSProperties = {
  ...btnGhost,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: T.red,
  color: T.white,
  borderRadius: 10,
  padding: "8px 14px",
  fontWeight: 700,
  fontSize: 13,
  minHeight: 40,
};

const stage: React.CSSProperties = {
  position: "relative",
  flex: 1,
  minHeight: 0,
  background: "#000",
};

const jitsiHost: React.CSSProperties = {
  width: "100%",
  height: "100%",
};

const statusOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
  background: T.teal900,
};

const spinner: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: `3px solid ${T.teal700}`,
  borderTopColor: T.teal300,
  animation: "revivaz-spin 0.8s linear infinite",
};

const statusText: React.CSSProperties = {
  color: T.teal100,
  fontWeight: 700,
  fontSize: 14,
  textAlign: "center",
};

const btnVoltar: React.CSSProperties = {
  background: T.teal500,
  color: T.white,
  border: "none",
  borderRadius: 12,
  padding: "10px 20px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "inherit",
  minHeight: 44,
};

const criseBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  background: T.navy,
  color: T.white,
  flexShrink: 0,
};

const criseText: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  lineHeight: 1.3,
};

const criseNum: React.CSSProperties = {
  color: T.teal300,
  fontWeight: 800,
};
