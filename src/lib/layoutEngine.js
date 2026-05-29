import { nanoid } from '../store.js'
import { getStageSize } from './stage.js'
import { readableTextColor } from './colors.js'

// Converte o "spec" de conteúdo devolvido pela IA em slides com elementos
// posicionados (coordenadas lógicas do stage). Layout determinístico por tipo de
// slide — a IA cuida do texto, o motor cuida da arte.

function txt(props) {
  return {
    id: nanoid(),
    type: 'text',
    fontStyle: 'normal',
    align: 'left',
    lineHeight: 1.2,
    letterSpacing: 0,
    rotation: 0,
    opacity: 1,
    ...props,
  }
}

function logoElement(logo, w, h) {
  const targetW = w * 0.2
  const ratio = (logo.naturalH || 1) / (logo.naturalW || 1)
  return {
    id: nanoid(),
    type: 'image',
    src: logo.src,
    x: w * 0.5 - targetW / 2,
    y: h * 0.9,
    width: targetW,
    height: targetW * ratio,
    cornerRadius: 0,
    rotation: 0,
    opacity: 1,
  }
}

function bulletsToText(bullets) {
  return bullets.map((b, i) => `${i + 1}.  ${b}`).join('\n\n')
}

// Converte uma decoração da IA (coords relativas 0–1) num elemento posicionado.
function decoToElement(d, w, h, accent) {
  const size = (d.size || 0.2) * w
  const x = (d.x ?? 0.5) * w - size / 2
  const y = (d.y ?? 0.5) * h - size / 2
  const base = {
    id: nanoid(),
    x,
    y,
    width: size,
    height: size,
    fill: d.color || accent,
    rotation: d.rotation || 0,
    opacity: d.opacity ?? 1,
  }
  if (d.shape === 'icon') return { ...base, type: 'icon', icon: d.icon || 'estrela' }
  if (d.shape === 'circle') return { ...base, type: 'circle' }
  if (d.shape === 'triangle') return { ...base, type: 'triangle' }
  return { ...base, type: 'rect', cornerRadius: size * 0.15 } // quadrado/retângulo
}

export function specToSlides(spec, format, logo) {
  const { w, h } = getStageSize(format)
  const id = spec.identity || {}
  const bg = id.background || '#0E1116'
  const fg = id.textColor || readableTextColor(bg)
  const accent = id.accent || '#6C5CE7'
  const muted = fg === '#FFFFFF' ? '#C9CDD6' : '#444B57'

  return (spec.slides || []).map((s) => {
    const elements = []

    // decorações entram primeiro (ficam atrás do texto)
    for (const d of s.decorations || []) elements.push(decoToElement(d, w, h, accent))

    if (s.kind === 'cover') {
      elements.push({
        id: nanoid(),
        type: 'rect',
        x: w * 0.08,
        y: h * 0.6,
        width: w * 0.16,
        height: 8,
        fill: accent,
        cornerRadius: 4,
        rotation: 0,
        opacity: 1,
      })
      elements.push(
        txt({
          x: w * 0.08,
          y: h * 0.26,
          width: w * 0.84,
          text: (s.title || '').toUpperCase(),
          fontFamily: 'Bebas Neue',
          fontSize: Math.round(h * 0.1),
          fill: fg,
          lineHeight: 0.98,
          letterSpacing: 1,
        })
      )
      if (s.subtitle)
        elements.push(
          txt({
            x: w * 0.08,
            y: h * 0.64,
            width: w * 0.84,
            text: s.subtitle,
            fontFamily: 'Inter',
            fontSize: Math.round(h * 0.03),
            fill: muted,
            lineHeight: 1.35,
          })
        )
    } else if (s.kind === 'cta') {
      elements.push(
        txt({
          x: w * 0.1,
          y: h * 0.34,
          width: w * 0.8,
          text: s.title || '',
          fontFamily: 'Montserrat',
          fontSize: Math.round(h * 0.07),
          fontStyle: 'bold',
          fill: fg,
          align: 'center',
          lineHeight: 1.1,
        })
      )
      if (s.body || s.footer)
        elements.push(
          txt({
            x: w * 0.1,
            y: h * 0.56,
            width: w * 0.8,
            text: s.body || s.footer,
            fontFamily: 'Inter',
            fontSize: Math.round(h * 0.032),
            fill: accent,
            fontStyle: 'bold',
            align: 'center',
            lineHeight: 1.35,
          })
        )
    } else {
      // content
      elements.push(
        txt({
          x: w * 0.08,
          y: h * 0.12,
          width: w * 0.84,
          text: s.title || '',
          fontFamily: 'Montserrat',
          fontSize: Math.round(h * 0.052),
          fontStyle: 'bold',
          fill: fg,
          lineHeight: 1.1,
        })
      )
      const body =
        s.bullets && s.bullets.length ? bulletsToText(s.bullets) : s.body || ''
      if (body)
        elements.push(
          txt({
            x: w * 0.08,
            y: h * 0.32,
            width: w * 0.84,
            text: body,
            fontFamily: 'Inter',
            fontSize: Math.round(h * 0.034),
            fill: muted,
            lineHeight: 1.4,
          })
        )
    }

    if (logo) elements.push(logoElement(logo, w, h))

    return { id: nanoid(), background: bg, elements }
  })
}
