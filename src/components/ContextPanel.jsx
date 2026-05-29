import { useRef, useState } from 'react'
import { useStore, buildIdentity } from '../store.js'
import { fileToDataURL, downscaleDataURL } from '../lib/colors.js'
import { generate } from '../lib/api.js'
import { specToSlides } from '../lib/layoutEngine.js'

export default function ContextPanel() {
  const format = useStore((s) => s.format)
  const palette = useStore((s) => s.palette)
  const logos = useStore((s) => s.logos)
  const packages = useStore((s) => s.packages)
  const applyGenerated = useStore((s) => s.applyGenerated)
  const logout = useStore((s) => s.logout)

  const [text, setText] = useState('')
  const [images, setImages] = useState([]) // {src, name}
  const [mode, setMode] = useState('carousel')
  const [pages, setPages] = useState(5)
  const [logoId, setLogoId] = useState('')
  const [pkgId, setPkgId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const onFiles = async (e) => {
    const files = [...e.target.files]
    const added = []
    for (const f of files) {
      if (f.type.startsWith('image/')) {
        added.push({ src: await fileToDataURL(f), name: f.name })
      } else if (f.type.startsWith('text/') || /\.(txt|md|csv)$/i.test(f.name)) {
        const content = await f.text()
        setText((t) => `${t}\n\n[${f.name}]\n${content}`.trim())
      } else {
        setError(`"${f.name}": só aceito imagem ou texto (.txt/.md). PDF ainda não.`)
      }
    }
    if (added.length) setImages((prev) => [...prev, ...added])
    e.target.value = ''
  }

  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i))

  const handleGenerate = async () => {
    setError('')
    if (!text.trim() && !images.length) {
      setError('Dê algum contexto: escreva um briefing, suba uma imagem ou documento.')
      return
    }
    const pkg = packages.find((p) => p.id === pkgId)
    setBusy(true)
    try {
      // reduz as imagens antes de enviar pro backend (limite de payload)
      const raw = [...images.map((i) => i.src), ...(pkg?.images || [])].slice(0, 8)
      const ctxImages = []
      for (const src of raw) ctxImages.push(await downscaleDataURL(src))

      const spec = await generate({
        contextText: text,
        images: ctxImages,
        mode,
        pages,
        palette: pkg?.palette?.length ? pkg.palette : palette,
      })
      const logo = logos.find((l) => l.id === logoId) || null
      const slides = specToSlides(spec, format, logo)
      applyGenerated(slides, spec.identity || buildIdentity(pkg?.palette || palette))
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ia-tab">
      <section className="section">
        <h3>Contexto</h3>
        <textarea
          className="ctx-text"
          rows={5}
          placeholder="Briefing: tema do post, oferta, público, tom de voz, o que destacar…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn block" onClick={() => fileRef.current.click()}>
          ＋ Anexar foto / documento
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.txt,.md,.csv,text/*"
          multiple
          hidden
          onChange={onFiles}
        />
        {images.length > 0 && (
          <div className="ref-grid">
            {images.map((img, i) => (
              <div key={i} className="ref-cell">
                <img src={img.src} alt={img.name} className="ref-thumb" />
                <button className="ref-x" onClick={() => removeImage(i)} title="Remover">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {packages.length > 0 && (
          <label className="fld" style={{ marginTop: 12 }}>
            <span>Usar pacote de referência</span>
            <select value={pkgId} onChange={(e) => setPkgId(e.target.value)}>
              <option value="">Nenhum</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.images.length} img)
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      <section className="section">
        <h3>Formato de saída</h3>
        <div className="seg full">
          <button className={mode === 'post' ? 'on' : ''} onClick={() => setMode('post')}>
            Post único
          </button>
          <button className={mode === 'carousel' ? 'on' : ''} onClick={() => setMode('carousel')}>
            Carrossel
          </button>
        </div>
        {mode === 'carousel' && (
          <label className="fld" style={{ marginTop: 12 }}>
            <span>
              Páginas <em>{pages}</em>
            </span>
            <input
              type="range"
              min={2}
              max={10}
              value={pages}
              onChange={(e) => setPages(Number(e.target.value))}
            />
          </label>
        )}
      </section>

      <section className="section">
        <h3>Logo na arte</h3>
        {logos.length === 0 ? (
          <p className="hint">Nenhum logo salvo. Adicione na aba Design → Logo &amp; Identidade.</p>
        ) : (
          <select value={logoId} onChange={(e) => setLogoId(e.target.value)} className="logo-select">
            <option value="">Sem logo</option>
            {logos.map((l, i) => (
              <option key={l.id} value={l.id}>
                Logo {i + 1}
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="section">
        {error && <div className="err">{error}</div>}
        <button className="btn primary block big" onClick={handleGenerate} disabled={busy}>
          {busy ? '🪄 Gerando com a Claude…' : '🪄 Gerar com IA'}
        </button>
        <p className="hint">
          A chave da IA fica no servidor — você não precisa colar nada. Isso substitui os slides
          atuais pelo resultado.
        </p>
        {error?.includes('Sessão') && (
          <button className="btn block" onClick={logout} style={{ marginTop: 8 }}>
            Fazer login de novo
          </button>
        )}
      </section>
    </div>
  )
}
