"""
pdfinity — FastAPI application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import auth, files, jobs, tools


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing special needed; DB is handled by Alembic migrations
    yield
    # Shutdown


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="PDF processing SaaS — merge, split, compress, rotate, OCR and more.",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    application.include_router(auth.router)
    application.include_router(files.router)
    application.include_router(jobs.router)
    application.include_router(tools.router)

    # ── Health ────────────────────────────────────────────────────────────────
    @application.get("/health", tags=["health"])
    def health():
        return {"status": "ok", "version": settings.APP_VERSION}

    return application


app = create_app()
