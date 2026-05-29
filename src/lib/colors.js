// Extração de paleta dominante de uma imagem, 100% client-side.
// Estratégia: redimensiona para um thumbnail, quantiza as cores em "buckets"
// e retorna as mais frequentes, ignorando tons quase-iguais.

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function rgbToHex(r, g, b) {
  const h = (n) => n.toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase()
}

// Luminância relativa (0–255) para decidir texto claro/escuro sobre uma cor.
export function luminance(hex) {
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function readableTextColor(bgHex) {
  return luminance(bgHex) > 140 ? '#111111' : '#FFFFFF'
}

// Reduz uma imagem (dataURL) antes de enviar pro backend/IA — evita estourar o
// limite de payload da serverless e acelera o upload.
export async function downscaleDataURL(src, max = 1024, quality = 0.85) {
  const img = await loadImage(src)
  const scale = Math.min(max / img.width, max / img.height, 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.width * scale))
  canvas.height = Math.max(1, Math.round(img.height * scale))
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}

export async function extractPalette(src, max = 6) {
  const img = await loadImage(src)
  const size = 120
  const canvas = document.createElement('canvas')
  const scale = Math.min(size / img.width, size / img.height, 1)
  canvas.width = Math.max(1, Math.round(img.width * scale))
  canvas.height = Math.max(1, Math.round(img.height * scale))
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const buckets = new Map()
  const step = 24 // tamanho do bucket por canal → reduz ruído
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 125) continue
    const r = Math.round(data[i] / step) * step
    const g = Math.round(data[i + 1] / step) * step
    const b = Math.round(data[i + 2] / step) * step
    const key = `${r},${g},${b}`
    const e = buckets.get(key)
    if (e) {
      e.count++
      e.r += data[i]
      e.g += data[i + 1]
      e.b += data[i + 2]
    } else {
      buckets.set(key, { count: 1, r: data[i], g: data[i + 1], b: data[i + 2] })
    }
  }

  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count)
  const palette = []
  for (const e of sorted) {
    const hex = rgbToHex(
      Math.round(e.r / e.count),
      Math.round(e.g / e.count),
      Math.round(e.b / e.count)
    )
    if (palette.some((p) => colorDistance(p, hex) < 32)) continue
    palette.push(hex)
    if (palette.length >= max) break
  }
  return palette
}

function colorDistance(a, b) {
  const pa = a.replace('#', '')
  const pb = b.replace('#', '')
  const ar = parseInt(pa.slice(0, 2), 16)
  const ag = parseInt(pa.slice(2, 4), 16)
  const ab = parseInt(pa.slice(4, 6), 16)
  const br = parseInt(pb.slice(0, 2), 16)
  const bg = parseInt(pb.slice(2, 4), 16)
  const bb = parseInt(pb.slice(4, 6), 16)
  return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2)
}
