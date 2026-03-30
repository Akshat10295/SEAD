import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import create_tables
from app.core.exceptions import AppException
from app.routes import auth, queue, counter, admin, ws
from app.services.admin_service import AdminService
from app.core.database import SessionLocal

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Smart Queue System...")
    create_tables()
    # Seed default counters
    db = SessionLocal()
    try:
        AdminService(db).ensure_default_counters(count=3)
    finally:
        db.close()
    logger.info("Startup complete.")
    yield
    logger.info("Shutting down...")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Smart Queue Management System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global Exception Handler ──────────────────────────────────────────────────
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(queue.router)
app.include_router(counter.router)
app.include_router(admin.router)
app.include_router(ws.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "Smart Queue API"}
