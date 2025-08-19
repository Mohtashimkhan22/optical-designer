import React, { useState, useRef, useEffect } from "react";
import "./app.css";

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function deg2rad(d) {
  return (d * Math.PI) / 180;
}

function rad2deg(r) {
  return (r * 180) / Math.PI;
}

function length(v) {
  return Math.hypot(v.x, v.y);
}

function normalize(v) {
  const L = length(v) || 1;
  return { x: v.x / L, y: v.y / L };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

function mul(a, s) {
  return { x: a.x * s, y: a.y * s };
}

function reflect(dir, normal) {
  const dDotN = dot(dir, normal);
  return sub(dir, mul(normal, 2 * dDotN));
}

function intersectRaySegment(p, dir, a, b) {
  const v1 = sub(p, a);
  const v2 = sub(b, a);
  const v3 = { x: -dir.y, y: dir.x };
  const denom = dot(v2, v3);
  if (Math.abs(denom) < 1e-6) return null;
  const t = cross(v2, v1) / denom;
  const u = dot(v1, v3) / denom;
  if (t >= 1e-6 && u >= 0 && u <= 1) {
    return { t, point: add(p, mul(dir, t)), u };
  }
  return null;
}

function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

function intersectRayVerticalPlane(p, dir, x0, yCenter, height) {
  if (Math.abs(dir.x) < 1e-6) return null;
  const t = (x0 - p.x) / dir.x;
  if (t < 1e-6) return null;
  const y = p.y + dir.y * t;
  if (y >= yCenter - height / 2 - 1e-6 && y <= yCenter + height / 2 + 1e-6) {
    return { t, point: { x: x0, y } };
  }
  return null;
}

function intersectRayCircle(p, dir, center, r) {
  const oc = sub(p, center);
  const a = dot(dir, dir);
  const b = 2 * dot(oc, dir);
  const c = dot(oc, oc) - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const sqrtD = Math.sqrt(disc);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);
  const t = t1 > 1e-6 ? t1 : t2 > 1e-6 ? t2 : null;
  if (t === null) return null;
  return { t, point: add(p, mul(dir, t)) };
}

function freqTHzToWavelengthNm(freqTHz) {
  return 299792.458 / freqTHz;
}

function wavelengthToRGB(wavelength) {
  let r = 0,
    g = 0,
    b = 0;
  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0.0;
    b = 1.0;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0.0;
    g = (wavelength - 440) / (490 - 440);
    b = 1.0;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0.0;
    g = 1.0;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1.0;
    b = 0.0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1.0;
    g = -(wavelength - 645) / (645 - 580);
    b = 0.0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1.0;
    g = 0.0;
    b = 0.0;
  }
  let factor = 1.0;
  if (wavelength >= 380 && wavelength < 420)
    factor = 0.3 + (0.7 * (wavelength - 380)) / (420 - 380);
  if (wavelength > 700 && wavelength <= 780)
    factor = 0.3 + (0.7 * (780 - wavelength)) / (780 - 700);
  r = Math.round(255 * Math.pow(r * factor, 0.8));
  g = Math.round(255 * Math.pow(g * factor, 0.8));
  b = Math.round(255 * Math.pow(b * factor, 0.8));
  return `rgb(${r},${g},${b})`;
}

const DEFAULT_COMPONENTS = {
  source: (x, y) => ({
    id: uid("src"),
    type: "source",
    x,
    y,
    rotation: 0,
    props: { angle: 0, spread: 10, power: 1, rays: 21 },
  }),
  mirror: (x, y) => ({
    id: uid("mirror"),
    type: "mirror",
    x,
    y,
    rotation: 0,
    length: 160,
    props: { reflectivity: 0.98 },
  }),
  lens: (x, y) => ({
    id: uid("lens"),
    type: "lens",
    x,
    y,
    rotation: 0,
    height: 120,
    props: { focalLength: 120 },
  }),
  detector: (x, y) => ({
    id: uid("det"),
    type: "detector",
    x,
    y,
    rotation: 0,
    props: { radius: 18, sensitivity: 1 },
  }),
};

