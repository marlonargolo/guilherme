from typing import Dict, Any

class BaseAdapter:
    channel_name: str = "base"

    def __init__(self, config: Dict[str, Any]):
        self.config = config

    async def parse_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    async def send_message(self, to: str, message: str, meta: Dict = None):
        raise NotImplementedError