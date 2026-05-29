// Tamanho LÓGICO do canvas de edição (coordenadas dos elementos vivem aqui).
// O ajuste visual para caber na tela é feito por CSS (transform scale) no wrapper,
// então as coordenadas permanecem estáveis. A exportação usa estas dimensões +
// pixelRatio para gerar a arte final em alta (largura 1080px).

const TARGET_HEIGHT = 600

export function getStageSize(format) {
  const ratio = format.w / format.h
  const h = TARGET_HEIGHT
  const w = Math.round(h * ratio)
  return { w, h }
}

// Fator para levar o canvas lógico até a largura real de 1080px na exportação.
export function exportPixelRatio(format) {
  const { w } = getStageSize(format)
  return format.w / w
}
