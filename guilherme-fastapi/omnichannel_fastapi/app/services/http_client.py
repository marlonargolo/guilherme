import httpx
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
import logging

logger = logging.getLogger(__name__)

@retry(
    wait=wait_exponential(multiplier=1, min=1, max=10),
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type((httpx.HTTPError,))
)
async def http_post(url: str, json: dict = None, headers: dict = None, timeout: int = 30):
    async with httpx.AsyncClient(timeout=timeout) as client:
        logger.debug(f"POST {url} payload={json}")
        r = await client.post(url, json=json, headers=headers)
        r.raise_for_status()
        return r.json()

@retry(
    wait=wait_exponential(multiplier=1, min=1, max=10),
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type((httpx.HTTPError,))
)
async def http_get(url: str, params: dict = None, headers: dict = None, timeout: int = 30):
    async with httpx.AsyncClient(timeout=timeout) as client:
        logger.debug(f"GET {url} params={params}")
        r = await client.get(url, params=params, headers=headers)
        r.raise_for_status()
        return r.json()