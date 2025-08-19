# app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import OpticalProject
from simulation import run_simulation

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your frontend URL in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/simulate")
def simulate(project: OpticalProject):
    results = run_simulation(project.dict())
    return results
