import { useStore } from '../store.js'
import { FONTS } from '../lib/fonts.js'
import { ICONS, ICON_LIST } from '../lib/icons.js'

export default function RightPanel() {
  const slide = useStore((s) => s.slides[s.currentIndex])
  const selectedId = useStore((s) => s.selectedId)
  const updateElement = useStore((s) => s.updateElement)
  const removeElement = useStore((s) => s.removeElement)
  const moveElement = useStore((s) => s.moveElement)
  const addText = useStore((s) => s.addText)
  const addRect = useStore((s) => s.addRect)
  const addCircle = useStore((s) => s.addCircle)
  const addTriangle = useStore((s) => s.addTriangle)
  const setBackground = useStore((s) => s.setBackground)

  const el = slide.elements.find((e) => e.id === selectedId)
  const isShape = el && ['rect', 'circle', 'triangle', 'icon'].includes(el.type)

  return (
    <aside className="panel right">
      <section className="section">
        <h3>Adicionar</h3>
        <div className="row gap">
          <button className="btn block" onClick={addText}>＋ Texto</button>
          <button className="btn block" onClick={addRect}>▭ Quadrado</button>
        </div>
        <div className="row gap" style={{ marginTop: 8 }}>
          <button className="btn block" onClick={addCircle}>● Círculo</button>
          <button className="btn block" onClick={addTriangle}>▲ Triângulo</button>
        </div>
      </section>

      <section className="section">
        <h3>Fundo do slide</h3>
        <Color value={slide.background} onChange={setBackground} />
      </section>

      <section className="section grow">
        <h3>Elemento</h3>
        {!el && <p className="hint">Selecione um elemento no canvas para editar.</p>}

        {el?.type === 'text' && (
          <>
            <label className="fld">
              <span>Texto</span>
              <textarea
                rows={3}
                value={el.text}
                onChange={(e) => updateElement(el.id, { text: e.target.value })}
              />
            </label>
            <label className="fld">
              <span>Fonte</span>
              <select
                value={el.fontFamily}
                onChange={(e) => updateElement(el.id, { fontFamily: e.target.value })}
              >
                {FONTS.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <Range label="Tamanho" min={8} max={200} value={el.fontSize}
              onChange={(v) => updateElement(el.id, { fontSize: v })} />
            <label className="fld">
              <span>Estilo</span>
              <select
                value={el.fontStyle || 'normal'}
                onChange={(e) => updateElement(el.id, { fontStyle: e.target.value })}
              >
                <option value="normal">Normal</option>
                <option value="bold">Negrito</option>
                <option value="italic">Itálico</option>
                <option value="bold italic">Negrito itálico</option>
              </select>
            </label>
            <label className="fld">
              <span>Alinhamento</span>
              <div className="seg full">
                {['left', 'center', 'right'].map((a) => (
                  <button
                    key={a}
                    className={el.align === a ? 'on' : ''}
                    onClick={() => updateElement(el.id, { align: a })}
                  >
                    {a === 'left' ? '⯇' : a === 'center' ? '≡' : '⯈'}
                  </button>
                ))}
              </div>
            </label>
            <label className="fld">
              <span>Cor do texto</span>
              <Color value={el.fill} onChange={(v) => updateElement(el.id, { fill: v })} />
            </label>
            <Range label="Espaçamento" min={-5} max={30} value={el.letterSpacing || 0}
              onChange={(v) => updateElement(el.id, { letterSpacing: v })} />
            <Range label="Entrelinha" min={0.8} max={2.5} step={0.05} value={el.lineHeight || 1.2}
              onChange={(v) => updateElement(el.id, { lineHeight: v })} />
          </>
        )}

        {isShape && (
          <>
            <label className="fld">
              <span>Cor</span>
              <Color value={el.fill} onChange={(v) => updateElement(el.id, { fill: v })} />
            </label>
            {el.type === 'rect' && (
              <Range label="Cantos" min={0} max={120} value={el.cornerRadius || 0}
                onChange={(v) => updateElement(el.id, { cornerRadius: v })} />
            )}
            {el.type === 'icon' && (
              <label className="fld">
                <span>Ícone</span>
                <div className="icon-grid">
                  {ICON_LIST.map((name) => (
                    <button
                      key={name}
                      className={`icon-cell ${el.icon === name ? 'on' : ''}`}
                      onClick={() => updateElement(el.id, { icon: name, path: ICONS[name] })}
                      title={name}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <path d={ICONS[name]} fill="currentColor" />
                      </svg>
                    </button>
                  ))}
                </div>
              </label>
            )}
          </>
        )}

        {el?.type === 'image' && (
          <Range label="Cantos" min={0} max={200} value={el.cornerRadius || 0}
            onChange={(v) => updateElement(el.id, { cornerRadius: v })} />
        )}

        {el && (
          <>
            <Range label="Opacidade" min={0} max={1} step={0.05} value={el.opacity ?? 1}
              onChange={(v) => updateElement(el.id, { opacity: v })} />
            <Range label="Rotação" min={-180} max={180} value={Math.round(el.rotation || 0)}
              onChange={(v) => updateElement(el.id, { rotation: v })} />
            <div className="row gap">
              <button className="btn block" onClick={() => moveElement(el.id, 1)}>↑ Frente</button>
              <button className="btn block" onClick={() => moveElement(el.id, -1)}>↓ Trás</button>
            </div>
            <button className="btn block danger" onClick={() => removeElement(el.id)}>
              🗑 Excluir elemento
            </button>
          </>
        )}
      </section>
    </aside>
  )
}

function Color({ value, onChange }) {
  return (
    <div className="color-fld">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  )
}

function Range({ label, value, onChange, min, max, step = 1 }) {
  return (
    <label className="fld">
      <span>
        {label} <em>{value}</em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
