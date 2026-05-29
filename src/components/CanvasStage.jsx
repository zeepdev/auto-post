import { useEffect, useRef, useState } from 'react'
import {
  Stage,
  Layer,
  Rect,
  Text,
  Image as KImage,
  Circle,
  Line,
  Path,
  Group,
  Transformer,
} from 'react-konva'
import { useStore } from '../store.js'
import { getStageSize } from '../lib/stage.js'
import { loadImage } from '../lib/colors.js'
import { trianglePoints, circleCenter, ICON_VIEWBOX } from '../lib/shapes.js'
import { ICONS } from '../lib/icons.js'

const SNAP = 6 // tolerância (px lógicos) pra "travar" no centro

function useHTMLImage(src) {
  const [img, setImg] = useState(null)
  useEffect(() => {
    let alive = true
    if (!src) return
    loadImage(src).then((i) => alive && setImg(i)).catch(() => {})
    return () => {
      alive = false
    }
  }, [src])
  return img
}

function ImageNode({ el, ...handlers }) {
  const img = useHTMLImage(el.src)
  return (
    <KImage
      image={img}
      id={el.id}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      rotation={el.rotation}
      opacity={el.opacity ?? 1}
      cornerRadius={el.cornerRadius || 0}
      draggable
      {...handlers}
    />
  )
}

export default function CanvasStage() {
  const format = useStore((s) => s.format)
  const slide = useStore((s) => s.slides[s.currentIndex])
  const selectedId = useStore((s) => s.selectedId)
  const select = useStore((s) => s.select)
  const updateElement = useStore((s) => s.updateElement)

  const { w, h } = getStageSize(format)
  const stageRef = useRef(null)
  const trRef = useRef(null)
  const wrapRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [guides, setGuides] = useState({ v: false, h: false })

  useEffect(() => {
    const fit = () => {
      const wrap = wrapRef.current
      if (!wrap) return
      const pad = 32
      setScale(Math.min((wrap.clientWidth - pad) / w, (wrap.clientHeight - pad) / h, 1))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [w, h])

  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    const node = selectedId ? stage.findOne(`#${selectedId}`) : null
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()
  }, [selectedId, slide])

  // arrastar: "trava" no centro horizontal/vertical e mostra a guia
  const onDragMove = (e) => {
    const node = e.target
    const box = node.getClientRect({ relativeTo: node.getLayer() })
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    let v = false
    let hh = false
    if (Math.abs(cx - w / 2) < SNAP) {
      node.x(node.x() + (w / 2 - cx))
      v = true
    }
    if (Math.abs(cy - h / 2) < SNAP) {
      node.y(node.y() + (h / 2 - cy))
      hh = true
    }
    setGuides({ v, h: hh })
  }

  const onDragEnd = (id) => (e) => {
    setGuides({ v: false, h: false })
    updateElement(id, { x: e.target.x(), y: e.target.y() })
  }

  // transform de texto: muda só largura (texto reflui). reseta escala.
  const onTextTransformEnd = (el) => (e) => {
    const node = e.target
    const sx = node.scaleX()
    node.scaleX(1)
    node.scaleY(1)
    updateElement(el.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(30, node.width() * sx),
      rotation: node.rotation(),
    })
  }

  // transform genérico (rect/image/círculo/triângulo/ícone): escala vira width/height.
  const onBoxTransformEnd = (el) => (e) => {
    const node = e.target
    const sx = node.scaleX()
    const sy = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    updateElement(el.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(8, (el.width || node.width()) * sx),
      height: Math.max(8, (el.height || node.height()) * sy),
      rotation: node.rotation(),
    })
  }

  const deselectOnBg = (e) => {
    if (e.target === e.target.getStage() || e.target.attrs.__bg) select(null)
  }

  const renderElement = (el) => {
    const common = {
      key: el.id,
      onClick: () => select(el.id),
      onTap: () => select(el.id),
      onDragMove,
      onDragEnd: onDragEnd(el.id),
    }

    if (el.type === 'text') {
      return (
        <Text
          {...common}
          id={el.id}
          x={el.x}
          y={el.y}
          width={el.width}
          text={el.text}
          fontFamily={el.fontFamily}
          fontSize={el.fontSize}
          fontStyle={el.fontStyle || 'normal'}
          fill={el.fill}
          align={el.align || 'left'}
          lineHeight={el.lineHeight || 1.2}
          letterSpacing={el.letterSpacing || 0}
          rotation={el.rotation || 0}
          opacity={el.opacity ?? 1}
          draggable
          onTransformEnd={onTextTransformEnd(el)}
        />
      )
    }
    if (el.type === 'rect') {
      return (
        <Rect
          {...common}
          id={el.id}
          x={el.x}
          y={el.y}
          width={el.width}
          height={el.height}
          fill={el.fill}
          cornerRadius={el.cornerRadius || 0}
          rotation={el.rotation || 0}
          opacity={el.opacity ?? 1}
          draggable
          onTransformEnd={onBoxTransformEnd(el)}
        />
      )
    }
    if (el.type === 'image') {
      return <ImageNode el={el} {...common} onTransformEnd={onBoxTransformEnd(el)} />
    }

    // círculo / triângulo / ícone: desenhados num Group com origem top-left
    const groupProps = {
      ...common,
      id: el.id,
      x: el.x,
      y: el.y,
      rotation: el.rotation || 0,
      opacity: el.opacity ?? 1,
      draggable: true,
      onTransformEnd: onBoxTransformEnd(el),
    }
    if (el.type === 'circle') {
      const { cx, cy, r } = circleCenter(el)
      return (
        <Group {...groupProps}>
          <Circle x={cx} y={cy} radius={r} fill={el.fill} />
        </Group>
      )
    }
    if (el.type === 'triangle') {
      return (
        <Group {...groupProps}>
          <Line points={trianglePoints(el.width, el.height)} closed fill={el.fill} />
        </Group>
      )
    }
    if (el.type === 'icon') {
      return (
        <Group {...groupProps}>
          <Path
            data={ICONS[el.icon] || ICONS.estrela}
            fill={el.fill}
            scaleX={el.width / ICON_VIEWBOX}
            scaleY={el.height / ICON_VIEWBOX}
          />
        </Group>
      )
    }
    return null
  }

  return (
    <div className="canvas-wrap" ref={wrapRef}>
      <div className="canvas-frame" style={{ width: w * scale, height: h * scale }}>
        <Stage
          ref={stageRef}
          width={w}
          height={h}
          scaleX={scale}
          scaleY={scale}
          style={{ width: w * scale, height: h * scale }}
          onMouseDown={deselectOnBg}
          onTouchStart={deselectOnBg}
        >
          <Layer>
            <Rect __bg x={0} y={0} width={w} height={h} fill={slide.background} />
            {slide.elements.map(renderElement)}

            {guides.v && (
              <Line points={[w / 2, 0, w / 2, h]} stroke="#ff3da6" strokeWidth={1} dash={[6, 6]} listening={false} />
            )}
            {guides.h && (
              <Line points={[0, h / 2, w, h / 2]} stroke="#ff3da6" strokeWidth={1} dash={[6, 6]} listening={false} />
            )}

            <Transformer
              ref={trRef}
              rotateEnabled
              keepRatio={false}
              anchorSize={9}
              borderStroke="#6C5CE7"
              anchorStroke="#6C5CE7"
              anchorCornerRadius={4}
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 12 || newBox.height < 12 ? oldBox : newBox
              }
            />
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
