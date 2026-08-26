// Estado do OTP de login por WhatsApp. Em memória de propósito: uma réplica só,
// código vive minutos, e perder tudo num restart é o comportamento desejado.
import { criarRateLimiter } from "./rateLimit";

export interface OtpEntry {
  code: string;
  attempts: number;
  expiresAt: number;
}

export const otpStore = new Map<string, OtpEntry>();

// 3 pedidos de código por telefone a cada 10 minutos.
const startLimiter = criarRateLimiter(3, 10 * 60 * 1000);
export const startRateMap = startLimiter.mapa;
export const isStartRateLimited = startLimiter.limitado;
