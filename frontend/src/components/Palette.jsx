import React from 'react'

const palette = [
  { type: 'source', label: 'Source' },
  { type: 'mirror', label: 'Mirror' },
  { type: 'lens', label: 'Lens' },
  { type: 'detector', label: 'Detector' },
]

export default function Palette() {
  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('application/x-optics-type', type)
    // use transparent drag image to avoid offset issues
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
    e.dataTransfer.setDragImage(img, 0, 0)
  }

  return (
    <div className="palette">
      <div className="palette-title">Palette</div>
      {palette.map(p => (
        <div
          key={p.type}
          className="palette-item"
          draggable
          onDragStart={(e) => handleDragStart(e, p.type)}
        >
          {p.label}
        </div>
      ))}
      <div className="palette-hint">Drag an item into the grid</div>
    </div>
  )
}
