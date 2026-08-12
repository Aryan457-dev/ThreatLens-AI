from sqlalchemy.orm import Session

from app.services.threat_feed_service import ThreatFeedService
from app.services.virus_total_service import VirusTotalService
from app.repositories.threat_analysis_repository import ThreatAnalysisRepository


class ThreatCorrelationService:

    @staticmethod
    async def analyze_ip(
        ip: str,
        db: Session
    ):

        # -----------------------------
        # Fetch Threat Intelligence
        # -----------------------------

        abuseipdb_result = await ThreatFeedService.check_ip(ip)
        virustotal_result = await VirusTotalService.check_ip(ip)

        # -----------------------------
        # Extract AbuseIPDB information
        # -----------------------------

        abuse_data = abuseipdb_result.get("data", {})

        abuse_confidence = abuse_data.get(
            "abuseConfidenceScore", 0
        )

        total_reports = abuse_data.get(
            "totalReports", 0
        )

        # -----------------------------
        # Extract VirusTotal information
        # -----------------------------

        vt_data = virustotal_result.get("data", {})
        vt_attributes = vt_data.get("attributes", {})

        last_analysis_stats = vt_attributes.get(
            "last_analysis_stats", {}
        )

        malicious = last_analysis_stats.get(
            "malicious", 0
        )

        suspicious = last_analysis_stats.get(
            "suspicious", 0
        )

        harmless = last_analysis_stats.get(
            "harmless", 0
        )

        # -----------------------------
        # Calculate Threat Score
        # -----------------------------

        abuse_score = abuse_confidence

        virus_total_score = min(
            (malicious * 10) + (suspicious * 5),
            100
        )

        threat_score = (
            abuse_score * 0.6
            + virus_total_score * 0.4
        )

        threat_score = round(
            min(threat_score, 100),
            2
        )

        # -----------------------------
        # Determine Threat Level
        # -----------------------------

        if threat_score >= 80:
            threat_level = "CRITICAL"

        elif threat_score >= 60:
            threat_level = "HIGH"

        elif threat_score >= 30:
            threat_level = "MEDIUM"

        else:
            threat_level = "LOW"

        # -----------------------------
        # Generate Risk Factors
        # -----------------------------

        risk_factors = []

        if abuse_confidence >= 80:
            risk_factors.append(
                "High AbuseIPDB confidence score"
            )

        elif abuse_confidence >= 30:
            risk_factors.append(
                "Moderate AbuseIPDB confidence score"
            )

        if total_reports >= 100:
            risk_factors.append(
                "High number of AbuseIPDB reports"
            )

        elif total_reports >= 20:
            risk_factors.append(
                "Multiple AbuseIPDB reports"
            )

        if malicious > 0:
            risk_factors.append(
                f"VirusTotal detected {malicious} malicious engines"
            )

        if suspicious > 0:
            risk_factors.append(
                f"VirusTotal detected {suspicious} suspicious engines"
            )

        # -----------------------------
        # Generate Summary
        # -----------------------------

        if threat_level == "CRITICAL":
            summary = (
                "This IP shows strong indicators of malicious activity "
                "and should be investigated immediately."
            )

        elif threat_level == "HIGH":
            summary = (
                "This IP shows significant indicators of potentially "
                "malicious activity."
            )

        elif threat_level == "MEDIUM":
            summary = (
                "This IP shows some suspicious indicators and "
                "requires further investigation."
            )

        else:
            if risk_factors:
                summary = (
                    "The IP has a low overall threat score, but "
                    "some indicators were identified and should "
                    "be reviewed."
                )

            else:
                summary = (
                    "No significant malicious activity was detected "
                    "by the available threat intelligence sources."
                )

        # -----------------------------
        # Save Analysis to Database
        # -----------------------------

        ThreatAnalysisRepository.create(
            db=db,
            ip=ip,
            threat_score=threat_score,
            threat_level=threat_level,
            abuse_confidence_score=abuse_confidence,
            abuse_total_reports=total_reports,
            vt_malicious=malicious,
            vt_suspicious=suspicious,
            vt_harmless=harmless,
            risk_factors=risk_factors,
            summary=summary,
        )

        # -----------------------------
        # Unified Threat Intelligence
        # -----------------------------

        return {
            "ip": ip,

            "threat_score": threat_score,

            "threat_level": threat_level,

            "abuseipdb": {
                "confidence_score": abuse_confidence,
                "total_reports": total_reports
            },

            "virustotal": {
                "malicious": malicious,
                "suspicious": suspicious,
                "harmless": harmless
            },

            "analysis": {
                "risk_factors": risk_factors,
                "summary": summary
            }
        }