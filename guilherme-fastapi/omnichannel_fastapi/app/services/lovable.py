from .http_client import http_post, http_get
from ..config import settings
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

BASE = settings.LOVABLE_BASE_URL
AUTH_HEADERS = {
    "Authorization": f"Bearer {settings.LOVABLE_API_KEY}",
    "Content-Type": "application/json"
}

class LovableClient:
    @staticmethod
    async def send_message_to_lovable(payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{BASE}/inbox/messages"
        logger.info("Forwarding message to Lovable")
        return await http_post(url, json=payload, headers=AUTH_HEADERS)

    @staticmethod
    async def register_connection(service_name: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{BASE}/connections"
        data = {"service": service_name, "credentials": credentials}
        logger.info(f"Registering connection in Lovable for {service_name}")
        return await http_post(url, json=data, headers=AUTH_HEADERS)

    @staticmethod
    async def send_outgoing_message(channel: str, to: str, message: str, meta: Dict = None):
        url = f"{BASE}/outgoing"
        payload = {"channel": channel, "to": to, "message": message, "meta": meta or {}}
        logger.info("Sending outgoing message via Lovable")
        return await http_post(url, json=payload, headers=AUTH_HEADERS)

    @staticmethod
    async def get_insights(user_id: str) -> Dict[str, Any]:
        url = f"{BASE}/ai/insights/{user_id}"
        return await http_get(url, headers=AUTH_HEADERS)