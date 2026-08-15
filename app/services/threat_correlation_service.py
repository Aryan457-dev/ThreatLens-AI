from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.services.threat_feed_service import ThreatFeedService
from app.services.virus_total_service import VirusTotalService
from app.repositories.threat_analysis_repository import ThreatAnalysisRepository


class ThreatCorrelationService:

    @staticmethod
    async def analyze_ip(
        ip: str,
        db: Session
    ):

        # =========================================================
        # FETCH THREAT INTELLIGENCE
        # =========================================================

        abuseipdb_result = None
        virustotal_result = None

        abuse_error = None
        virustotal_error = None

        # =========================================================
        # ABUSEIPDB
        # =========================================================

        try:
            abuseipdb_result = await ThreatFeedService.check_ip(ip)

        except HTTPException as e:
            abuse_error = str(e.detail)

        except Exception as e:
            abuse_error = str(e)

        # =========================================================
        # VIRUSTOTAL
        # =========================================================

        try:
            virustotal_result = await VirusTotalService.check_ip(ip)

        except HTTPException as e:
            virustotal_error = str(e.detail)

        except Exception as e:
            virustotal_error = str(e)

        # =========================================================
        # MAKE SURE AT LEAST ONE SOURCE WORKED
        # =========================================================

        if abuseipdb_result is None and virustotal_result is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Threat intelligence services are currently unavailable."
            )

        # =========================================================
        # EXTRACT ABUSEIPDB DATA
        # =========================================================

        abuse_confidence = 0
        total_reports = 0

        if abuseipdb_result:

            abuse_data = abuseipdb_result.get(
                "data",
                {}
            )

            abuse_confidence = abuse_data.get(
                "abuseConfidenceScore",
                0
            )

            total_reports = abuse_data.get(
                "totalReports",
                0
            )

        # Make sure values are valid numbers

        abuse_confidence = max(
            0,
            min(abuse_confidence, 100)
        )

        total_reports = max(
            0,
            total_reports
        )

        # =========================================================
        # EXTRACT VIRUSTOTAL DATA
        # =========================================================

        malicious = 0
        suspicious = 0
        harmless = 0

        if virustotal_result:

            malicious = virustotal_result.get(
                "malicious",
                0
            )

            suspicious = virustotal_result.get(
                "suspicious",
                0
            )

            harmless = virustotal_result.get(
                "harmless",
                0
            )

        # Make sure values are valid numbers

        malicious = max(
            0,
            malicious
        )

        suspicious = max(
            0,
            suspicious
        )

        harmless = max(
            0,
            harmless
        )

        # =========================================================
        # ABUSEIPDB SCORE
        # =========================================================
        #
        # AbuseIPDB uses two signals:
        #
        # 1. Confidence score
        # 2. Number of reports
        #
        # Confidence is the stronger signal.
        #
        # Weight:
        #
        # Confidence = 85%
        # Reports    = 15%
        #
        # Report normalization:
        #
        # 0 reports    -> 0
        # 50 reports   -> 50
        # 100+ reports -> 100
        #
        # This prevents extremely large report counts from
        # continuously increasing the score.
        # =========================================================

        confidence_component = abuse_confidence

        report_component = min(
            total_reports,
            100
        )

        abuse_score = (
            confidence_component * 0.85
            + report_component * 0.15
        )

        abuse_score = round(
            min(max(abuse_score, 0), 100),
            2
        )

        # =========================================================
        # VIRUSTOTAL SCORE
        # =========================================================
        #
        # Malicious engines are stronger evidence than
        # suspicious engines.
        #
        # Malicious = 10 points / engine
        # Suspicious = 5 points / engine
        #
        # Maximum = 100
        # =========================================================

        malicious_score = malicious * 10

        suspicious_score = suspicious * 5

        virus_total_score = min(
            malicious_score + suspicious_score,
            100
        )

        virus_total_score = round(
            virus_total_score,
            2
        )

        # =========================================================
        # FINAL CORRELATED THREAT SCORE
        # =========================================================
        #
        # Both sources available:
        #
        # AbuseIPDB  = 60%
        # VirusTotal = 40%
        #
        # If only one source is available, use that source.
        # =========================================================

        if abuseipdb_result and virustotal_result:

            threat_score = (
                abuse_score * 0.60
                + virus_total_score * 0.40
            )

        elif abuseipdb_result:

            threat_score = abuse_score

        elif virustotal_result:

            threat_score = virus_total_score

        else:

            threat_score = 0

        threat_score = round(
            min(max(threat_score, 0), 100),
            2
        )

        # =========================================================
        # DETERMINE THREAT LEVEL
        # =========================================================

        if threat_score >= 80:

            threat_level = "CRITICAL"

        elif threat_score >= 60:

            threat_level = "HIGH"

        elif threat_score >= 30:

            threat_level = "MEDIUM"

        else:

            threat_level = "LOW"

        # =========================================================
        # GENERATE RISK FACTORS
        # =========================================================

        risk_factors = []

        # =========================================================
        # ABUSEIPDB RISK FACTORS
        # =========================================================

        if abuseipdb_result:

            if abuse_confidence >= 80:

                risk_factors.append(
                    "High AbuseIPDB confidence score"
                )

            elif abuse_confidence >= 50:

                risk_factors.append(
                    "Elevated AbuseIPDB confidence score"
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

        else:

            risk_factors.append(
                "AbuseIPDB data unavailable"
            )

        # =========================================================
        # VIRUSTOTAL RISK FACTORS
        # =========================================================

        if virustotal_result:

            if malicious > 0:

                risk_factors.append(
                    f"VirusTotal detected {malicious} malicious engines"
                )

            if suspicious > 0:

                risk_factors.append(
                    f"VirusTotal detected {suspicious} suspicious engines"
                )

        else:

            risk_factors.append(
                "VirusTotal data unavailable"
            )

        # =========================================================
        # PROVIDER ERRORS
        # =========================================================

        if abuse_error:

            risk_factors.append(
                f"AbuseIPDB unavailable: {abuse_error}"
            )

        if virustotal_error:

            risk_factors.append(
                f"VirusTotal unavailable: {virustotal_error}"
            )

        # =========================================================
        # GENERATE SUMMARY
        # =========================================================

        if threat_level == "CRITICAL":

            summary = (
                "This IP shows strong indicators of malicious activity "
                "across available threat intelligence sources and "
                "should be investigated immediately."
            )

        elif threat_level == "HIGH":

            summary = (
                "This IP shows significant indicators of potentially "
                "malicious activity across the available threat "
                "intelligence sources."
            )

        elif threat_level == "MEDIUM":

            summary = (
                "This IP shows multiple suspicious indicators and "
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

        # =========================================================
        # SAVE ANALYSIS TO DATABASE
        # =========================================================

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

        # =========================================================
        # RETURN UNIFIED THREAT INTELLIGENCE
        # =========================================================

        return {
            "ip": ip,

            "threat_score": threat_score,

            "threat_level": threat_level,

            "abuseipdb": {
                "confidence_score": abuse_confidence,
                "total_reports": total_reports,
            },

            "virustotal": {
                "malicious": malicious,
                "suspicious": suspicious,
                "harmless": harmless,
            },

            "analysis": {
                "risk_factors": risk_factors,
                "summary": summary,
            },
        }