// Geometria compartilhada entre o canvas (react-konva) e a exportação (Konva puro),
// pra que o desenho e o PNG/JPG fiquem idênticos.

export const ICON_VIEWBOX = 24

// pontos de um triângulo isósceles dentro da caixa (top-left x,y + width/height)
export function trianglePoints(w, h) {
  return [w / 2, 0, w, h, 0, h]
}

// círculo desenhado com origem no topo-esquerdo: centro deslocado por w/2,h/2
export function circleCenter(el) {
  return { cx: el.width / 2, cy: el.height / 2, r: Math.min(el.width, el.height) / 2 }
}
