from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import engine

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    engine.dispose()


app = FastAPI(
    title="AlimentaBot API",
    version="0.1.0",
    description="API operacional em evolução; não operar doações reais sem validação aplicável.",
    lifespan=lifespan,
)
@app.middleware("http")
async def reject_oversized_payload(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > settings.max_request_body_bytes:
        return JSONResponse(status_code=413, content={"detail": "Payload excede o limite permitido."})
    return await call_next(request)


# CORS is registered last so it wraps every route, exception and payload-limit response.
# Origins remain explicit; never use a wildcard with an Authorization-bearing SPA.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Idempotency-Key",
        "X-Organization-Id",
        "X-Demo-Role",
        "X-Demo-Actor-Id",
        "X-Sanitary-Authorized",
    ],
)


app.include_router(api_router)
