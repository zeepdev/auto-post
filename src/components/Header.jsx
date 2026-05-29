import { useState } from 'react'
import { useStore } from '../store.js'
import { downloadSlide, downloadAll } from '../lib/exporter.js'

export default function Header() {
  const format = useStore((s) => s.format)
  const slides = useStore((s) => s.slides)
  const currentIndex = useStore((s) => s.currentIndex)
  const reset = useStore((s) => s.reset)
  const username = useStore((s) => s.username)
  const logout = useStore((s) => s.logout)
  const [mime, setMime] = useState('image/png')
  const [busy, setBusy] = useState(false)

  const single = async () => {
    setBusy(true)
    try {
      await downloadSlide(slides[currentIndex], format, mime, currentIndex)
    } finally {
      setBusy(false)
    }
  }

  const all = async () => {
    setBusy(true)
    try {
      await downloadAll(slides, format, mime)
    } finally {
      setBusy(false)
    }
  }

  return (
    <header className="header">
      <div className="brand">
        <span className="logo" aria-hidden>◧</span>
        <div>
          <strong>auto-post</strong>
          <small>Gerador de posts & carrosséis</small>
        </div>
      </div>

      <div className="header-actions">
        <div className="seg">
          <button
            className={mime === 'image/png' ? 'on' : ''}
            onClick={() => setMime('image/png')}
          >
            PNG
          </button>
          <button
            className={mime === 'image/jpeg' ? 'on' : ''}
            onClick={() => setMime('image/jpeg')}
          >
            JPG
          </button>
        </div>
        <button className="btn ghost" onClick={reset} title="Começar do zero">
          Novo
        </button>
        <button className="btn" onClick={single} disabled={busy}>
          ⬇ Baixar slide
        </button>
        <button className="btn primary" onClick={all} disabled={busy}>
          {busy ? 'Gerando…' : `⬇ Baixar tudo (${slides.length})`}
        </button>
        {username && (
          <button className="btn ghost" onClick={logout} title={`Sair (${username})`}>
            Sair
          </button>
        )}
      </div>
    </header>
  )
}
