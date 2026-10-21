// Limitadores das rotas públicas (sem sessão), onde qualquer um bate.
import { criarRateLimiter } from "./rateLimit";

// Pedidos do site: 5 por IP a cada hora — não pode virar caixa de spam.
const leadLimiter = criarRateLimiter(5, 60 * 60 * 1000);
export const leadHits = leadLimiter.mapa;
export const isLeadRateLimited = leadLimiter.limitado;

// Pedido de acesso por e-mail: cada um dispara um e-mail de verdade. Por IP
// segura robô; por e-mail segura quem martela a caixa de outra pessoa.
const acessoIpLimiter = criarRateLimiter(10, 60 * 60 * 1000);
const acessoEmailLimiter = criarRateLimiter(3, 15 * 60 * 1000);
export const acessoHits = { ip: acessoIpLimiter.mapa, email: acessoEmailLimiter.mapa };
export const isAcessoIpLimitado = acessoIpLimiter.limitado;
export const isAcessoEmailLimitado = acessoEmailLimiter.limitado;
