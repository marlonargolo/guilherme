import asyncio
from fastapi import FastAPI
from .routers import webhooks, admin
from .models import Base, engine
from .config import settings
from .tasks import start_background_workers
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Lovable Omnichannel Bridge")

app.include_router(webhooks.router, prefix="")
app.include_router(admin.router, prefix="")

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up: creating tables if not exist")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    loop = asyncio.get_event_loop()
    start_background_workers(loop, num_workers=3)
    logger.info("Background workers started")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down")

@app.get("/")
async def root():
    return {"message": "Lovable Omnichannel Bridge is running!"}

@app.get("/health")
async def health():
    return {"status": "healthy"}