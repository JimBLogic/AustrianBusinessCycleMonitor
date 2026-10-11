"""Provider-neutral contracts for economic observations."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Mapping, Tuple


@dataclass(frozen=True, slots=True)
class SeriesDefinition:
    """Declarative metadata for one external economic series."""

    internal_code: str
    provider: str
    provider_series_code: str
    name: str
    category: str
    geography: str
    frequency: str
    unit: str
    seasonal_adjustment: str
    transformation: str
    freshness_sla_days: int
    source_url: str
    enabled: bool = True
    notes: str = ""

    @classmethod
    def from_mapping(
        cls, internal_code: str, payload: Mapping[str, Any]
    ) -> "SeriesDefinition":
        return cls(
            internal_code=internal_code,
            provider=str(payload["provider"]).strip().lower(),
            provider_series_code=str(payload["provider_series_code"]).strip(),
            name=str(payload["name"]).strip(),
            category=str(payload["category"]).strip(),
            geography=str(payload["geography"]).strip(),
            frequency=str(payload["frequency"]).strip().lower(),
            unit=str(payload["unit"]).strip(),
            seasonal_adjustment=str(payload["seasonal_adjustment"]).strip().lower(),
            transformation=str(payload["transformation"]).strip().lower(),
            freshness_sla_days=int(payload["freshness_sla_days"]),
            source_url=str(payload["source_url"]).strip(),
            enabled=bool(payload.get("enabled", True)),
            notes=str(payload.get("notes", "")).strip(),
        )


@dataclass(frozen=True, slots=True)
class NormalizedObservation:
    """One validated observation with source-vintage lineage."""

    internal_code: str
    provider_series_code: str
    observation_date: date
    value: float
    vintage_date: date
    realtime_end: date
    retrieved_at: datetime
    source_url: str
    source_payload_hash: str


@dataclass(frozen=True, slots=True)
class ProviderFetchResult:
    """Normalized result from one provider request."""

    definition: SeriesDefinition
    observations: Tuple[NormalizedObservation, ...]
    retrieved_at: datetime
    missing_observations: int
    source_payload_hash: str
