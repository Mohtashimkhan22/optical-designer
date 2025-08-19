import React from 'react'

export default function ControlsPanel({ controls, setControls }) {
  const set = (patch) => setControls(c => ({ ...c, ...patch }))
  const setSweep = (patch) => setControls(c => ({ ...c, sweep: { ...c.sweep, ...patch }}))

  return (
    <div className="panel">
      <div className="panel-title">Global Controls</div>

      <label className="row">
        <span>Angle of Incidence (deg)</span>
        <input type="number" value={controls.globalIncidenceDeg}
               onChange={e=>set({globalIncidenceDeg: +e.target.value || 0})}/>
      </label>

      <div className="subhead">Frequency Sweep (THz)</div>
      <label className="row">
        <span>Start</span>
        <input type="number" value={controls.sweep.startTHz}
               onChange={e=>setSweep({startTHz: +e.target.value || 0})}/>
      </label>
      <label className="row">
        <span>Stop</span>
        <input type="number" value={controls.sweep.stopTHz}
               onChange={e=>setSweep({stopTHz: +e.target.value || 0})}/>
      </label>
      <label className="row">
        <span>Points</span>
        <input type="number" min="1" value={controls.sweep.points}
               onChange={e=>setSweep({points: Math.max(1, +e.target.value || 1)})}/>
      </label>
      <div className="hint">Rays will be color‑coded by frequency.</div>
    </div>
  )
}
