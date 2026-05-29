import { luminance, readableTextColor } from './colors.js'

// Repinta todas as artes seguindo uma paleta escolhida, preservando a estrutura:
// as cores atuais são ordenadas por luminância e mapeadas na paleta também ordenada
// (mais escura → mais escura, mais clara → mais clara). Assim o contraste se mantém.
export function recolorSlides(slides, paletteIn) {
  let palette = [...new Set((paletteIn || []).filter(Boolean))]
  if (palette.length === 0) return slides
  if (palette.length === 1) palette = [palette[0], readableTextColor(palette[0])]
  const sortedPal = [...palette].sort((a, b) => luminance(a) - luminance(b))

  const used = new Set()
  for (const sl of slides) {
    if (sl.background) used.add(sl.background.toUpperCase())
    for (const el of sl.elements) if (el.fill) used.add(el.fill.toUpperCase())
  }
  const sortedUsed = [...used].sort((a, b) => luminance(a) - luminance(b))
  const n = sortedUsed.length

  const map = new Map()
  sortedUsed.forEach((c, i) => {
    const ratio = n <= 1 ? 0 : i / (n - 1)
    map.set(c, sortedPal[Math.round(ratio * (sortedPal.length - 1))])
  })

  const conv = (c) => (c ? map.get(c.toUpperCase()) || c : c)
  return slides.map((sl) => ({
    ...sl,
    background: conv(sl.background),
    elements: sl.elements.map((el) => (el.fill ? { ...el, fill: conv(el.fill) } : el)),
  }))
}
