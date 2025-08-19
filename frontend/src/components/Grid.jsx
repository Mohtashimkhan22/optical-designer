import React, { useRef, useCallback, useMemo, useState } from 'react'
import ComponentItem from './ComponentItem.jsx'
import RayTracer from './RayTracer.jsx'

export default function Grid({
  items,
  setItems,
  selectedId,
  setSelectedId,
  onChangeItem,
  gridSize,
  controls,
  onDropFromPalette
}) {
  const ref = useRef(null)
  const [isPanning, setIsPanning] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [lastPan, setLastPan] = useState(null)

  const snap = useCallback((v) => Math.round(v / gridSize) * gridSize, [gridSize])

  const onBackgroundClick = (e) => {
    if (e.target === ref.current) setSelectedId(null)
  }

  const handleDragMove = useCallback((id, dx, dy) => {
    setItems(prev =>
      prev.map(i =>
        i.id === id ? { ...i, x: snap(i.x + dx), y: snap(i.y + dy) } : i
      )
    )
  }, [setItems, snap])

  const onWheel = (e) => {
    if (!e.shiftKey) return
    e.preventDefault()
    const delta = Math.sign(e.deltaY) * 20
    setOffset(o => ({ x: o.x, y: o.y + delta }))
  }

  const bgStyle = useMemo(() => ({
    backgroundSize: `${gridSize}px ${gridSize}px`,
    transform: `translate(${offset.x}px, ${offset.y}px)`
  }), [gridSize, offset])

  const onMouseDownPan = (e) => {
    if (!e.altKey) return
    setIsPanning(true)
    setLastPan({ x: e.clientX, y: e.clientY })
  }
  const onMouseMovePan = (e) => {
    if (!isPanning) return
    setOffset(o => ({
      x: o.x + (e.clientX - lastPan.x),
      y: o.y + (e.clientY - lastPan.y)
    }))
    setLastPan({ x: e.clientX, y: e.clientY })
  }
  const onMouseUpPan = () => setIsPanning(false)

  // 🔹 NEW: Drop handler
  const handleDrop = (e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/x-optics-type')
    if (!type) return
    const rect = ref.current.getBoundingClientRect()
    const x = snap(e.clientX - rect.left)
    const y = snap(e.clientY - rect.top)
    onDropFromPalette(type, x, y)
  }

  const handleDragOver = (e) => e.preventDefault()

  return (
    <div
      className="grid"
      ref={ref}
      onClick={onBackgroundClick}
      onWheel={onWheel}
      onMouseDown={onMouseDownPan}
      onMouseMove={onMouseMovePan}
      onMouseUp={onMouseUpPan}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={bgStyle}
    >
      {items.map(item => (
        <ComponentItem
          key={item.id}
          item={item}
          selected={item.id === selectedId}
          onSelect={() => setSelectedId(item.id)}
          onDragMove={handleDragMove}
          onChange={patch => onChangeItem(item.id, patch)}
          gridSize={gridSize}
        />
      ))}
      <RayTracer items={items} controls={controls} />
      <div className="grid-legend">Alt-drag to pan • Shift-scroll to nudge Y</div>
    </div>
  )
}
