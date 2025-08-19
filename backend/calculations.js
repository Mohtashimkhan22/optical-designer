export function processOpticsData(sceneData) {
  const { components } = sceneData;

  const lenses = components.filter(o => o.type === "lens");
  const detectors = components.filter(o => o.type === "detector");
  const sources = components.filter(o => o.type === "source");

  // Generate rays from sources
  const rays = [];
  sources.forEach(src => {
    const numRays = src.props?.rays || 1;
    const spread = src.props?.spread || 0;
    for (let i = 0; i < numRays; i++) {
      // Spread rays evenly around source angle
      const angleOffset = spread === 0 ? 0 : ((i / (numRays - 1)) - 0.5) * spread;
      rays.push({
        id: `${src.id}_ray_${i}`,
        x: src.x,
        y: src.y,
        angle: (src.props?.angle || 0) + angleOffset
      });
    }
  });

  console.log(`\n📡 Starting optics calculations...`);
  console.log(`   ➡ Rays: ${rays.length}, Lenses: ${lenses.length}, Detectors: ${detectors.length}`);

  let results = [];

  rays.forEach((ray, index) => {
    console.log(`\n--- Processing Ray ${index + 1} (ID: ${ray.id}) ---`);
    console.log(`   Position: (${ray.x}, ${ray.y}), Angle: ${ray.angle}`);

    const intersections = lenses.map(lens => {
      const dx = lens.x - ray.x;
      const dy = lens.y - ray.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angleChange = Number(((Math.random() - 0.5) * 10).toFixed(2));

      console.log(`   🔍 Lens ${lens.id} → distance: ${distance.toFixed(2)}, angleChange: ${angleChange}`);

      return {
        lensId: lens.id,
        distance: Number(distance.toFixed(2)),
        angleChange
      };
    });

    const detectorHits = detectors.map(det => {
      const dx = det.x - ray.x;
      const dy = det.y - ray.y;
      const pathLength = Math.sqrt(dx * dx + dy * dy);
      const intensity = Number((100 / (1 + pathLength / 50)).toFixed(2));

      console.log(`   🎯 Detector ${det.id} → pathLength: ${pathLength.toFixed(2)}, intensity: ${intensity}`);

      return {
        detectorId: det.id,
        pathLength: Number(pathLength.toFixed(2)),
        intensity
      };
    });

    results.push({
      rayId: ray.id,
      intersections,
      detectorHits
    });
  });

  console.log("\n📊 Generating fake frequency sweep data...");
  const sweepData = Array.from({ length: 10 }, (_, i) => {
    const freq = 100 + i * 10;
    const value = Math.sin(i / 2) * 50 + 50;
    console.log(`   Freq ${freq} MHz → Value: ${value.toFixed(2)}`);
    return { freq, value: Number(value.toFixed(2)) };
  });

  console.log("\n✅ Optics calculation complete.\n");

  return {
    processedRays: results,
    sweepData
  };
}
