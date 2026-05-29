import Konva from 'konva'
import { getStageSize, exportPixelRatio } from './stage.js'
import { loadImage } from './colors.js'
import { ensureFontsLoaded } from './fonts.js'
import { trianglePoints, circleCenter, ICON_VIEWBOX } from './shapes.js'
import { ICONS } from './icons.js'

// Constrói um Konva.Stage offscreen a partir dos dados de um slide e devolve o dataURL.
// Reconstruir (em vez de ler o stage da tela) garante que a arte exportada não tenha
// transformer, seleção ou recorte de viewport — só o conteúdo.
async function renderSlideToDataURL(slide, format, mime, quality) {
  const { w, h } = getStageSize(format)
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-99999px'
  container.style.top = '0'
  document.body.appendChild(container)

  const stage = new Konva.Stage({ container, width: w, height: h })
  const layer = new Konva.Layer()
  stage.add(layer)

  layer.add(new Konva.Rect({ x: 0, y: 0, width: w, height: h, fill: slide.background || '#ffffff' }))

  for (const el of slide.elements) {
    if (el.type === 'text') {
      layer.add(
        new Konva.Text({
          x: el.x,
          y: el.y,
          width: el.width,
          text: el.text,
          fontFamily: el.fontFamily,
          fontSize: el.fontSize,
          fontStyle: el.fontStyle || 'normal',
          fill: el.fill,
          align: el.align || 'left',
          lineHeight: el.lineHeight || 1.2,
          letterSpacing: el.letterSpacing || 0,
          rotation: el.rotation || 0,
          opacity: el.opacity ?? 1,
        })
      )
    } else if (el.type === 'rect') {
      layer.add(
        new Konva.Rect({
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          fill: el.fill,
          cornerRadius: el.cornerRadius || 0,
          rotation: el.rotation || 0,
          opacity: el.opacity ?? 1,
        })
      )
    } else if (el.type === 'image' && el.src) {
      const img = await loadImage(el.src)
      layer.add(
        new Konva.Image({
          image: img,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          cornerRadius: el.cornerRadius || 0,
          rotation: el.rotation || 0,
          opacity: el.opacity ?? 1,
        })
      )
    } else if (el.type === 'circle') {
      const { cx, cy, r } = circleCenter(el)
      const g = new Konva.Group({ x: el.x, y: el.y, rotation: el.rotation || 0, opacity: el.opacity ?? 1 })
      g.add(new Konva.Circle({ x: cx, y: cy, radius: r, fill: el.fill }))
      layer.add(g)
    } else if (el.type === 'triangle') {
      const g = new Konva.Group({ x: el.x, y: el.y, rotation: el.rotation || 0, opacity: el.opacity ?? 1 })
      g.add(new Konva.Line({ points: trianglePoints(el.width, el.height), closed: true, fill: el.fill }))
      layer.add(g)
    } else if (el.type === 'icon') {
      const g = new Konva.Group({ x: el.x, y: el.y, rotation: el.rotation || 0, opacity: el.opacity ?? 1 })
      g.add(
        new Konva.Path({
          data: el.path || ICONS[el.icon] || ICONS.estrela,
          fill: el.fill,
          scaleX: el.width / ICON_VIEWBOX,
          scaleY: el.height / ICON_VIEWBOX,
        })
      )
      layer.add(g)
    }
  }

  layer.draw()
  const url = stage.toDataURL({ mimeType: mime, quality, pixelRatio: exportPixelRatio(format) })
  stage.destroy()
  document.body.removeChild(container)
  return url
}

function triggerDownload(dataURL, filename) {
  const a = document.createElement('a')
  a.href = dataURL
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg' }

export async function downloadSlide(slide, format, mime = 'image/png', index = 0) {
  await ensureFontsLoaded()
  const url = await renderSlideToDataURL(slide, format, mime, 0.95)
  triggerDownload(url, `auto-post-${index + 1}.${EXT[mime]}`)
}

// Baixa todos os slides em sequência (carrossel). Pequeno atraso entre downloads
// porque navegadores bloqueiam múltiplos downloads disparados juntos.
export async function downloadAll(slides, format, mime = 'image/png') {
  await ensureFontsLoaded()
  for (let i = 0; i < slides.length; i++) {
    const url = await renderSlideToDataURL(slides[i], format, mime, 0.95)
    triggerDownload(url, `auto-post-${i + 1}.${EXT[mime]}`)
    await new Promise((r) => setTimeout(r, 350))
  }
}
