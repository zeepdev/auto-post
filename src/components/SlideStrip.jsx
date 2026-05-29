import { useStore } from '../store.js'

export default function SlideStrip() {
  const slides = useStore((s) => s.slides)
  const currentIndex = useStore((s) => s.currentIndex)
  const format = useStore((s) => s.format)
  const setCurrent = useStore((s) => s.setCurrent)
  const addSlide = useStore((s) => s.addSlide)
  const duplicateSlide = useStore((s) => s.duplicateSlide)
  const removeSlide = useStore((s) => s.removeSlide)

  const ratio = `${format.w}/${format.h}`

  return (
    <div className="strip">
      <div className="strip-scroll">
        {slides.map((sl, i) => {
          const firstText = sl.elements.find((e) => e.type === 'text')
          return (
            <div className="thumb-wrap" key={sl.id}>
              <button
                className={`thumb ${i === currentIndex ? 'on' : ''}`}
                style={{ aspectRatio: ratio, background: sl.background }}
                onClick={() => setCurrent(i)}
                title={`Slide ${i + 1}`}
              >
                {firstText && (
                  <span className="thumb-text" style={{ color: firstText.fill }}>
                    {firstText.text.split('\n')[0]}
                  </span>
                )}
                <span className="thumb-num">{i + 1}</span>
              </button>
              {slides.length > 1 && (
                <button
                  className="thumb-x"
                  onClick={() => removeSlide(i)}
                  title="Excluir slide"
                >
                  ×
                </button>
              )}
            </div>
          )
        })}

        <div className="strip-actions">
          <button className="btn block" onClick={addSlide} title="Novo slide">＋ Slide</button>
          <button className="btn block ghost" onClick={duplicateSlide} title="Duplicar slide atual">
            ⧉ Duplicar
          </button>
        </div>
      </div>
    </div>
  )
}
