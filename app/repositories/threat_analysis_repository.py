from sqlalchemy.orm import Session

from app.models.threat_analysis import ThreatAnalysis


class ThreatAnalysisRepository:

    @staticmethod
    def create(
        db: Session,
        ip: str,
        threat_score: float,
        threat_level: str,
        abuse_confidence_score: int,
        abuse_total_reports: int,
        vt_malicious: int,
        vt_suspicious: int,
        vt_harmless: int,
        risk_factors: list,
        summary: str,
    ) -> ThreatAnalysis:

        analysis = ThreatAnalysis(
            ip=ip,
            threat_score=threat_score,
            threat_level=threat_level,
            abuse_confidence_score=abuse_confidence_score,
            abuse_total_reports=abuse_total_reports,
            vt_malicious=vt_malicious,
            vt_suspicious=vt_suspicious,
            vt_harmless=vt_harmless,
            risk_factors=risk_factors,
            summary=summary,
        )

        try:
            db.add(analysis)
            db.commit()
            db.refresh(analysis)

        except Exception:
            db.rollback()
            raise

        return analysis

    @staticmethod
    def get_by_ip(
        db: Session,
        ip: str,
    ):
        return (
            db.query(ThreatAnalysis)
            .filter(ThreatAnalysis.ip == ip)
            .order_by(
                ThreatAnalysis.created_at.desc()
            )
            .all()
        )

    @staticmethod
    def get_all(
        db: Session,
        limit: int = 10,
        offset: int = 0,
    ):
        return (
            db.query(ThreatAnalysis)
            .order_by(
                ThreatAnalysis.created_at.desc()
            )
            .offset(offset)
            .limit(limit)
            .all()
        )