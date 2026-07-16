"""Versioned registry for deterministic metric definitions."""
from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Dict, Mapping, Tuple

import yaml

from .contracts import MetricDefinition


class MetricRegistryError(ValueError):
    """Raised when the metric registry is missing or internally inconsistent."""


class MetricRegistry:
    """Load and validate deterministic metric declarations."""

    SUPPORTED_METHODS = {
        "latest",
        "percent_change",
        "difference",
        "policy_rate_minus_yoy_inflation",
    }

    def __init__(
        self,
        *,
        version: str,
        metrics: Mapping[str, MetricDefinition],
        registry_hash: str,
    ) -> None:
        self.version = version
        self.metrics = dict(metrics)
        self.registry_hash = registry_hash

    @classmethod
    def load(cls, path: str | Path) -> "MetricRegistry":
        registry_path = Path(path)
        raw = registry_path.read_bytes()
        payload = yaml.safe_load(raw)
        if not isinstance(payload, dict):
            raise MetricRegistryError("Metric registry must contain a YAML mapping")

        version = str(payload.get("version", "")).strip()
        if not version:
            raise MetricRegistryError("Metric registry version is required")

        raw_metrics = payload.get("metrics")
        if not isinstance(raw_metrics, dict) or not raw_metrics:
            raise MetricRegistryError("Metric registry must declare at least one metric")

        metrics: Dict[str, MetricDefinition] = {}
        for code, item in raw_metrics.items():
            if not isinstance(code, str) or not code.strip():
                raise MetricRegistryError("Metric codes must be non-empty strings")
            if not isinstance(item, dict):
                raise MetricRegistryError(f"Metric {code!r} must be a mapping")

            method = str(item.get("method", "")).strip()
            if method not in cls.SUPPORTED_METHODS:
                raise MetricRegistryError(
                    f"Metric {code!r} uses unsupported method {method!r}"
                )

            required_series = item.get("required_series")
            if (
                not isinstance(required_series, list)
                or not required_series
                or not all(
                    isinstance(value, str) and value.strip()
                    for value in required_series
                )
            ):
                raise MetricRegistryError(
                    f"Metric {code!r} requires a non-empty required_series list"
                )

            parameters = item.get("parameters", {})
            if not isinstance(parameters, dict):
                raise MetricRegistryError(
                    f"Metric {code!r} parameters must be a mapping"
                )

            metric = MetricDefinition(
                code=code.strip(),
                name=str(item.get("name", "")).strip(),
                unit=str(item.get("unit", "")).strip(),
                method=method,
                required_series=tuple(value.strip() for value in required_series),
                parameters=dict(parameters),
                description=str(item.get("description", "")).strip(),
            )
            if not metric.name or not metric.unit or not metric.description:
                raise MetricRegistryError(
                    f"Metric {code!r} requires name, unit and description"
                )

            cls._validate_parameters(metric)
            metrics[metric.code] = metric

        return cls(
            version=version,
            metrics=metrics,
            registry_hash=hashlib.sha256(raw).hexdigest(),
        )

    @staticmethod
    def _validate_parameters(metric: MetricDefinition) -> None:
        if metric.method == "latest":
            if len(metric.required_series) != 1:
                raise MetricRegistryError(
                    f"Latest metric {metric.code!r} requires exactly one series"
                )
            return

        if metric.method == "percent_change":
            if len(metric.required_series) != 1:
                raise MetricRegistryError(
                    f"Percent-change metric {metric.code!r} requires exactly one series"
                )
            lag = metric.parameters.get("lag_months")
            if not isinstance(lag, int) or lag <= 0:
                raise MetricRegistryError(
                    f"Percent-change metric {metric.code!r} needs positive lag_months"
                )
            return

        if metric.method == "difference":
            if len(metric.required_series) != 2:
                raise MetricRegistryError(
                    f"Difference metric {metric.code!r} requires exactly two series"
                )
            return

        if metric.method == "policy_rate_minus_yoy_inflation":
            if len(metric.required_series) != 2:
                raise MetricRegistryError(
                    f"Real-rate proxy {metric.code!r} requires exactly two series"
                )
            lag = metric.parameters.get("inflation_lag_months")
            if not isinstance(lag, int) or lag <= 0:
                raise MetricRegistryError(
                    f"Real-rate proxy {metric.code!r} needs positive inflation_lag_months"
                )

    def ordered_metrics(self) -> Tuple[MetricDefinition, ...]:
        return tuple(self.metrics.values())
