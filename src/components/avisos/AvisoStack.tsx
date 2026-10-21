import { memo, useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { empilhar, ouvirAvisos, remover, type Aviso } from "./aviso.logic";

/**
 * Pilha de avisos no canto superior direito. Mesma estrutura, comportamento e
 * medidas do EventoToastStack da NookTrack; só as cores são da Revivaz.
 */

const TOM_COR: Record<string, string> = {
  info: "#00BFD8",
  success: "#D6F4F8",
  // Magenta da marca (#B4157E) some no vidro escuro: clareado só aqui.
  danger: "#E0409F",
};

/** Some sozinho depois disto. */
const VIDA_MS = 12_000;

const FONTE = "'Nunito', system-ui, sans-serif";

export const AvisoStack = memo(function AvisoStack({ teto = 3 }: { teto?: number }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const fechar = useCallback((id: string) => {
    setAvisos((atuais) => remover(atuais, id));
  }, []);

  useEffect(() => ouvirAvisos((a) => setAvisos((atuais) => empilhar(atuais, a, teto))), [teto]);

  // Um timer por cartão, limpo no unmount.
  useEffect(() => {
    if (avisos.length === 0) return;
    const timers = avisos.map((a) => setTimeout(() => fechar(a.id), VIDA_MS));
    return () => timers.forEach(clearTimeout);
  }, [avisos, fechar]);

  return (
    <div
      // `none` no contêiner e `auto` no cartão: a área vazia não rouba clique.
      style={{
        position: "fixed", top: 12, right: 12, zIndex: 1000,
        display: "flex", flexDirection: "column", gap: 8,
        pointerEvents: "none", maxWidth: 320, width: "calc(100% - 24px)",
        alignItems: "flex-end",
      }}
      role="status"
      aria-live="polite"
    >
      {avisos.map((a) => {
        const cor = TOM_COR[a.tom] ?? TOM_COR.info;
        return (
          <div
            key={a.id}
            style={{
              pointerEvents: "auto",
              width: "100%",
              boxSizing: "border-box",
              borderRadius: "10px 10px 10px 18px",
              background: "rgba(11,29,58,0.86)",
              backdropFilter: "blur(12px) saturate(1.15)",
              WebkitBackdropFilter: "blur(12px) saturate(1.15)",
              border: `1px solid ${cor}55`,
              borderLeft: `3px solid ${cor}`,
              boxShadow: "0 8px 24px rgba(0,0,0,.45)",
              padding: "8px 10px",
              fontFamily: FONTE,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              {a.cadeado && (
                <img
                  src="/cadeado-revivaz.png"
                  alt=""
                  width={22}
                  style={{ flex: "none", marginTop: 1, filter: "drop-shadow(0 2px 3px rgba(0,0,0,.35))" }}
                />
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: cor, letterSpacing: ".08em", textTransform: "uppercase" }}>
                  {a.titulo}
                </div>
                {a.linha && (
                  <div style={{ fontSize: 10, color: "#fff", marginTop: 2, overflowWrap: "anywhere" }}>
                    {a.linha}
                  </div>
                )}
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.7)", marginTop: 2 }}>
                  {new Date(a.quando).toLocaleString("pt-BR")}
                </div>
              </div>
              <button
                type="button"
                aria-label="Fechar aviso"
                onClick={() => fechar(a.id)}
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.7)", cursor: "pointer", padding: 2, lineHeight: 0 }}
              >
                <X size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
});
