// Limitadores das rotas públicas (sem sessão), onde qualquer um bate.
import { criarRateLimiter } from "./rateLimit";

// Pedidos do site: 5 por IP a cada hora — não pode virar caixa de spam.
const leadLimiter = criarRateLimiter(5, 60 * 60 * 1000);
export const leadHits = leadLimiter.mapa;
export const isLeadRateLimited = leadLimiter.limitado;
