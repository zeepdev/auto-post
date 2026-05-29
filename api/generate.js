import { cors, readJson, send, getBearer } from './_lib/http.js'
import { verifyToken } from './_lib/auth.js'
import { generateSpec } from './_lib/anthropic.js'

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' })

  const session = verifyToken(getBearer(req))
  if (!session) return send(res, 401, { error: 'Sessão expirada. Faça login de novo.' })

  const body = await readJson(req)
  try {
    const spec = await generateSpec(body)
    return send(res, 200, { spec })
  } catch (e) {
    return send(res, 502, { error: e.message || 'Falha ao gerar com a IA.' })
  }
}