export default function App() {
  const [components, setComponents] = useState(() => {
    return [
      DEFAULT_COMPONENTS.source(80, 200),
      (() => {
        const m = DEFAULT_COMPONENTS.mirror(300, 200);
        m.rotation = 30;
        return m;
      })(),
      DEFAULT_COMPONENTS.lens(520, 200),
      DEFAULT_COMPONENTS.detector(760, 200),
    ];
  });

  async function sendSceneData(sceneData) {
    const res = await fetch("http://localhost:5000/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sceneData),
    });

    const data = await res.json();
    console.log("Processed Data:", data);
  }

  const [selectedId, setSelectedId] = useState(null);
  const [placingType, setPlacingType] = useState(null);
  const [incidenceOffset, setIncidenceOffset] = useState(0);
  const [sweepConfig, setSweepConfig] = useState({
    start: 430,
    stop: 770,
    points: 10,
  });
  const [raySegments, setRaySegments] = useState([]);
  const [detectorReadings, setDetectorReadings] = useState({});
  const [sweepResults, setSweepResults] = useState(null);
  const svgRef = useRef(null);
  const gridRef = useRef(null);

  const GRID_W = 1000;
  const GRID_H = 500;

  useEffect(() => {
    computeAndRenderRays();
  }, [components, incidenceOffset]);

  function onPaletteDragStart(e, type) {
    e.dataTransfer.setData("component-type", type);
    e.dataTransfer.effectAllowed = "copy";
    setPlacingType(type);
  }

  function onGridDragOver(e) {
    e.preventDefault();
  }

  function clientToGridCoords(clientX, clientY) {
    const rect = gridRef.current.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);
    return { x, y };
  }

  function onGridDrop(e) {
    e.preventDefault();
    const type = e.dataTransfer.getData("component-type") || placingType;
    const pos = clientToGridCoords(e.clientX, e.clientY);
    if (!type) return;
    const factory = DEFAULT_COMPONENTS[type];
    if (factory) {
      const comp = factory(pos.x, pos.y);
      setComponents((prev) => [...prev, comp]);
      setSelectedId(comp.id);
    }
    setPlacingType(null);
  }

  function updateComponent(id, patch) {
    setComponents((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, ...patch, props: { ...c.props, ...(patch.props || {}) } }
          : c
      )
    );
  }

  function startDragComponent(e, id) {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(id);
    const rect = gridRef.current.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY };
    const comp = components.find((c) => c.id === id);
    const orig = { x: comp.x, y: comp.y };
    function move(ev) {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      const newX = clamp(orig.x + dx, 0, rect.width);
      const newY = clamp(orig.y + dy, 0, rect.height);
      updateComponent(id, { x: newX, y: newY });
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function startRotateComponent(e, id) {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(id);
    const comp = components.find((c) => c.id === id);
    const rect = gridRef.current.getBoundingClientRect();
    const center = { x: rect.left + comp.x, y: rect.top + comp.y };
    function move(ev) {
      const angle = rad2deg(
        Math.atan2(ev.clientY - center.y, ev.clientX - center.x)
      );
      updateComponent(id, { rotation: angle });
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function computeAndRenderRays(freqWavelengthNm = null) {
    const segs = [];
    const dets = {};

    const scene = components;
    const MAX_BOUNCES = 6;

    const mirrors = scene
      .filter((s) => s.type === "mirror")
      .map((m) => {
        const rad = deg2rad(m.rotation);
        const dx = Math.cos(rad) * (m.length / 2);
        const dy = Math.sin(rad) * (m.length / 2);
        return {
          ...m,
          a: { x: m.x - dx, y: m.y - dy },
          b: { x: m.x + dx, y: m.y + dy },
          normal: normalize({ x: -dy, y: dx }),
        };
      });
    const lenses = scene.filter((s) => s.type === "lens");
    const detectors = scene.filter((s) => s.type === "detector");
    const sources = scene.filter((s) => s.type === "source");

    for (const det of detectors) {
      dets[det.id] = 0;
    }

    for (const src of sources) {
      const baseAngleDeg =
        (src.rotation || 0) + (src.props?.angle || 0) + incidenceOffset;
      const spread = src.props?.spread ?? 0;
      const raysCount = src.props?.rays ?? 21;
      const half = Math.floor((raysCount - 1) / 2);
      for (let r = 0; r < raysCount; r++) {
        const frac = raysCount === 1 ? 0 : (r - half) / half; // -1..1
        const angle = baseAngleDeg + frac * spread;
        let dir = normalize({
          x: Math.cos(deg2rad(angle)),
          y: Math.sin(deg2rad(angle)),
        });
        let pos = { x: src.x, y: src.y };
        let intensity = src.props?.power ?? 1;

        const rayColor = freqWavelengthNm
          ? wavelengthToRGB(freqWavelengthNm)
          : "rgba(0,200,80,0.95)";

        for (let bounce = 0; bounce <= MAX_BOUNCES; bounce++) {
          let closest = {
            t: Infinity,
            type: null,
            obj: null,
            point: null,
            extra: null,
          };
          for (const m of mirrors) {
            const inter = intersectRaySegment(pos, dir, m.a, m.b);
            if (inter && inter.t < closest.t) {
              closest = {
                t: inter.t,
                type: "mirror",
                obj: m,
                point: inter.point,
                u: inter.u,
              };
            }
          }
          for (const l of lenses) {
            const inter = intersectRayVerticalPlane(
              pos,
              dir,
              l.x,
              l.y,
              l.height
            );
            if (inter && inter.t < closest.t) {
              closest = {
                t: inter.t,
                type: "lens",
                obj: l,
                point: inter.point,
              };
            }
          }
          for (const d of detectors) {
            const inter = intersectRayCircle(
              pos,
              dir,
              { x: d.x, y: d.y },
              d.props?.radius ?? 18
            );
            if (inter && inter.t < closest.t) {
              closest = {
                t: inter.t,
                type: "detector",
                obj: d,
                point: inter.point,
              };
            }
          }
          const tx =
            dir.x > 0
              ? (GRID_W - pos.x) / dir.x
              : dir.x < 0
              ? (0 - pos.x) / dir.x
              : Infinity;
          const ty =
            dir.y > 0
              ? (GRID_H - pos.y) / dir.y
              : dir.y < 0
              ? (0 - pos.y) / dir.y
              : Infinity;
          const tBound = Math.min(tx, ty);
          if (tBound > 0 && tBound < closest.t) {
            const pEnd = add(pos, mul(dir, tBound));
            segs.push({
              x1: pos.x,
              y1: pos.y,
              x2: pEnd.x,
              y2: pEnd.y,
              color: rayColor,
              intensity,
            });
            break;
          }
          if (!closest.obj) break;

          segs.push({
            x1: pos.x,
            y1: pos.y,
            x2: closest.point.x,
            y2: closest.point.y,
            color: rayColor,
            intensity,
          });

          if (closest.type === "detector") {
            dets[closest.obj.id] +=
              intensity * (closest.obj.props?.sensitivity ?? 1);
            break;
          }

          if (closest.type === "mirror") {
            const m = closest.obj;
            const normal = m.normal;
            dir = normalize(reflect(dir, normal));
            pos = add(closest.point, mul(dir, 0.5));
            intensity *= m.props?.reflectivity ?? 1;
            if (intensity < 1e-3) break;
            continue;
          }

          if (closest.type === "lens") {
            const l = closest.obj;
            const focal = l.props?.focalLength ?? 100;
            const center = { x: l.x, y: l.y };
            const focalPoint = { x: l.x + focal, y: l.y };
            dir = normalize(sub(focalPoint, closest.point));
            pos = add(closest.point, mul(dir, 0.5));
            continue;
          }

          break;
        }
      }
    }

    setRaySegments(segs);
    setDetectorReadings(dets);
  }

  function runSweep() {
    const startNm = Number(sweepConfig.start) || 430;
    const stopNm = Number(sweepConfig.stop) || 770;
    const points = Math.max(2, Number(sweepConfig.points) || 10);
    const wavelengths = [];
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      wavelengths.push(startNm + t * (stopNm - startNm));
    }
    const results = [];
    for (const wl of wavelengths) {
      computeAndRenderRays(wl);
      const dets = computeDetectorReadingsForWavelength(wl);
      results.push({ wavelength: wl, detectors: dets });
    }
    setSweepResults(results);
  }

  function computeDetectorReadingsForWavelength(wl) {
    const scene = components;
    const MAX_BOUNCES = 6;
    const dets = {};
    for (const d of scene.filter((s) => s.type === "detector")) dets[d.id] = 0;
    const mirrors = scene
      .filter((s) => s.type === "mirror")
      .map((m) => {
        const rad = deg2rad(m.rotation);
        const dx = Math.cos(rad) * (m.length / 2);
        const dy = Math.sin(rad) * (m.length / 2);
        return {
          ...m,
          a: { x: m.x - dx, y: m.y - dy },
          b: { x: m.x + dx, y: m.y + dy },
          normal: normalize({ x: -dy, y: dx }),
        };
      });
    const lenses = scene.filter((s) => s.type === "lens");
    const detectors = scene.filter((s) => s.type === "detector");
    const sources = scene.filter((s) => s.type === "source");

    for (const src of sources) {
      const baseAngleDeg =
        (src.rotation || 0) + (src.props?.angle || 0) + incidenceOffset;
      const spread = src.props?.spread ?? 0;
      const raysCount = src.props?.rays ?? 21;
      const half = Math.floor((raysCount - 1) / 2);
      for (let r = 0; r < raysCount; r++) {
        const frac = raysCount === 1 ? 0 : (r - half) / half; // -1..1
        const angle = baseAngleDeg + frac * spread;
        let dir = normalize({
          x: Math.cos(deg2rad(angle)),
          y: Math.sin(deg2rad(angle)),
        });
        let pos = { x: src.x, y: src.y };
        let intensity = src.props?.power ?? 1;
        for (let bounce = 0; bounce <= MAX_BOUNCES; bounce++) {
          let closest = { t: Infinity, type: null, obj: null, point: null };
          for (const m of mirrors) {
            const inter = intersectRaySegment(pos, dir, m.a, m.b);
            if (inter && inter.t < closest.t) {
              closest = {
                t: inter.t,
                type: "mirror",
                obj: m,
                point: inter.point,
              };
            }
          }
          for (const l of lenses) {
            const inter = intersectRayVerticalPlane(
              pos,
              dir,
              l.x,
              l.y,
              l.height
            );
            if (inter && inter.t < closest.t) {
              closest = {
                t: inter.t,
                type: "lens",
                obj: l,
                point: inter.point,
              };
            }
          }
          for (const d of detectors) {
            const inter = intersectRayCircle(
              pos,
              dir,
              { x: d.x, y: d.y },
              d.props?.radius ?? 18
            );
            if (inter && inter.t < closest.t) {
              closest = {
                t: inter.t,
                type: "detector",
                obj: d,
                point: inter.point,
              };
            }
          }
          const tx =
            dir.x > 0
              ? (GRID_W - pos.x) / dir.x
              : dir.x < 0
              ? (0 - pos.x) / dir.x
              : Infinity;
          const ty =
            dir.y > 0
              ? (GRID_H - pos.y) / dir.y
              : dir.y < 0
              ? (0 - pos.y) / dir.y
              : Infinity;
          const tBound = Math.min(tx, ty);
          if (tBound > 0 && tBound < closest.t) {
            break;
          }
          if (!closest.obj) break;

          if (closest.type === "detector") {
            dets[closest.obj.id] +=
              intensity * (closest.obj.props?.sensitivity ?? 1);
            break;
          }
          if (closest.type === "mirror") {
            const m = closest.obj;
            const normal = m.normal;
            dir = normalize(reflect(dir, normal));
            pos = add(closest.point, mul(dir, 0.5));
            intensity *= m.props?.reflectivity ?? 1;
            if (intensity < 1e-3) break;
            continue;
          }
          if (closest.type === "lens") {
            const l = closest.obj;
            const focal = l.props?.focalLength ?? 100;
            const focalPoint = { x: l.x + focal, y: l.y };
            dir = normalize(sub(focalPoint, closest.point));
            pos = add(closest.point, mul(dir, 0.5));
            continue;
          }
          break;
        }
      }
    }

    return dets;
  }

  function deleteSelected() {
    if (!selectedId) return;
    setComponents((prev) => prev.filter((c) => c.id !== selectedId));
    setSelectedId(null);
  }

  function exportJSON() {
    const payload = {
      meta: {
        createdAt: new Date().toISOString(),
        grid: { width: GRID_W, height: GRID_H },
      },
      components: components.map((c) => ({
        id: c.id,
        type: c.type,
        x: c.x,
        y: c.y,
        rotation: c.rotation,
        props: c.props,
        length: c.length,
        height: c.height,
      })),
      controls: { incidenceOffset, sweepConfig },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "optics_setup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderComponentSVG(c) {
    const common = { cursor: "grab" };
    if (c.type === "source") {
      return (
        <g
          key={c.id}
          transform={`translate(${c.x}, ${c.y}) rotate(${c.rotation})`}
        >
          <circle
            r={14}
            cx={0}
            cy={0}
            fill="#f6ad55"
            stroke="#C05621"
            strokeWidth={2}
          />
          <path
            d={`M -8 6 L 16 0 L -8 -6 Z`}
            fill="#fff"
            opacity={0.9}
            transform={`rotate(${c.props.angle + incidenceOffset})`}
          />
        </g>
      );
    }
    if (c.type === "mirror") {
      const rad = deg2rad(c.rotation);
      const dx = Math.cos(rad) * (c.length / 2);
      const dy = Math.sin(rad) * (c.length / 2);
      const x1 = c.x - dx;
      const y1 = c.y - dy;
      const x2 = c.x + dx;
      const y2 = c.y + dy;
      return (
        <g key={c.id}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#94a3b8"
            strokeWidth={6}
            strokeLinecap="round"
          />
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#0f172a"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.2}
          />
        </g>
      );
    }
    if (c.type === "lens") {
      const h = c.height || 120;
      return (
        <g key={c.id} transform={`translate(${c.x}, ${c.y})`}>
          <rect
            x={-6}
            y={-h / 2}
            width={12}
            height={h}
            rx={6}
            fill="#bfdbfe"
            stroke="#1e40af"
            strokeWidth={2}
          />
          <text x={+14} y={4} fontSize={12} fill="#0f172a">
            f={c.props.focalLength}
          </text>
        </g>
      );
    }
    if (c.type === "detector") {
      return (
        <g key={c.id} transform={`translate(${c.x}, ${c.y})`}>
          <circle r={c.props.radius ?? 18} fill="#fde68a" stroke="#92400e" />
          <rect
            x={-8}
            y={-6}
            width={16}
            height={12}
            rx={2}
            fill="#fff"
            opacity={0.6}
          />
        </g>
      );
    }
    return null;
  }

  const [processedRays, setProcessedRays] = useState([]);
  const [sweepData, setSweepData] = useState([]);

  const handleProcessScene = async () => {
    try {
      const payload = {
        components, // ✅ matches backend now
        controls: { incidenceOffset, sweepConfig },
      };

      console.log("Sending scene data to backend:", payload);

      const response = await fetch("https://optical-designer-2.onrender.com/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      console.log("Received response from backend:", response);

      if (!response.ok) {
        throw new Error("Failed to process scene");
      }

      const result = await response.json();
      setProcessedRays(result.processedRays);
      setSweepData(result.sweepData);
      console.log("Processed rays:", result.processedRays);
      console.log("Sweep data:", result.sweepData);
    } catch (err) {
      console.error("Error processing scene:", err);
    }
  };

  return (
    <div className="opticslab-container">
      <h1 className="opticslab-title">OpticsLab — Drag & Drop Grid</h1>
      <div className="opticslab-main">
        <div className="palette">
          <h2 className="section-title">Palette</h2>
          <div className="palette-items">
            {["source", "mirror", "lens", "detector"].map((type) => (
              <div
                key={type}
                className="palette-item"
                draggable
                onDragStart={(e) => onPaletteDragStart(e, type)}
                onClick={() => {
                  const center = { x: GRID_W * 0.2, y: GRID_H * 0.5 };
                  const comp = DEFAULT_COMPONENTS[type](center.x, center.y);
                  setComponents((prev) => [...prev, comp]);
                  setSelectedId(comp.id);
                }}
              >
                <div className="palette-item-label">{type}</div>
                <div className="palette-item-drag">drag</div>
              </div>
            ))}
          </div>

          <hr className="divider" />

          <h3 className="section-title">Controls</h3>
          <div className="control-group">
            <label>Incidence offset (deg)</label>
            <input
              type="range"
              min={-180}
              max={180}
              value={incidenceOffset}
              onChange={(e) => setIncidenceOffset(Number(e.target.value))}
            />
            <div className="small-text">
              {incidenceOffset}° applied to source angles
            </div>
          </div>

          <div className="control-group">
            <label>Sweep (wavelength nm)</label>
            <div className="sweep-inputs">
              <input
                value={sweepConfig.start}
                onChange={(e) =>
                  setSweepConfig((s) => ({ ...s, start: e.target.value }))
                }
              />
              <input
                value={sweepConfig.stop}
                onChange={(e) =>
                  setSweepConfig((s) => ({ ...s, stop: e.target.value }))
                }
              />
              <input
                value={sweepConfig.points}
                onChange={(e) =>
                  setSweepConfig((s) => ({ ...s, points: e.target.value }))
                }
              />
            </div>
            <button className="btn-primary" onClick={runSweep}>
              Run Sweep
            </button>
          </div>

          <div className="control-group">
            <button className="btn" onClick={() => computeAndRenderRays()}>
              Update Rays
            </button>
            <button className="btn-success" onClick={exportJSON}>
              Download JSON
            </button>
          </div>

          <div className="status-info">
            <div>
              Selected: <span>{selectedId ?? "—"}</span>
            </div>
            <div>
              Components: <span>{components.length}</span>
            </div>
          </div>
        </div>

        <div className="canvas-area">
          <div
            ref={gridRef}
            onDragOver={onGridDragOver}
            onDrop={onGridDrop}
            className="canvas-grid"
          >
            <svg ref={svgRef} width={GRID_W} height={GRID_H}>
              <defs>
                <pattern
                  id="smallGrid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="0.5"
                  />
                </pattern>
                <pattern
                  id="grid"
                  width="100"
                  height="100"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="100" height="100" fill="url(#smallGrid)" />
                  <path
                    d="M 100 0 L 0 0 0 100"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width={GRID_W} height={GRID_H} fill="url(#grid)" />
              <g>
                {raySegments.map((s, i) => (
                  <line
                    key={i}
                    x1={s.x1}
                    y1={s.y1}
                    x2={s.x2}
                    y2={s.y2}
                    stroke={s.color}
                    strokeWidth={Math.max(1, 2 * (s.intensity || 1))}
                    strokeOpacity={clamp(s.intensity || 1, 0.05, 1)}
                  />
                ))}
              </g>
              <g>
                {components.map((c) => (
                  <g
                    key={c.id}
                    onPointerDown={(e) => startDragComponent(e, c.id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(c.id);
                    }}
                  >
                    {renderComponentSVG(c)}
                    {selectedId === c.id && (
                      <g>
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={24}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth={1}
                          strokeDasharray="4 4"
                        />
                        <circle
                          cx={c.x}
                          cy={c.y - 40}
                          r={8}
                          fill="#fff"
                          stroke="#374151"
                          strokeWidth={1}
                          onPointerDown={(e) => startRotateComponent(e, c.id)}
                          className="rotate-handle"
                        />
                      </g>
                    )}
                  </g>
                ))}
              </g>
            </svg>
          </div>

          <div className="bottom-panel">
            <div className="bottom-section">
              <h3>Detector readings</h3>
              <div className="info-list">
                {Object.keys(detectorReadings).length === 0 ? (
                  <div className="empty-text">No detectors</div>
                ) : (
                  Object.entries(detectorReadings).map(([id, val]) => (
                    <div key={id} className="info-row">
                      <div>{id}</div>
                      <div>{val.toFixed(3)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bottom-section">
              <h3>Sweep results</h3>
              <div className="scroll-box">
                {sweepResults ? (
                  sweepResults.map((row, i) => (
                    <div key={i} className="sweep-row">
                      <div>{row.wavelength.toFixed(1)} nm</div>
                      <div>
                        {Object.entries(row.detectors)
                          .map(([k, v]) => `${k}: ${v.toFixed(3)}`)
                          .join(" — ")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-text">No sweep run</div>
                )}
              </div>
            </div>

            <div className="bottom-section flex-1">
              <h3>Scene JSON</h3>
              <textarea
                readOnly
                value={JSON.stringify(
                  { components, controls: { incidenceOffset, sweepConfig } },
                  null,
                  2
                )}
              />
            </div>
          </div>
        </div>

        <div className="inspector">
          <h2 className="section-title">Inspector</h2>
          {selectedId ? (
            (() => {
              const c = components.find((x) => x.id === selectedId);
              if (!c) return <div className="empty-text">(not found)</div>;
              return (
                <div>
                  <div>ID: {c.id}</div>
                  <label>Type</label>
                  <div>{c.type}</div>
                  <label>Position</label>
                  <div className="position-inputs">
                    <input
                      value={Math.round(c.x)}
                      onChange={(e) =>
                        updateComponent(c.id, { x: Number(e.target.value) })
                      }
                    />
                    <input
                      value={Math.round(c.y)}
                      onChange={(e) =>
                        updateComponent(c.id, { y: Number(e.target.value) })
                      }
                    />
                  </div>
                  <label>Rotation (deg)</label>
                  <input
                    value={Math.round(c.rotation || 0)}
                    onChange={(e) =>
                      updateComponent(c.id, {
                        rotation: Number(e.target.value),
                      })
                    }
                  />
                  <div className="btn-group">
                    <button className="btn-danger" onClick={deleteSelected}>
                      Delete
                    </button>
                    <button className="btn" onClick={() => setSelectedId(null)}>
                      Deselect
                    </button>
                    <button
                      className="btn"
                      onClick={() => computeAndRenderRays()}
                    >
                      Update Rays
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="empty-text">
              Select an object on the canvas to edit its properties.
            </div>
          )}
        </div>
      </div>
      <div className="results-section">
        <button className="btn-backend" onClick={handleProcessScene}>
          Run Backend Processing
        </button>
        <h3>Processed Rays</h3>
        {processedRays && processedRays.length > 0 ? (
          <ul>
            {processedRays.map((ray) => (
              <li key={ray.rayId}>
                <strong>Ray {ray.rayId}</strong>
                <ul>
                  {ray.intersections.map((hit, i) => (
                    <li key={i}>
                      Lens {hit.lensId} → Distance: {hit.distance} px, ΔAngle:{" "}
                      {hit.angleChange}°
                    </li>
                  ))}
                  {ray.detectorHits.map((det, i) => (
                    <li key={`det-${i}`}>
                      Detector {det.detectorId} → Path: {det.pathLength} px,
                      Intensity: {det.intensity}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <p>No rays processed.</p>
        )}

        <h3>Frequency Sweep Data</h3>
        {sweepData && sweepData.length > 0 ? (
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Frequency (MHz)</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {sweepData.map((point, idx) => (
                <tr key={idx}>
                  <td>{point.freq}</td>
                  <td>{point.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No sweep data available.</p>
        )}
      </div>
    </div>
  );
}
