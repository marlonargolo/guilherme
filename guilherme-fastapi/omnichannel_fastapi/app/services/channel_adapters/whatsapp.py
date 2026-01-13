from .base import BaseAdapter
import httpx
import logging

logger = logging.getLogger(__name__)

class WhatsAppAdapter(BaseAdapter):
    channel_name = "whatsapp"

    def __init__(self, config):
        super().__init__(config)
        self.api_url = config.get("api_url")
        self.token = config.get("api_key")

    async def parse_webhook(self, payload):
        messages = payload.get("messages", [{}])
        msg = messages[0]
        return {
            "channel": self.channel_name,
            "external_id": msg.get("id"),
            "user": {"id": msg.get("from"), "name": None, "phone": msg.get("from")},
            "message": {"text": msg.get("text", {}).get("body"), "type": "text"},
            "raw": payload
        }

    async def send_message(self, to: str, message: str, meta: dict = None):
        url = f"{self.api_url}/messages"
        headers = {"Authorization": f"Bearer {self.token}"}
        payload = {
            "to": to,
            "type": "text",
            "text": {"body": message}
        }
        
        async with httpx.AsyncClient() as client:
            r = await client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            logger.info(f"WhatsApp sent to {to}")
            return r.json()