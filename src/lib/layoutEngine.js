import { nanoid } from '../store.js'
import { getStageSize } from './stage.js'
import { readableTextColor } from './colors.js'
import { ICONS } from './icons.js'

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
// iconPaths: mapa nome-MDI → path SVG (resolvido antes, em ContextPanel).
function decoToElement(d, w, h, accent, iconPaths = {}) {
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
  if (d.shape === 'icon') {
    const path = iconPaths[d.icon] || ICONS[d.icon] || ICONS.estrela
    return { ...base, type: 'icon', icon: d.icon || 'estrela', path }
  }
  if (d.shape === 'circle') return { ...base, type: 'circle' }
  if (d.shape === 'triangle') return { ...base, type: 'triangle' }
  return { ...base, type: 'rect', cornerRadius: size * 0.15 } // quadrado/retângulo
}

export function specToSlides(spec, format, logo, iconPaths = {}) {
  const { w, h } = getStageSize(format)
  const id = spec.identity || {}
  const bg = id.background || '#0E1116'
  const fg = id.textColor || readableTextColor(bg)
  const accent = id.accent || '#6C5CE7'
  const muted = fg === '#FFFFFF' ? '#C9CDD6' : '#444B57'

  return (spec.slides || []).map((s) => {
    const elements = []

    // decorações entram primeiro (ficam atrás do texto)
    for (const d of s.decorations || []) elements.push(decoToElement(d, w, h, accent, iconPaths))

    if (s.kind === 'cover') {
      // fundo esmaecido (profundidade) — círculo grande de destaque
      elements.push({
        id: nanoid(),
        type: 'circle',
        x: w * 0.45,
        y: h * 0.08,
        width: w * 0.85,
        height: w * 0.85,
        fill: accent,
        rotation: 0,
        opacity: 0.1,
      })
      // aspas grandes (topo-esquerda e base-direita)
      elements.push(
        txt({
          x: w * 0.06,
          y: h * 0.02,
          width: w * 0.4,
          text: '“',
          fontFamily: 'Playfair Display',
          fontSize: Math.round(h * 0.16),
          fontStyle: 'bold',
          fill: accent,
          lineHeight: 1,
        }),
        txt({
          x: w * 0.54,
          y: h * 0.78,
          width: w * 0.4,
          text: '”',
          fontFamily: 'Playfair Display',
          fontSize: Math.round(h * 0.16),
          fontStyle: 'bold',
          fill: accent,
          align: 'right',
          lineHeight: 1,
          opacity: 0.85,
        })
      )
      // barra de destaque
      elements.push({
        id: nanoid(),
        type: 'rect',
        x: w * 0.08,
        y: h * 0.58,
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
          y: h * 0.24,
          width: w * 0.84,
          text: (s.title || '').toUpperCase(),
          fontFamily: 'Bebas Neue',
          fontSize: Math.round(h * 0.105),
          fill: fg,
          lineHeight: 0.95,
          letterSpacing: 1,
        })
      )
      if (s.subtitle)
        elements.push(
          txt({
            x: w * 0.08,
            y: h * 0.62,
            width: w * 0.84,
            text: s.subtitle,
            fontFamily: 'Inter',
            fontSize: Math.round(h * 0.032),
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
