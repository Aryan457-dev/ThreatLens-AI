import httpx

from app.core.config import settings


class VirusTotalService:

    @staticmethod
    async def check_ip(ip: str):

        url = f"https://www.virustotal.com/api/v3/ip_addresses/{ip}"

        headers = {
            "x-apikey": settings.VIRUSTOTAL_API_KEY,
            "Accept": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=headers
            )

        response.raise_for_status()

        data = response.json()

        attributes = data["data"]["attributes"]

        return {
            "ip": ip,
            "country": attributes.get("country"),
            "asn": attributes.get("asn"),
            "network": attributes.get("network"),
            "reputation": attributes.get("reputation"),
            "malicious": attributes.get("last_analysis_stats", {}).get("malicious", 0),
            "suspicious": attributes.get("last_analysis_stats", {}).get("suspicious", 0),
            "harmless": attributes.get("last_analysis_stats", {}).get("harmless", 0),
            "undetected": attributes.get("last_analysis_stats", {}).get("undetected", 0)
        }