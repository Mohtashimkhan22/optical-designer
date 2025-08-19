import React, { useRef, useState } from 'react'

export default function ComponentItem({ item, selected, onSelect, onDragMove, onChange, gridSize }) {
  const ref = useRef(null)
  const [dragStart, setDragStart] = useState(null)
  const [rotStart, setRotStart] = useState(null)

  const onMouseDown = (e) => {
    if (e.button !== 0) return
    e.stopPropagation()
    onSelect?.()
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const onMouseMove = (e) => {
    if (!dragStart) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    onDragMove(item.id, dx, dy)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const onMouseUp = () => setDragStart(null)

  const onRotateStart = (e) => {
    e.stopPropagation()
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width/2
    const cy = rect.top + rect.height/2
    setRotStart({ cx, cy, angle0: item.angle })
  }

  const onRotateMove = (e) => {
    if (!rotStart) return
    const a = Math.atan2(e.clientY - rotStart.cy, e.clientX - rotStart.cx) // radians
    const deg = (a * 180 / Math.PI)
    const snapped = Math.round(deg / 1) * 1
    onChange({ angle: snapped })
  }

  const onRotateEnd = () => setRotStart(null)

  const size = 40
  const style = {
    transform: `translate(${item.x - size/2}px, ${item.y - size/2}px) rotate(${item.angle}deg)`,
    zIndex: selected ? 10 : 1
  }

  const shape = {
    source: <circle cx="20" cy="20" r="10" />,
    mirror: <rect x="2" y="18" width={item.props?.length ?? 96} height="4" rx="2" />,
    lens:   <rect x="-2" y="4" width="4" height="32" rx="2" />,
    detector: <rect x="0" y="12" width={item.props?.width ?? 120} height={item.props?.height ?? 8} rx="2" />
  }[item.type]

  return (
    <div
      className={`item ${selected ? 'selected' : ''}`}
      style={style}
      ref={ref}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <svg width="160" height="40" style={{overflow:'visible'}}>
        <g className={`item-shape item-${item.type}`}>
          {shape}
        </g>
      </svg>

      {/* rotate handle */}
      <div
        className="rot-handle"
        onMouseDown={onRotateStart}
        onMouseMove={onRotateMove}
        onMouseUp={onRotateEnd}
        title="Rotate"
      />
      {/* label */}
      <div className="item-label" style={{ transform: `rotate(${-item.angle}deg)` }}>
        {item.name}
      </div>
    </div>
  )
}
