import httpx

from fastapi import HTTPException, status

from app.core.config import settings


class VirusTotalService:

    @staticmethod
    async def check_ip(ip: str):

        url = (
            f"https://www.virustotal.com/api/v3/"
            f"ip_addresses/{ip}"
        )

        headers = {
            "x-apikey": settings.VIRUSTOTAL_API_KEY,
            "Accept": "application/json"
        }

        try:
            async with httpx.AsyncClient(
                timeout=10.0
            ) as client:

                response = await client.get(
                    url,
                    headers=headers
                )

            response.raise_for_status()

            data = response.json()

            attributes = data["data"]["attributes"]

            analysis_stats = attributes.get(
                "last_analysis_stats",
                {}
            )

            return {
                "ip": ip,

                "country": attributes.get(
                    "country"
                ),

                "asn": attributes.get(
                    "asn"
                ),

                "network": attributes.get(
                    "network"
                ),

                "reputation": attributes.get(
                    "reputation"
                ),

                "malicious": analysis_stats.get(
                    "malicious",
                    0
                ),

                "suspicious": analysis_stats.get(
                    "suspicious",
                    0
                ),

                "harmless": analysis_stats.get(
                    "harmless",
                    0
                ),

                "undetected": analysis_stats.get(
                    "undetected",
                    0
                )
            }

        except httpx.TimeoutException:

            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="VirusTotal request timed out."
            )

        except httpx.HTTPStatusError as e:

            raise HTTPException(
                status_code=e.response.status_code,
                detail="VirusTotal API request failed."
            )

        except httpx.RequestError:

            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to connect to VirusTotal."
            )

        except (KeyError, TypeError):

            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unexpected response received from VirusTotal."
            )