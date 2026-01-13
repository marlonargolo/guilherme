from fastapi import APIRouter
from ..models import AsyncSessionLocal, ChannelConnection
from ..services.lovable import LovableClient
from pydantic import BaseModel

router = APIRouter()

class ConnectionIn(BaseModel):
    channel: str
    config: dict

@router.post("/admin/register_connection")
async def register_connection(conn: ConnectionIn):
    async with AsyncSessionLocal() as session:
        obj = ChannelConnection(channel=conn.channel, config=conn.config)
        session.add(obj)
        await session.commit()
    
    try:
        resp = await LovableClient.register_connection(conn.channel, conn.config)
    except Exception as e:
        resp = {"error": str(e)}
    
    return {"status": "ok", "lovable": resp}