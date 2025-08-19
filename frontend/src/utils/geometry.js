export const deg2rad = d => d * Math.PI / 180
export const rad2deg = r => r * 180 / Math.PI
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

export function rotatePoint(x, y, angleDeg) {
  const a = deg2rad(angleDeg)
  const ca = Math.cos(a), sa = Math.sin(a)
  return { x: x*ca - y*sa, y: x*sa + y*ca }
}

export function reflectAngle(incidenceDeg, normalDeg) {
  // reflection: θ_out = 2*φ - θ_in, where φ is normal angle
  const thetaIn = deg2rad(incidenceDeg)
  const phi = deg2rad(normalDeg)
  const thetaOut = 2*phi - thetaIn
  return rad2deg(thetaOut)
}

// Ray/segment intersection: return {t, point}
export function lineIntersectSegment(ray, p1, p2) {
  const { x1, y1, x2, y2 } = ray
  const r = { x: x2 - x1, y: y2 - y1 }
  const s = { x: p2.x - p1.x, y: p2.y - p1.y }
  const rxs = r.x*s.y - r.y*s.x
  const qp = { x: p1.x - x1, y: p1.y - y1 }
  const qpxr = qp.x*r.y - qp.y*r.x
  if (Math.abs(rxs) < 1e-6) return null
  const t = (qp.x*s.y - qp.y*s.x) / rxs
  const u = qpxr / rxs
  if (t > 1e-6 && u >= 0 && u <= 1) {
    return { t, point: { x: x1 + t*r.x, y: y1 + t*r.y } }
  }
  return null
}
