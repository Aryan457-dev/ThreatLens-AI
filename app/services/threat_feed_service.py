import httpx
from app.core.config import settings

class ThreatFeedService:
    @staticmethod
    async def check_ip(ip: str):
        url = "https://api.abuseipdb.com/api/v2/check"
        headers = {
            "Key": settings.ABUSEIPDB_API_KEY,
            "Accept": "application/json"
        }

        params = {
            "ipAddress": ip,
            "maxAgeInDays": 90,
        }

        async with httpx.AsyncClient() as client:
            response = await client.get (
                url,
                headers=headers,
                params=params
            )

        return response.json()
    