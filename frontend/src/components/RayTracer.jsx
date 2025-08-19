import React, { useMemo } from 'react'
import { deg2rad, rad2deg, rotatePoint, lineIntersectSegment, reflectAngle, clamp } from '../utils/geometry.js'

/**
 * Simplified 2D ray engine:
 * - Sources emit N rays (from sweep points, or 1 if points=1) at globalIncidenceDeg.
 * - Mirrors: perfect line reflectors with "reflectivity" used as alpha.
 * - Lenses: ideal thin‑lens small‑angle approx: θ_out = θ_in - y/f in lens local frame.
 * - Detectors: passive; we draw ray hits (for visual; no accumulation yet).
 * - Stops after max bounces or when leaving canvas.
 */

const MAX_BOUNCES = 8

function frequencyToColor(THz) {
  // Map 380–750 THz to violet..red-ish
  const t = clamp((THz - 380) / (750 - 380), 0, 1)
  const hue = (1 - t) * 270 + t * 0 // naive hue map
  return `hsl(${hue} 100% 50%)`
}

function traceAll(items, controls, width, height) {
  const sources = items.filter(i => i.type === 'source')
  const sweep = controls.sweep
  const n = Math.max(1, sweep.points|0)
  const freqs = n === 1 ? [ (sweep.startTHz + sweep.stopTHz)/2 ] :
    [...Array(n)].map((_,k)=> sweep.startTHz + k*(sweep.stopTHz - sweep.startTHz)/(n-1))

  const rays = []
  for (const s of sources) {
    for (const f of freqs) {
      const angleDeg = (s.angle + controls.globalIncidenceDeg)
      rays.push(...traceSingleRay({ x: s.x, y: s.y, angleDeg, color: frequencyToColor(f) }, items, width, height))
    }
  }
  return rays
}

function traceSingleRay(ray0, items, width, height) {
  const segments = []
  let x = ray0.x, y = ray0.y
  let angleDeg = ray0.angleDeg
  let color = ray0.color

  for (let bounce=0; bounce<MAX_BOUNCES; bounce++) {
    // shoot a long segment and find nearest intersection
    const len = 2000
    const x2 = x + len * Math.cos(deg2rad(angleDeg))
    const y2 = y + len * Math.sin(deg2rad(angleDeg))

    let nearest = { t: 1e9, point: null, hit: null }
    for (const it of items) {
      if (it.type === 'mirror') {
        const p1 = localToWorld(it, {x:2, y:20})
        const p2 = localToWorld(it, {x:(it.props.length||96)+2, y:20})
        const hit = lineIntersectSegment({x1:x, y1:y, x2, y2}, p1, p2)
        if (hit && hit.t < nearest.t) nearest = { t: hit.t, point: hit.point, hit: { kind:'mirror', item:it, normalAngleDeg: it.angle + 90 } }
      }
      if (it.type === 'lens') {
        const p1 = localToWorld(it, {x:0, y:4})
        const p2 = localToWorld(it, {x:0, y:36})
        const hit = lineIntersectSegment({x1:x, y1:y, x2, y2}, p1, p2)
        if (hit && hit.t < nearest.t) nearest = { t: hit.t, point: hit.point, hit: { kind:'lens', item:it } }
      }
      if (it.type === 'detector') {
        const p1 = localToWorld(it, {x:0, y:12})
        const p2 = localToWorld(it, {x:(it.props.width||120), y:12})
        const hit = lineIntersectSegment({x1:x, y1:y, x2, y2}, p1, p2)
        if (hit && hit.t < nearest.t) nearest = { t: hit.t, point: hit.point, hit: { kind:'detector', item:it } }
      }
    }

    const endPoint = nearest.point ?? {x:x2, y:y2}
    segments.push({ x1:x, y1:y, x2:endPoint.x, y2:endPoint.y, color, alpha:1 })

    if (!nearest.hit) break
    // update for next leg
    const hit = nearest.hit
    x = endPoint.x; y = endPoint.y

    if (hit.kind === 'mirror') {
      angleDeg = reflectAngle(angleDeg, hit.normalAngleDeg)
      // reduce alpha by (1 - reflectivity) for illustration
      const R = hit.item.props.reflectivity ?? 0.95
      segments[segments.length-1].alpha = Math.max(0.15, R)
      continue
    }

    if (hit.kind === 'lens') {
      // thin‑lens small angle approx relative to lens axis
      const lens = hit.item
      const f = lens.props.focalLengthPx || 120
      // transform hit point into lens local coordinates
      const local = worldToLocal(lens, {x,y})
      // ray angle in lens local frame
      const thetaIn = deg2rad(angleDeg - lens.angle)
      // small‑angle: theta_out = theta_in - y/f
      const thetaOut = thetaIn - ( (local.y - 20) / f ) // center at y=20 of our glyph
      angleDeg = rad2deg(thetaOut) + lens.angle
      continue
    }

    if (hit.kind === 'detector') {
      // absorb and stop
      break
    }
  }

  // clip to viewport
  return segments.filter(s =>
    s.x1>=0 && s.x1<=width && s.y1>=0 && s.y1<=height ||
    s.x2>=0 && s.x2<=width && s.y2>=0 && s.y2<=height
  )
}

function localToWorld(item, p) {
  const c = { x: item.x, y: item.y }
  const centerLocal = { x: 20, y: 20 }
  const local = { x: p.x - centerLocal.x, y: p.y - centerLocal.y }
  const rot = rotatePoint(local.x, local.y, item.angle)
  return { x: c.x + rot.x, y: c.y + rot.y }
}
function worldToLocal(item, p) {
  const c = { x: item.x, y: item.y }
  const dx = p.x - c.x, dy = p.y - c.y
  const rot = rotatePoint(dx, dy, -item.angle)
  return { x: rot.x + 20, y: rot.y + 20 }
}

export default function RayTracer({ items, controls }) {
  const width = 1600, height = 900
  const segments = useMemo(()=> traceAll(items, controls, width, height), [items, controls])

  return (
    <svg className="rays" width={width} height={height}>
      {segments.map((s, i)=>(
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke={s.color} strokeOpacity={s.alpha} strokeWidth="2" />
      ))}
    </svg>
  )
}
