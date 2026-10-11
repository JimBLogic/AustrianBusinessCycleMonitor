"""Official FRED REST API adapter with vintage-aware normalization."""
from __future__ import annotations

import hashlib
import json
import math
from datetime import UTC, date, datetime
from typing import Any, Mapping, Optional

import requests

from ..contracts import NormalizedObservation, ProviderFetchResult, SeriesDefinition


class FredProviderError(RuntimeError):
    """Raised when FRED cannot return a valid provider response."""


class FredProvider:
    """Fetch and normalize observations from the official FRED API."""

    base_url = "https://api.stlouisfed.org/fred/series/observations"

    def __init__(
        self,
        api_key: str,
        session: Optional[requests.Session] = None,
        timeout_seconds: float = 15.0,
    ) -> None:
        clean_key = api_key.strip()
        if not clean_key:
            raise ValueError("A non-empty FRED API key is required")
        if timeout_seconds <= 0:
            raise ValueError("FRED timeout must be positive")

        self.api_key = clean_key
        self.session = session or requests.Session()
        self.timeout_seconds = timeout_seconds

    def fetch_series(
        self,
        definition: SeriesDefinition,
        *,
        observation_start: date | None = None,
        observation_end: date | None = None,
        realtime_start: date | None = None,
        realtime_end: date | None = None,
    ) -> ProviderFetchResult:
        if definition.provider != "fred":
            raise ValueError(
                f"FredProvider cannot fetch provider {definition.provider!r}"
            )

        params: dict[str, str] = {
            "api_key": self.api_key,
            "file_type": "json",
            "series_id": definition.provider_series_code,
            "sort_order": "asc",
        }
        optional_dates = {
            "observation_start": observation_start,
            "observation_end": observation_end,
            "realtime_start": realtime_start,
            "realtime_end": realtime_end,
        }
        params.update(
            {
                name: value.isoformat()
                for name, value in optional_dates.items()
                if value is not None
            }
        )

        try:
            response = self.session.get(
                self.base_url,
                params=params,
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            payload = response.json()
        except (requests.RequestException, ValueError) as exc:
            raise FredProviderError(
                f"FRED request failed for {definition.provider_series_code}"
            ) from exc

        if not isinstance(payload, Mapping):
            raise FredProviderError("FRED returned a non-object JSON response")
        raw_observations = payload.get("observations")
        if not isinstance(raw_observations, list):
            raise FredProviderError("FRED response did not contain an observations list")

        retrieved_at = datetime.now(UTC)
        payload_hash = _hash_payload(payload)
        observations: list[NormalizedObservation] = []
        missing_observations = 0

        for raw_observation in raw_observations:
            if not isinstance(raw_observation, Mapping):
                raise FredProviderError("FRED returned a malformed observation")

            raw_value = str(raw_observation.get("value", "")).strip()
            if raw_value in {"", "."}:
                missing_observations += 1
                continue

            try:
                value = float(raw_value)
                observation_date = date.fromisoformat(
                    str(raw_observation["date"])
                )
                vintage_date = date.fromisoformat(
                    str(raw_observation["realtime_start"])
                )
                realtime_end_date = date.fromisoformat(
                    str(raw_observation["realtime_end"])
                )
            except (KeyError, TypeError, ValueError) as exc:
                raise FredProviderError(
                    f"FRED returned an invalid observation for {definition.provider_series_code}"
                ) from exc

            if not math.isfinite(value):
                raise FredProviderError(
                    f"FRED returned a non-finite value for {definition.provider_series_code}"
                )

            observation_hash = _hash_payload(raw_observation)
            observations.append(
                NormalizedObservation(
                    internal_code=definition.internal_code,
                    provider_series_code=definition.provider_series_code,
                    observation_date=observation_date,
                    value=value,
                    vintage_date=vintage_date,
                    realtime_end=realtime_end_date,
                    retrieved_at=retrieved_at,
                    source_url=definition.source_url,
                    source_payload_hash=observation_hash,
                )
            )

        return ProviderFetchResult(
            definition=definition,
            observations=tuple(observations),
            retrieved_at=retrieved_at,
            missing_observations=missing_observations,
            source_payload_hash=payload_hash,
        )


def _hash_payload(payload: Any) -> str:
    canonical = json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=True,
    ).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()
