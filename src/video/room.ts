// Helpers puros p/ a sala de vídeo. Sem efeitos colaterais — testáveis.

// Nome da sala por consulta: "consulta-<id>" sanitizado p/ [a-z0-9-].
// Jitsi/prosody é sensível a caracteres especiais no nome da sala; o JWT
// emitido no server usa o MESMO nome (mesma função), então paciente e
// profissional sempre convergem na mesma sala.
export function roomName(consultaId: string): string {
  const safe = String(consultaId)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-") // troca tudo que não é [a-z0-9-] por '-'
    .replace(/-+/g, "-") // colapsa hífens repetidos
    .replace(/^-+|-+$/g, ""); // tira hífens das pontas
  return `consulta-${safe}`;
}

// Consulta de atendimento virtual?
export function isOnline(tipo: string): boolean {
  return tipo === "online";
}
