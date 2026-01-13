import asyncio
import logging
from .services.lovable import LovableClient
from .models import AsyncSessionLocal, MessageLog
from sqlalchemy.future import select

logger = logging.getLogger(__name__)

processing_queue = asyncio.Queue()

async def producer_enqueue(normalized_message: dict):
    await processing_queue.put(normalized_message)
    logger.debug("Message enqueued")

async def consumer_worker():
    while True:
        msg = await processing_queue.get()
        try:
            async with AsyncSessionLocal() as session:
                log = MessageLog(
                    channel=msg.get("channel"),
                    external_id=msg.get("external_id"),
                    payload=msg.get("raw"),
                    direction="incoming",
                    status="processing"
                )
                session.add(log)
                await session.commit()

            payload = {
                "channel": msg.get("channel"),
                "user": msg.get("user"),
                "message": msg.get("message"),
                "external_id": msg.get("external_id"),
                "metadata": {"source_raw": msg.get("raw")}
            }
            
            resp = await LovableClient.send_message_to_lovable(payload)
            
            async with AsyncSessionLocal() as session:
                stmt = select(MessageLog).order_by(MessageLog.id.desc()).limit(1)
                res = await session.execute(stmt)
                last_log = res.scalars().first()
                if last_log:
                    last_log.status = "forwarded"
                    await session.commit()
                    
            logger.info("Message forwarded to Lovable")
        except Exception as e:
            logger.exception("Failed processing msg")
        finally:
            processing_queue.task_done()

def start_background_workers(loop, num_workers=2):
    for _ in range(num_workers):
        loop.create_task(consumer_worker())