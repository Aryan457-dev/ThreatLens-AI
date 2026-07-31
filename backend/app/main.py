from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
)


@app.get("/")
def root():
    return {
        "project": settings.APP_NAME,
        "status": "Running",
        "version": settings.APP_VERSION,
    }


app.include_router(api_router)