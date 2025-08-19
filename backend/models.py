# models.py
from pydantic import BaseModel
from typing import List, Dict, Any

class Component(BaseModel):
    id: str
    type: str
    x: float
    y: float
    angle: float
    properties: Dict[str, Any]

class Sweep(BaseModel):
    start: float
    stop: float
    points: int

class Metadata(BaseModel):
    createdAt: str
    gridSize: int
    angleOfIncidence: float
    raysPerSource: int
    maxBounces: int
    sweep: Sweep

class OpticalProject(BaseModel):
    metadata: Metadata
    components: List[Component]
