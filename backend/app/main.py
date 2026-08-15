"""
pdfinity — FastAPI application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Global error handler — always return JSON ──────────────────────────────
    @application.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        import logging, traceback
        logging.getLogger("pdfinity").error(
            f"Unhandled error on {request.method} {request.url}: {traceback.format_exc()}"
        )
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(exc)[:300]}"},
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

