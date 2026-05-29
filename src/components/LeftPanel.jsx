import { useRef, useState } from 'react'
import { useStore, FORMATS } from '../store.js'
import { fileToDataURL, extractPalette, readableTextColor, loadImage } from '../lib/colors.js'
import { getStageSize } from '../lib/stage.js'
import { TEMPLATES } from '../lib/templates.js'
import { ICONS, ICON_LIST } from '../lib/icons.js'
import ContextPanel from './ContextPanel.jsx'

export default function LeftPanel() {
  const [tab, setTab] = useState('design')

  return (
    <aside className="panel left">
      <div className="tabs">
        <button className={tab === 'design' ? 'on' : ''} onClick={() => setTab('design')}>
          Design
        </button>
        <button className={tab === 'ia' ? 'on' : ''} onClick={() => setTab('ia')}>
          🪄 IA / Contexto
        </button>
      </div>
      {tab === 'design' ? <DesignTab /> : <ContextPanel />}
    </aside>
  )
}

function DesignTab() {
  const format = useStore((s) => s.format)
  const setFormat = useStore((s) => s.setFormat)
  const palette = useStore((s) => s.palette)
  const setPalette = useStore((s) => s.setPalette)
  const setBackground = useStore((s) => s.setBackground)
  const addImage = useStore((s) => s.addImage)
  const applyTemplate = useStore((s) => s.applyTemplate)
  const brandColors = useStore((s) => s.brandColors)
  const slide = useStore((s) => s.slides[s.currentIndex])
  const tplPalette = brandColors.length ? brandColors : palette

  const refInput = useRef(null)
  const imgInput = useRef(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [refs, setRefs] = useState([])

  const onReference = async (e) => {
    const files = [...e.target.files]
    if (!files.length) return
    setAnalyzing(true)
    try {
      let merged = []
      const newRefs = []
      for (const f of files) {
        const src = await fileToDataURL(f)
        newRefs.push(src)
        merged = [...merged, ...(await extractPalette(src, 6))]
      }
      setRefs((prev) => [...newRefs, ...prev].slice(0, 8))
      const seen = new Set()
      setPalette(merged.filter((c) => (seen.has(c) ? false : seen.add(c))).slice(0, 8))
    } finally {
      setAnalyzing(false)
      e.target.value = ''
    }
  }

  const onAddImage = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const src = await fileToDataURL(f)
    const img = await loadImage(src)
    addImage(src, img.width, img.height)
    e.target.value = ''
  }

  return (
    <>
      <Section title="Formato">
        <div className="format-list">
          {Object.values(FORMATS).map((f) => (
            <button
              key={f.key}
              className={`format-btn ${format.key === f.key ? 'on' : ''}`}
              onClick={() => setFormat(f.key)}
            >
              <span className="format-thumb" style={{ aspectRatio: `${f.w}/${f.h}` }} />
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </Section>

      <LogoSection />
      <BrandSection />
      <ElementsSection />

      <Section title="Referências">
        <p className="hint">Suba prints/posts; o app extrai a paleta de cores.</p>
        <button className="btn block" onClick={() => refInput.current.click()} disabled={analyzing}>
          {analyzing ? 'Analisando…' : '＋ Subir referência'}
        </button>
        <input ref={refInput} type="file" accept="image/*" multiple hidden onChange={onReference} />
        {refs.length > 0 && (
          <div className="ref-grid">
            {refs.map((src, i) => (
              <img key={i} src={src} alt={`ref ${i}`} className="ref-thumb" />
            ))}
          </div>
        )}
        {palette.length > 0 && (
          <>
            <div className="sub">Paleta extraída</div>
            <div className="swatches">
              {palette.map((c) => (
                <button
                  key={c}
                  className="swatch"
                  style={{ background: c, color: readableTextColor(c) }}
                  title={`Usar ${c} como fundo`}
                  onClick={() => setBackground(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}
      </Section>

      <PackageSection />

      <Section title="Imagem no canvas">
        <button className="btn block" onClick={() => imgInput.current.click()}>
          ＋ Inserir imagem
        </button>
        <input ref={imgInput} type="file" accept="image/*" hidden onChange={onAddImage} />
      </Section>

      <Section title="Templates">
        <div className="tpl-grid">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              className="tpl-btn"
              onClick={() => applyTemplate(t.build(getStageSize(format), tplPalette))}
              title={`Aplicar "${t.name}" no slide atual`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <p className="hint">Substitui os {slide.elements.length} elementos do slide atual.</p>
      </Section>
    </>
  )
}

function LogoSection() {
  const logos = useStore((s) => s.logos)
  const addLogo = useStore((s) => s.addLogo)
  const removeLogo = useStore((s) => s.removeLogo)
  const applyIdentity = useStore((s) => s.applyIdentity)
  const insertLogo = useStore((s) => s.insertLogo)
  const input = useRef(null)
  const [busy, setBusy] = useState(false)

  const onLogo = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true)
    try {
      const src = await fileToDataURL(f)
      const img = await loadImage(src)
      const pal = await extractPalette(src, 5)
      addLogo({ src, naturalW: img.width, naturalH: img.height, palette: pal })
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <Section title="Logo & Identidade">
      <p className="hint">
        Suba seu logo. O app lê as cores dele e sugere uma identidade (você ajusta depois).
      </p>
      <button className="btn block" onClick={() => input.current.click()} disabled={busy}>
        {busy ? 'Lendo cores…' : '＋ Adicionar logo'}
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={onLogo} />

      {logos.map((l) => (
        <div key={l.id} className="logo-card">
          <img src={l.src} alt="logo" className="logo-preview" />
          <div className="logo-pal">
            {(l.palette || []).map((c) => (
              <span key={c} className="dot" style={{ background: c }} title={c} />
            ))}
          </div>
          <div className="logo-actions">
            <button className="btn tiny" onClick={() => applyIdentity(l)}>
              Usar identidade
            </button>
            <button className="btn tiny" onClick={() => insertLogo(l)}>
              Inserir na arte
            </button>
            <button className="btn tiny danger" onClick={() => removeLogo(l.id)} title="Excluir">
              🗑
            </button>
          </div>
        </div>
      ))}
    </Section>
  )
}

function PackageSection() {
  const packages = useStore((s) => s.packages)
  const addPackage = useStore((s) => s.addPackage)
  const removePackage = useStore((s) => s.removePackage)
  const applyPackagePalette = useStore((s) => s.applyPackagePalette)
  const input = useRef(null)
  const [draft, setDraft] = useState([]) // dataURLs
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const onFiles = async (e) => {
    const files = [...e.target.files]
    const added = []
    for (const f of files) if (f.type.startsWith('image/')) added.push(await fileToDataURL(f))
    setDraft((prev) => [...prev, ...added].slice(0, 12))
    e.target.value = ''
  }

  const save = async () => {
    if (!draft.length) return
    setBusy(true)
    try {
      let pal = []
      for (const src of draft) pal = [...pal, ...(await extractPalette(src, 4))]
      const seen = new Set()
      const palette = pal.filter((c) => (seen.has(c) ? false : seen.add(c))).slice(0, 8)
      addPackage({ name: name.trim() || `Pacote ${packages.length + 1}`, images: draft, palette })
      setDraft([])
      setName('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title="Pacotes de referência">
      <p className="hint">Junte várias imagens num pacote nomeado (ex: "Pacote 1") e reutilize.</p>

      <button className="btn block" onClick={() => input.current.click()}>
        ＋ Imagens do pacote
      </button>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={onFiles} />

      {draft.length > 0 && (
        <div className="pkg-draft">
          <div className="ref-grid">
            {draft.map((src, i) => (
              <div key={i} className="ref-cell">
                <img src={src} alt="" className="ref-thumb" />
                <button
                  className="ref-x"
                  onClick={() => setDraft((p) => p.filter((_, idx) => idx !== i))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <input
            type="text"
            className="key-input"
            placeholder="Nome do pacote (ex: Pacote 1)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn block primary" onClick={save} disabled={busy}>
            {busy ? 'Salvando…' : `💾 Salvar pacote (${draft.length})`}
          </button>
        </div>
      )}

      {packages.map((p) => (
        <div key={p.id} className="pkg-card">
          <div className="pkg-head">
            <strong>{p.name}</strong>
            <button className="btn tiny danger" onClick={() => removePackage(p.id)}>
              🗑
            </button>
          </div>
          <div className="ref-grid">
            {p.images.slice(0, 8).map((src, i) => (
              <img key={i} src={src} alt="" className="ref-thumb" />
            ))}
          </div>
          <div className="logo-pal">
            {(p.palette || []).map((c) => (
              <span key={c} className="dot" style={{ background: c }} title={c} />
            ))}
          </div>
          <button className="btn tiny block" onClick={() => applyPackagePalette(p)}>
            Usar paleta deste pacote
          </button>
        </div>
      ))}
    </Section>
  )
}

function BrandSection() {
  const brandColors = useStore((s) => s.brandColors)
  const addBrandColor = useStore((s) => s.addBrandColor)
  const updateBrandColor = useStore((s) => s.updateBrandColor)
  const removeBrandColor = useStore((s) => s.removeBrandColor)
  const setBackground = useStore((s) => s.setBackground)
  const applyPaletteToAll = useStore((s) => s.applyPaletteToAll)
  const slidesCount = useStore((s) => s.slides.length)

  return (
    <Section title="Identidade da marca">
      <p className="hint">
        Defina as cores da sua marca. Elas viram a base dos templates e da geração por IA.
      </p>
      {brandColors.map((c, i) => (
        <div key={i} className="brand-row">
          <input
            type="color"
            value={c}
            onChange={(e) => updateBrandColor(i, e.target.value)}
          />
          <input
            type="text"
            value={c}
            onChange={(e) => updateBrandColor(i, e.target.value)}
            spellCheck={false}
          />
          <button className="btn tiny" onClick={() => setBackground(c)} title="Usar como fundo">
            fundo
          </button>
          <button className="btn tiny danger" onClick={() => removeBrandColor(i)} title="Remover">
            ×
          </button>
        </div>
      ))}
      <button className="btn block" onClick={() => addBrandColor()} style={{ marginTop: 8 }}>
        ＋ Adicionar cor
      </button>
      <button
        className="btn block primary"
        style={{ marginTop: 8 }}
        disabled={brandColors.length === 0}
        onClick={() => applyPaletteToAll()}
        title="Repinta todas as artes seguindo estas cores"
      >
        🎨 Definir paleta em todas as artes
      </button>
      {brandColors.length === 0 && (
        <p className="hint">Adicione cores acima pra liberar.</p>
      )}
      {brandColors.length > 0 && (
        <p className="hint">Aplica nas {slidesCount} arte(s). Dá pra desfazer com Ctrl+Z.</p>
      )}
    </Section>
  )
}

function ElementsSection() {
  const addCircle = useStore((s) => s.addCircle)
  const addTriangle = useStore((s) => s.addTriangle)
  const addRect = useStore((s) => s.addRect)
  const addIcon = useStore((s) => s.addIcon)

  return (
    <Section title="Elementos">
      <div className="row gap">
        <button className="btn block" onClick={addRect}>▭</button>
        <button className="btn block" onClick={addCircle}>●</button>
        <button className="btn block" onClick={addTriangle}>▲</button>
      </div>
      <div className="sub">Ícones</div>
      <div className="icon-grid">
        {ICON_LIST.map((name) => (
          <button
            key={name}
            className="icon-cell"
            onClick={() => addIcon(name)}
            title={name}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d={ICONS[name]} fill="currentColor" />
            </svg>
          </button>
        ))}
      </div>
    </Section>
  )
}

function Section({ title, children }) {
  return (
    <section className="section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}
