import React from 'react'

function Row({ label, children }) {
  return (
    <label className="row">
      <span>{label}</span>
      <div>{children}</div>
    </label>
  )
}

export default function PropertiesPanel({ item, onChangeItem, onChangeProps, onDelete }) {
  if (!item) return <div className="panel"><div className="panel-title">Properties</div><div className="empty">Select a component</div></div>
  const num = (v)=> Number.isFinite(+v) ? +v : 0

  return (
    <div className="panel">
      <div className="panel-title">Properties</div>
      <Row label="Name">
        <input value={item.name} onChange={e=>onChangeItem(item.id,{name:e.target.value})}/>
      </Row>
      <Row label="X, Y (px)">
        <div className="xy">
          <input type="number" value={item.x} onChange={e=>onChangeItem(item.id,{x:num(e.target.value)})}/>
          <input type="number" value={item.y} onChange={e=>onChangeItem(item.id,{y:num(e.target.value)})}/>
        </div>
      </Row>
      <Row label="Angle (deg)">
        <input type="number" value={item.angle} onChange={e=>onChangeItem(item.id,{angle:num(e.target.value)})}/>
      </Row>

      {item.type === 'mirror' && (
        <>
          <Row label="Reflectivity (0–1)">
            <input type="number" min="0" max="1" step="0.01" value={item.props.reflectivity}
                   onChange={e=>onChangeProps(item.id,{reflectivity:num(e.target.value)})}/>
          </Row>
          <Row label="Length (px)">
            <input type="number" value={item.props.length}
                   onChange={e=>onChangeProps(item.id,{length:num(e.target.value)})}/>
          </Row>
        </>
      )}

      {item.type === 'lens' && (
        <>
          <Row label="Focal length (px)">
            <input type="number" value={item.props.focalLengthPx}
                   onChange={e=>onChangeProps(item.id,{focalLengthPx:num(e.target.value)})}/>
          </Row>
          <Row label="Aperture (px)">
            <input type="number" value={item.props.aperturePx}
                   onChange={e=>onChangeProps(item.id,{aperturePx:num(e.target.value)})}/>
          </Row>
        </>
      )}

      {item.type === 'source' && (
        <>
          <Row label="Power (arb)">
            <input type="number" step="0.1" value={item.props.power}
                   onChange={e=>onChangeProps(item.id,{power:num(e.target.value)})}/>
          </Row>
          <Row label="Wavelength (nm)">
            <input type="number" value={item.props.wavelengthNm}
                   onChange={e=>onChangeProps(item.id,{wavelengthNm:num(e.target.value)})}/>
          </Row>
          <Row label="Divergence (deg)">
            <input type="number" step="0.1" value={item.props.divergenceDeg}
                   onChange={e=>onChangeProps(item.id,{divergenceDeg:num(e.target.value)})}/>
          </Row>
        </>
      )}

      {item.type === 'detector' && (
        <>
          <Row label="Width (px)">
            <input type="number" value={item.props.width}
                   onChange={e=>onChangeProps(item.id,{width:num(e.target.value)})}/>
          </Row>
          <Row label="Height (px)">
            <input type="number" value={item.props.height}
                   onChange={e=>onChangeProps(item.id,{height:num(e.target.value)})}/>
          </Row>
          <Row label="Responsivity (arb)">
            <input type="number" step="0.01" value={item.props.responsivity}
                   onChange={e=>onChangeProps(item.id,{responsivity:num(e.target.value)})}/>
          </Row>
        </>
      )}

      <button className="danger" onClick={()=>onDelete(item.id)}>Delete</button>
    </div>
  )
}
