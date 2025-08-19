import React from 'react'

export default function Toolbar({ onDownload }) {
  return (
    <div className="toolbar">
      <div className="title">Optics Lab</div>
      <div className="spacer" />
      <button onClick={onDownload}>Download JSON</button>
    </div>
  )
}
