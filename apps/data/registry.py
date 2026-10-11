"""Strict loader for the versioned economic-series registry."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, Mapping, Sequence

import yaml

from .contracts import SeriesDefinition


class SeriesRegistryError(ValueError):
    """Raised when the declarative series registry is invalid."""


_REQUIRED_FIELDS: Sequence[str] = (
    "provider",
    "provider_series_code",
    "name",
    "category",
    "geography",
    "frequency",
    "unit",
    "seasonal_adjustment",
    "transformation",
    "freshness_sla_days",
    "source_url",
)


def load_series_registry(path: str | Path) -> Dict[str, SeriesDefinition]:
    """Load and validate a YAML registry without contacting any provider."""
    registry_path = Path(path)
    try:
        raw = yaml.safe_load(registry_path.read_text(encoding="utf-8"))
    except OSError as exc:
        raise SeriesRegistryError(f"Could not read series registry: {registry_path}") from exc
    except yaml.YAMLError as exc:
        raise SeriesRegistryError(f"Invalid YAML in series registry: {registry_path}") from exc

    if not isinstance(raw, Mapping):
        raise SeriesRegistryError("Series registry root must be a mapping")
    if raw.get("version") != 1:
        raise SeriesRegistryError("Series registry version must be 1")

    raw_series = raw.get("series")
    if not isinstance(raw_series, Mapping) or not raw_series:
        raise SeriesRegistryError("Series registry must contain a non-empty 'series' mapping")

    definitions: Dict[str, SeriesDefinition] = {}
    provider_keys: set[tuple[str, str]] = set()

    for raw_code, payload in raw_series.items():
        internal_code = str(raw_code).strip()
        if not internal_code or not internal_code.replace("_", "").isalnum():
            raise SeriesRegistryError(f"Invalid internal series code: {raw_code!r}")
        if not isinstance(payload, Mapping):
            raise SeriesRegistryError(f"Series {internal_code} must be a mapping")

        missing = [field for field in _REQUIRED_FIELDS if field not in payload]
        if missing:
            raise SeriesRegistryError(
                f"Series {internal_code} is missing required fields: {', '.join(missing)}"
            )

        try:
            definition = SeriesDefinition.from_mapping(internal_code, payload)
        except (KeyError, TypeError, ValueError) as exc:
            raise SeriesRegistryError(
                f"Series {internal_code} contains invalid field values"
            ) from exc

        _validate_definition(definition)
        provider_key = (definition.provider, definition.provider_series_code)
        if provider_key in provider_keys:
            raise SeriesRegistryError(
                "Duplicate provider series mapping: "
                f"{definition.provider}/{definition.provider_series_code}"
            )

        definitions[internal_code] = definition
        provider_keys.add(provider_key)

    return definitions


def _validate_definition(definition: SeriesDefinition) -> None:
    text_fields = (
        definition.provider,
        definition.provider_series_code,
        definition.name,
        definition.category,
        definition.geography,
        definition.frequency,
        definition.unit,
        definition.seasonal_adjustment,
        definition.transformation,
        definition.source_url,
    )
    if any(not value for value in text_fields):
        raise SeriesRegistryError(
            f"Series {definition.internal_code} contains an empty required value"
        )
    if definition.freshness_sla_days <= 0:
        raise SeriesRegistryError(
            f"Series {definition.internal_code} must have a positive freshness SLA"
        )
    if not definition.source_url.startswith("https://"):
        raise SeriesRegistryError(
            f"Series {definition.internal_code} must use an HTTPS source URL"
        )
