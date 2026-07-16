"""Contracts for deterministic, vintage-aware economic snapshots."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Mapping, Optional, Tuple


@dataclass(frozen=True, slots=True)
class ObservationPoint:
    """One source observation selected under an explicit as-of policy."""

    internal_code: str
    observation_date: date
    value: float
    vintage_date: date
    retrieved_at: datetime
    source_url: str
    source_payload_hash: str

    def lineage_dict(self) -> Mapping[str, Any]:
        return {
            "internal_code": self.internal_code,
            "observation_date": self.observation_date.isoformat(),
            "value": self.value,
            "vintage_date": self.vintage_date.isoformat(),
            "retrieved_at": self.retrieved_at.isoformat(),
            "source_url": self.source_url,
            "source_payload_hash": self.source_payload_hash,
        }


@dataclass(frozen=True, slots=True)
class MetricDefinition:
    """Versioned declaration for one deterministic metric."""

    code: str
    name: str
    unit: str
    method: str
    required_series: Tuple[str, ...]
    parameters: Mapping[str, Any]
    description: str


@dataclass(frozen=True, slots=True)
class MetricResult:
    """Calculated metric with explicit availability and full lineage."""

    code: str
    name: str
    unit: str
    value: Optional[float]
    status: str
    observation_date: Optional[date]
    freshness_days: Optional[int]
    formula: str
    reason: Optional[str]
    lineage: Tuple[ObservationPoint, ...]

    def to_dict(self) -> Mapping[str, Any]:
        return {
            "code": self.code,
            "name": self.name,
            "unit": self.unit,
            "value": self.value,
            "status": self.status,
            "observation_date": (
                self.observation_date.isoformat() if self.observation_date else None
            ),
            "freshness_days": self.freshness_days,
            "formula": self.formula,
            "reason": self.reason,
            "lineage": [point.lineage_dict() for point in self.lineage],
        }


@dataclass(frozen=True, slots=True)
class DeterministicSnapshot:
    """Immutable analytical snapshot derived from trusted observations."""

    snapshot_id: str
    as_of_date: date
    methodology_version: str
    generated_at: datetime
    status: str
    coverage_ratio: float
    available_metrics: int
    total_metrics: int
    input_fingerprint: str
    registry_hash: str
    metrics: Tuple[MetricResult, ...]

    def to_dict(self) -> Mapping[str, Any]:
        return {
            "snapshot_id": self.snapshot_id,
            "as_of_date": self.as_of_date.isoformat(),
            "methodology_version": self.methodology_version,
            "generated_at": self.generated_at.isoformat(),
            "status": self.status,
            "coverage_ratio": self.coverage_ratio,
            "available_metrics": self.available_metrics,
            "total_metrics": self.total_metrics,
            "input_fingerprint": self.input_fingerprint,
            "registry_hash": self.registry_hash,
            "metrics": {metric.code: metric.to_dict() for metric in self.metrics},
        }
