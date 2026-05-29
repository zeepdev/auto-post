// Alinhamento inteligente tipo Canva: ao arrastar um elemento, detecta quando
// suas bordas/centro ficam perto das bordas/centro de OUTROS elementos, do centro
// do canvas ou das margens de segurança — e devolve o ajuste (dx,dy) + as linhas-guia.

const TOL = 6 // tolerância em px lógicos

export function computeSnap(drag, others, w, h, margin) {
  const dragX = { left: drag.x, center: drag.x + drag.width / 2, right: drag.x + drag.width }
  const dragY = { top: drag.y, middle: drag.y + drag.height / 2, bottom: drag.y + drag.height }

  // alvos verticais (linhas em X) e horizontais (linhas em Y), com a extensão
  // perpendicular [min,max] pra desenhar a guia só onde faz sentido.
  const vTargets = [
    { v: w / 2, min: 0, max: h },
    { v: margin, min: 0, max: h },
    { v: w - margin, min: 0, max: h },
  ]
  const hTargets = [
    { v: h / 2, min: 0, max: w },
    { v: margin, min: 0, max: w },
    { v: h - margin, min: 0, max: w },
  ]
  for (const o of others) {
    const r = o.x + o.width
    const b = o.y + o.height
    vTargets.push(
      { v: o.x, min: o.y, max: b },
      { v: o.x + o.width / 2, min: o.y, max: b },
      { v: r, min: o.y, max: b }
    )
    hTargets.push(
      { v: o.y, min: o.x, max: r },
      { v: o.y + o.height / 2, min: o.x, max: r },
      { v: b, min: o.x, max: r }
    )
  }

  const best = (points, targets) => {
    let win = null
    for (const key of Object.keys(points)) {
      for (const t of targets) {
        const diff = t.v - points[key]
        if (Math.abs(diff) < TOL && (!win || Math.abs(diff) < Math.abs(win.diff))) {
          win = { diff, t }
        }
      }
    }
    return win
  }

  const bx = best(dragX, vTargets)
  const by = best(dragY, hTargets)
  const dx = bx ? bx.diff : 0
  const dy = by ? by.diff : 0

  const lines = []
  if (bx) {
    const x = bx.t.v
    lines.push([x, Math.min(bx.t.min, drag.y + dy), x, Math.max(bx.t.max, drag.y + dy + drag.height)])
  }
  if (by) {
    const y = by.t.v
    lines.push([Math.min(by.t.min, drag.x + dx), y, Math.max(by.t.max, drag.x + dx + drag.width), y])
  }
  return { dx, dy, lines }
}
