import { useState } from 'react'
import { useStore } from '../store.js'
import { login } from '../lib/api.js'

export default function Login() {
  const setSession = useStore((s) => s.setSession)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await login(username.trim(), password)
      setSession(data.token, data.username)
    } catch (err) {
      setError(err.message || 'Falha no login.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <span className="logo" aria-hidden>◧</span>
          <strong>auto-post</strong>
          <small>Gerador de posts &amp; carrosséis</small>
        </div>

        <label className="fld">
          <span>Usuário</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
          />
        </label>
        <label className="fld">
          <span>Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && <div className="err">{error}</div>}

        <button className="btn primary block big" type="submit" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
