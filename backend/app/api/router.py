from fastapi import APIRouter

from app.api.routes import access, demo, health, identity, lots, operational_lots

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(identity.router, prefix="/api/v1")
api_router.include_router(access.router, prefix="/api/v1")
api_router.include_router(demo.router, prefix="/api/v1")
api_router.include_router(operational_lots.router, prefix="/api/v1")
api_router.include_router(lots.router, prefix="/api/v1")

