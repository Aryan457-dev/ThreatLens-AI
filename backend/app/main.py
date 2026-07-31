from fastapi import FastAPI
from app.api.router import api_router

app = FastAPI(
    title="ThreatLens AI",
    description="Enterprise Threat Intelligence & IOC Correlation Platform",
    version="0.1.0"
)


@app.get("/")
def root():
    return {
        "project": "ThreatLens AI",
        "status": "Running",
        "version": "0.1.0"
    }

app.include_router(api_router)
