import { cors, readJson, send } from './_lib/http.js'
import { checkCredentials, createToken, getUsers } from './_lib/auth.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' })
  if (!getUsers().length)
    return send(res, 500, { error: 'Servidor sem usuários configurados (defina AUTH_USERS).' })

  const { username, password } = await readJson(req)
  if (!username || !password) return send(res, 400, { error: 'Informe usuário e senha.' })
  if (!checkCredentials(username, password))
    return send(res, 401, { error: 'Usuário ou senha inválidos.' })

  return send(res, 200, { token: createToken(username), username })
}
