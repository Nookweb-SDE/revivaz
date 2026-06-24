// Config pública do Jitsi (front). O DOMÍNIO é público (build-arg);
// o segredo do JWT NUNCA vem pro front — fica só no server.
//
// jitsiConfigured controla o "degrade com elegância": sem VITE_JITSI_DOMAIN,
// o app cai no comportamento atual (abre link_ou_local externo).
export const JITSI_DOMAIN: string =
  (import.meta.env.VITE_JITSI_DOMAIN as string) || "";

export const jitsiConfigured: boolean = Boolean(JITSI_DOMAIN);
