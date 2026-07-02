/**
 * Middleware de autenticação Supabase reutilizável.
 *
 * Uso padrão (rota protegida):
 *   const requireAuth = makeRequireAuth(SUPABASE_URL, SUPABASE_ANON_KEY);
 *   app.post('/rota', requireAuth, async (req, res) => {
 *     const uid = res.locals.uid as string; // uid validado
 *   });
 *
 * Uso opcional (não-bloqueante):
 *   const uid = await getCallerUid(req, SUPABASE_URL, SUPABASE_ANON_KEY);
 *   if (!uid) { ... }
 */
import { Request, Response, NextFunction } from 'express'

/**
 * Cria um middleware Express que:
 * 1. Extrai o Bearer token do header Authorization.
 * 2. Valida o token chamando GET /auth/v1/user no Supabase (anon key).
 * 3. Seta res.locals.uid com o uuid do usuário autenticado e chama next().
 * 4. Em caso de token ausente/inválido → 401; erro interno → 500.
 */
export function makeRequireAuth(supabaseUrl: string, supabaseAnonKey: string) {
  return async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (!supabaseUrl || !supabaseAnonKey) {
      res.status(500).json({ error: 'Auth not configured' })
      return
    }

    const authHeader = String(req.headers['authorization'] ?? '')
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : ''

    if (!token) {
      res.status(401).json({ error: 'Não autenticado' })
      return
    }

    try {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${token}`,
        },
      })
      if (!userRes.ok) {
        res.status(401).json({ error: 'Sessão inválida' })
        return
      }
      const u = (await userRes.json()) as { id?: string }
      if (!u.id) {
        res.status(401).json({ error: 'Sessão inválida' })
        return
      }
      res.locals.uid = u.id
      next()
    } catch (err) {
      console.error('[auth] Erro ao validar token:', err)
      res.status(500).json({ error: 'Erro interno de autenticação' })
    }
  }
}

/**
 * Helper não-bloqueante: extrai Bearer de req, valida no Supabase e retorna
 * o uid do usuário ou null se ausente/inválido. Nunca lança.
 * Útil em rotas onde a autenticação é opcional ou quando você quer checar
 * manualmente sem usar o middleware.
 */
export async function getCallerUid(
  req: Request,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<string | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null

  const authHeader = String(req.headers['authorization'] ?? '')
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : ''

  if (!token) return null

  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
    })
    if (!userRes.ok) return null
    const u = (await userRes.json()) as { id?: string }
    return u.id ?? null
  } catch {
    return null
  }
}
