from pydantic import BaseModel
from typing import List


class AbuseIPDBResult(BaseModel):
    confidence_score: int
    total_reports: int


class VirusTotalResult(BaseModel):
    malicious: int
    suspicious: int
    harmless: int


class ThreatAnalysis(BaseModel):
    risk_factors: List[str]
    summary: str


class ThreatAnalysisResponse(BaseModel):
    ip: str
    threat_score: float
    threat_level: str

    abuseipdb: AbuseIPDBResult
    virustotal: VirusTotalResult

    analysis: ThreatAnalysis