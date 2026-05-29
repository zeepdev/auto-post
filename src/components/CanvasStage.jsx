import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text, Image as KImage, Transformer } from 'react-konva'
import { useStore } from '../store.js'
import { getStageSize } from '../lib/stage.js'
import { loadImage } from '../lib/colors.js'

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

  // Escala visual por CSS para caber no container, sem mexer nas coordenadas lógicas.
  useEffect(() => {
    const fit = () => {
      const wrap = wrapRef.current
      if (!wrap) return
      const pad = 32
      const availW = wrap.clientWidth - pad
      const availH = wrap.clientHeight - pad
      setScale(Math.min(availW / w, availH / h, 1))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [w, h])

  // Anexa o Transformer ao nó selecionado.
  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    if (!selectedId) {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
      return
    }
    const node = stage.findOne(`#${selectedId}`)
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()
  }, [selectedId, slide])

  const onDragEnd = (id) => (e) =>
    updateElement(id, { x: e.target.x(), y: e.target.y() })

  const onTransformEnd = (el) => (e) => {
    const node = e.target
    const sx = node.scaleX()
    const sy = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    if (el.type === 'text') {
      updateElement(el.id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(30, node.width() * sx),
        rotation: node.rotation(),
      })
    } else {
      updateElement(el.id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * sx),
        height: Math.max(5, node.height() * sy),
        rotation: node.rotation(),
      })
    }
  }

  const deselectOnBg = (e) => {
    if (e.target === e.target.getStage() || e.target.attrs.__bg) select(null)
  }

  return (
    <div className="canvas-wrap" ref={wrapRef}>
      <div
        className="canvas-frame"
        style={{ width: w * scale, height: h * scale }}
      >
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
            {slide.elements.map((el) => {
              const common = {
                key: el.id,
                onClick: () => select(el.id),
                onTap: () => select(el.id),
                onDragEnd: onDragEnd(el.id),
                onTransformEnd: onTransformEnd(el),
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
                  />
                )
              }
              return <ImageNode el={el} {...common} />
            })}
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
