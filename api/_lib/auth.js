import crypto from 'node:crypto'

// Autenticação sem banco de dados: credenciais vêm de variáveis de ambiente e a
// sessão é um token stateless assinado com HMAC (não precisa armazenar nada).

const SECRET = process.env.AUTH_SECRET || 'troque-este-segredo-em-producao'

// AUTH_USERS = "usuario:senha,outro:senha2"  (ou AUTH_USERNAME + AUTH_PASSWORD)
export function getUsers() {
  const raw = process.env.AUTH_USERS
  if (raw) {
    return raw
      .split(',')
      .map((s) => {
        const i = s.indexOf(':')
        return i < 0 ? null : { user: s.slice(0, i).trim(), pass: s.slice(i + 1) }
      })
      .filter((u) => u && u.user)
  }
  if (process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD) {
    return [{ user: process.env.AUTH_USERNAME, pass: process.env.AUTH_PASSWORD }]
  }
  return []
}

function timingSafeEq(a, b) {
  const ab = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

export function checkCredentials(user, pass) {
  return getUsers().some((u) => timingSafeEq(u.user, user) && timingSafeEq(u.pass, pass))
}

function sign(body) {
  return crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
}

export function createToken(username, ttlSec = 60 * 60 * 12) {
  const payload = { u: username, exp: Math.floor(Date.now() / 1000) + ttlSec }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = sign(body)
  if (!timingSafeEq(sig, expected)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
