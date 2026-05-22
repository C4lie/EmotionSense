"""
app/main.py

FastAPI application factory and entry point.

Responsibilities:
  - Create and configure the FastAPI app instance
  - Register all middleware (CORS, request logging)
  - Register all API routers under /api prefix
  - Define application lifespan (startup/shutdown events)
  - Provide health check and root endpoints
  - Configure Loguru for structured logging

Architecture principle: keep this file thin.
All business logic lives in services. All routing in routes/*.
"""

import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app.core.config import settings
from app.core.database import init_db
from app.middleware.logging import RequestLoggingMiddleware
from app.routes.auth import router as auth_router
from app.routes.detect import router as detect_router
from app.routes.sessions import router as sessions_router
from app.routes.analytics import router as analytics_router
from app.routes.scripts import router as scripts_router
from app.routes.subscription import router as subscription_router
from app.routes.tone_analysis import router as tone_router


# ─── Logging Configuration ────────────────────────────────────────────────────
def configure_logging() -> None:
    """
    Configure Loguru as the application logger.

    - Removes the default stderr handler
    - Adds a formatted stdout handler with colorized output in development
    - Format includes timestamp, level, module, and message
    """
    logger.remove()  # Remove default handler
    logger.add(
        sys.stdout,
        level="DEBUG" if settings.APP_DEBUG else "INFO",
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{line}</cyan> - "
            "<level>{message}</level>"
        ),
        colorize=True,
    )
    logger.info(f"EmotionSense AI starting in [{settings.APP_ENV.upper()}] mode")


# ─── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.

    Startup:
      1. Configure logging
      2. Initialize database tables (creates if not exist)

    Shutdown:
      - Graceful cleanup (connection pool disposal handled by SQLAlchemy)
    """
    # ── Startup ──
    configure_logging()

    # Database initialisation
    logger.info("Initializing database tables...")
    try:
        await init_db()
        logger.info("Database initialization complete.")
    except Exception as exc:
        logger.warning(
            f"Database initialization failed (DB may not be reachable): {exc}. "
            "Server starting without DB connection — ensure DATABASE_URL is correct."
        )

    # AI Model warm-up — run in thread pool to avoid blocking async event loop
    # TensorFlow/DeepFace model loading is CPU-bound and synchronous.
    import asyncio
    from app.services.emotion_service import emotion_service

    try:
        emotion_service.load()  # Load OpenCV cascade (fast, sync OK)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, emotion_service.warm_up)  # DeepFace in thread
    except Exception as exc:
        logger.warning(f"AI model warm-up failed: {exc}. Detection will still work on first request.")

    logger.info(
        f"API ready -> http://{settings.APP_HOST}:{settings.APP_PORT}/api/docs"
    )

    yield  # Application runs here

    # ── Shutdown ──
    logger.info("EmotionSense AI shutting down.")


# ─── App Factory ──────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    """
    Create and fully configure the FastAPI application instance.

    Returns a ready-to-serve FastAPI app.
    """
    app = FastAPI(
        title=settings.APP_TITLE,
        description=settings.APP_DESCRIPTION,
        version=settings.APP_VERSION,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS Middleware ────────────────────────────────────────────
    # Must be added BEFORE other middleware to apply to all routes including errors
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
    )

    # ── Request Logging Middleware ─────────────────────────────────
    app.add_middleware(RequestLoggingMiddleware)

    # ── Global Exception Handler ───────────────────────────────────
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """
        Catch-all handler for unhandled exceptions.
        Returns a consistent JSON error format instead of a raw 500 trace.
        Never leaks internal error details to the client.
        """
        logger.exception(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "An internal server error occurred. Please try again later.",
            },
        )

    # ── Routers ───────────────────────────────────────────────────
    # All API routes are mounted under /api prefix for clean namespacing
    app.include_router(auth_router, prefix="/api")
    app.include_router(detect_router, prefix="/api")
    app.include_router(sessions_router, prefix="/api")
    app.include_router(analytics_router, prefix="/api")
    app.include_router(scripts_router, prefix="/api")
    app.include_router(subscription_router, prefix="/api")
    app.include_router(tone_router, prefix="/api")

    # ── Utility Endpoints ─────────────────────────────────────────
    @app.get("/", include_in_schema=False)
    async def root():
        """Root redirect info — not included in API docs."""
        return {
            "message": "EmotionSense AI API",
            "version": settings.APP_VERSION,
            "docs": "/api/docs",
        }

    @app.get(
        "/health",
        tags=["Health"],
        summary="Health check",
        description="Returns server health status. Used by deployment platforms and load balancers.",
    )
    async def health_check():
        """
        Health check endpoint.
        Returns 200 OK with status info when the server is running correctly.
        Deployment platforms (Render, Railway) ping this to confirm readiness.
        """
        from app.services.emotion_service import emotion_service as svc
        return {
            "status": "ok",
            "environment": settings.APP_ENV,
            "version": settings.APP_VERSION,
            "model_ready": svc.is_ready,
        }

    # ── WebSocket Endpoint ────────────────────────────────────────
    from fastapi import WebSocket
    from typing import Optional

    @app.websocket("/ws/detect")
    async def websocket_detect(
        websocket: WebSocket,
        token: Optional[str] = None,
    ):
        """
        Real-time emotion detection WebSocket.

        Connect: ws://host/ws/detect?token=<JWT>
        Token is optional — unauthenticated connections are accepted
        but results are not persisted to a user session.
        """
        from app.websocket.stream import handle_stream

        await handle_stream(websocket, token=token)


    return app


# ─── Application Instance ─────────────────────────────────────────────────────
# This is the object uvicorn targets: `uvicorn app.main:app`
app = create_app()

