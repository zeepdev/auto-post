import { useEffect, useMemo, useState } from 'react'

// Buscador da biblioteca Material Design Icons (~7.400 ícones).
// O pacote @mdi/js é carregado SOB DEMANDA (dynamic import) só quando este modal
// abre, pra não pesar o carregamento inicial do site.
export default function IconLibrary({ onPick, onClose }) {
  const [all, setAll] = useState(null) // [{name, label, path}]
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    import('@mdi/js').then((mod) => {
      if (!alive) return
      const list = Object.entries(mod)
        .filter(([k]) => k.startsWith('mdi') && typeof mod[k] === 'string')
        .map(([k, path]) => ({
          name: k,
          label: k
            .slice(3)
            .replace(/([A-Z0-9])/g, ' $1')
            .trim()
            .toLowerCase(),
          path,
        }))
      setAll(list)
    })
    return () => {
      alive = false
    }
  }, [])

  const results = useMemo(() => {
    if (!all) return []
    const q = query.trim().toLowerCase()
    const base = q ? all.filter((i) => i.label.includes(q)) : all
    return base.slice(0, 300)
  }, [all, query])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Biblioteca de ícones {all && <small>({all.length})</small>}</h3>
          <button className="btn ghost" onClick={onClose}>✕</button>
        </div>
        <input
          className="key-input"
          placeholder="Buscar (em inglês): check, home, phone, star, gear…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {!all && <p className="hint">Carregando biblioteca…</p>}
        {all && (
          <>
            <div className="icon-grid lib">
              {results.map((i) => (
                <button
                  key={i.name}
                  className="icon-cell"
                  title={i.label}
                  onClick={() => {
                    onPick(i.name, i.path)
                    onClose()
                  }}
                >
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path d={i.path} fill="currentColor" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="hint">
              {query
                ? `${results.length} resultado(s)${results.length >= 300 ? '+ (refine a busca)' : ''}`
                : 'Digite pra buscar entre milhares de ícones.'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
