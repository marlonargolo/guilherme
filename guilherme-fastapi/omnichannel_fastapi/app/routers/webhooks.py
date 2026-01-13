from fastapi import APIRouter, Request, BackgroundTasks
from ..services.channel_adapters.whatsapp import WhatsAppAdapter
from ..models import AsyncSessionLocal, ChannelConnection
from ..tasks import producer_enqueue
from ..config import settings
from sqlalchemy.future import select

router = APIRouter()

@router.post("/webhook/omnichannel")
async def omnichannel_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()
    channel = payload.get("channel") or request.headers.get("X-Channel") or "unknown"
    
    config = None
    async with AsyncSessionLocal() as session:
        stmt = select(ChannelConnection).where(
            ChannelConnection.channel == channel,
            ChannelConnection.enabled == True
        )
        res = await session.execute(stmt)
        conn = res.scalars().first()
        if conn:
            config = conn.config
    
    if not config:
        if channel == "whatsapp":
            config = {
                "api_url": settings.WHATSAPP_API_URL,
                "api_key": settings.WHATSAPP_API_KEY
            }
        else:
            config = {}
    
    if channel == "whatsapp":
        adapter = WhatsAppAdapter(config)
    else:
        class DefaultAdapter:
            async def parse_webhook(self, p):
                return {
                    "channel": channel,
                    "external_id": p.get("id"),
                    "user": {"id": p.get("from"), "name": p.get("name")},
                    "message": {"text": p.get("text"), "type": "text"},
                    "raw": p
                }
        adapter = DefaultAdapter()
    
    normalized = await adapter.parse_webhook(payload)
    background_tasks.add_task(producer_enqueue, normalized)
    
    return {
        "status": "received",
        "normalized": {
            "channel": normalized["channel"],
            "external_id": normalized["external_id"]
        }
    }