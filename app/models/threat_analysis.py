from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func

from app.db.database import Base


class ThreatAnalysis(Base):
    __tablename__ = "threat_analyses"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    ip = Column(
        String,
        nullable=False,
        index=True
    )

    threat_score = Column(
        Float,
        nullable=False
    )

    threat_level = Column(
        String,
        nullable=False,
        index=True
    )

    # AbuseIPDB information
    abuse_confidence_score = Column(
        Integer,
        nullable=False,
        default=0
    )

    abuse_total_reports = Column(
        Integer,
        nullable=False,
        default=0
    )

    # VirusTotal information
    vt_malicious = Column(
        Integer,
        nullable=False,
        default=0
    )

    vt_suspicious = Column(
        Integer,
        nullable=False,
        default=0
    )

    vt_harmless = Column(
        Integer,
        nullable=False,
        default=0
    )

    # AI/rule-based analysis
    risk_factors = Column(
        JSON,
        nullable=False,
        default=list
    )

    summary = Column(
        String,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )