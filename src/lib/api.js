// Cliente do backend (mesma origem na Vercel; via proxy do Vite em dev).
const TOKEN_KEY = 'auto-post:token'
const USER_KEY = 'auto-post:username'

export const getToken = () => localStorage.getItem(TOKEN_KEY) || ''
export const getUsername = () => localStorage.getItem(USER_KEY) || ''

export function saveSession(token, username) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, username || '')
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function parse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
  return data
}

export async function login(username, password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await parse(res)
  saveSession(data.token, data.username)
  return data
}

export async function generate(payload) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(payload),
  })
  if (res.status === 401) {
    clearSession()
    throw new Error('Sessão expirada. Faça login de novo.')
  }
  const data = await parse(res)
  return data.spec
}
