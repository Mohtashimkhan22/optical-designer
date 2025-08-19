/**
 * Export the setup to a structured JSON. This is a clean, adaptable shape:
 * - scene: meta + controls
 * - components: array with typed entries
 *
 * Easy to map to your final schema once shared.
 */
export function exportSetup(components, controls) {
  return {
    version: 1,
    scene: {
      controls: {
        incidenceDeg: controls.globalIncidenceDeg,
        sweepTHz: controls.sweep
      }
    },
    components: components.map(c => ({
      id: c.id,
      type: c.type,
      name: c.name,
      pose: { x: c.x, y: c.y, angleDeg: c.angle },
      props: c.props
    }))
  }
}
