# simulation.py
import math

def run_simulation(project_json):
    components = project_json["components"]
    metadata = project_json["metadata"]

    # Simple ray model
    rays = []
    detectors = {}

    for comp in components:
        if comp["type"] == "source":
            for i in range(metadata["raysPerSource"]):
                angle = math.radians(metadata["angleOfIncidence"] + i)
                ray_end = (comp["x"] + 100*math.cos(angle), comp["y"] + 100*math.sin(angle))
                rays.append({
                    "start": (comp["x"], comp["y"]),
                    "end": ray_end,
                    "intensity": 1.0
                })

        if comp["type"] == "detector":
            detectors[comp["id"]] = 0.0

    # Fake interaction: if a ray ends near a detector, increment intensity
    for ray in rays:
        for comp in components:
            if comp["type"] == "detector":
                dx = ray["end"][0] - comp["x"]
                dy = ray["end"][1] - comp["y"]
                if math.sqrt(dx**2 + dy**2) < 30:
                    detectors[comp["id"]] += ray["intensity"]

    return {
        "raySegments": rays,
        "detectors": detectors
    }
