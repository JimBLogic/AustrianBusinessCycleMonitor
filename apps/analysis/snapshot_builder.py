"""Build reproducible macroeconomic snapshots from trusted source observations."""

from __future__ import annotations

import calendar
import hashlib
import json
from dataclasses import dataclass
from datetime import UTC, date, datetime
from typing import Mapping, Optional, Sequence, Tuple

from apps.data.contracts import SeriesDefinition
from apps.data.observation_reader import SQLiteObservationReader

from .contracts import (
    DeterministicSnapshot,
    MetricDefinition,
    MetricResult,
    ObservationPoint,
)
from .registry import MetricRegistry


@dataclass(frozen=True, slots=True)
class _Calculation:
    value: Optional[float]
    observation_date: Optional[date]
    formula: str
    reason: Optional[str]
    lineage: Tuple[ObservationPoint, ...]
    freshness_points: Tuple[ObservationPoint, ...]


def _shift_months(value: date, months: int) -> date:
    month_index = value.year * 12 + (value.month - 1) + months
    year, month_zero = divmod(month_index, 12)
    month = month_zero + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _points_by_date(
    points: Sequence[ObservationPoint],
) -> Mapping[date, ObservationPoint]:
    return {point.observation_date: point for point in points}


class SnapshotBuilder:
    """Evaluate a versioned metric registry under an explicit vintage policy."""

    def __init__(
        self,
        reader: SQLiteObservationReader,
        registry: MetricRegistry,
        *,
        now_factory=lambda: datetime.now(UTC),
    ) -> None:
        self.reader = reader
        self.registry = registry
        self.now_factory = now_factory

    def build(self, *, as_of_date: date) -> DeterministicSnapshot:
        required_codes = tuple(
            sorted(
                {
                    code
                    for metric in self.registry.ordered_metrics()
                    for code in metric.required_series
                }
            )
        )
        definitions, observations = self.reader.load_required_series(
            required_codes,
            as_of_date=as_of_date,
        )

        metrics = tuple(
            self._calculate_metric(
                metric,
                as_of_date=as_of_date,
                definitions=definitions,
                observations=observations,
            )
            for metric in self.registry.ordered_metrics()
        )

        available_metrics = sum(
            1 for metric in metrics if metric.status != "unavailable"
        )
        total_metrics = len(metrics)
        coverage_ratio = (
            round(available_metrics / total_metrics, 6) if total_metrics else 0.0
        )
        if available_metrics == 0:
            status = "unavailable"
        elif all(metric.status == "available" for metric in metrics):
            status = "complete"
        else:
            status = "degraded"

        fingerprint_payload = {
            "as_of_date": as_of_date.isoformat(),
            "methodology_version": self.registry.version,
            "registry_hash": self.registry.registry_hash,
            "metrics": [
                {
                    "code": metric.code,
                    "status": metric.status,
                    "value": metric.value,
                    "observation_date": (
                        metric.observation_date.isoformat()
                        if metric.observation_date
                        else None
                    ),
                    "reason": metric.reason,
                    "lineage": [
                        {
                            "internal_code": point.internal_code,
                            "observation_date": point.observation_date.isoformat(),
                            "vintage_date": point.vintage_date.isoformat(),
                            "source_payload_hash": point.source_payload_hash,
                        }
                        for point in metric.lineage
                    ],
                }
                for metric in metrics
            ],
        }
        encoded = json.dumps(
            fingerprint_payload,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
        input_fingerprint = hashlib.sha256(encoded).hexdigest()
        snapshot_id = hashlib.sha256(
            (
                f"{as_of_date.isoformat()}|{self.registry.version}|"
                f"{input_fingerprint}"
            ).encode("utf-8")
        ).hexdigest()[:24]

        return DeterministicSnapshot(
            snapshot_id=snapshot_id,
            as_of_date=as_of_date,
            methodology_version=self.registry.version,
            generated_at=self.now_factory(),
            status=status,
            coverage_ratio=coverage_ratio,
            available_metrics=available_metrics,
            total_metrics=total_metrics,
            input_fingerprint=input_fingerprint,
            registry_hash=self.registry.registry_hash,
            metrics=metrics,
        )

    def _calculate_metric(
        self,
        metric: MetricDefinition,
        *,
        as_of_date: date,
        definitions: Mapping[str, SeriesDefinition],
        observations: Mapping[str, Tuple[ObservationPoint, ...]],
    ) -> MetricResult:
        missing_definitions = [
            code for code in metric.required_series if code not in definitions
        ]
        if missing_definitions:
            return self._unavailable(
                metric,
                reason=(
                    "Missing enabled series metadata: " + ", ".join(missing_definitions)
                ),
            )

        missing_observations = [
            code for code in metric.required_series if not observations.get(code)
        ]
        if missing_observations:
            return self._unavailable(
                metric,
                reason=(
                    f"No observations available as of {as_of_date.isoformat()}: "
                    + ", ".join(missing_observations)
                ),
            )

        if metric.method == "latest":
            calculation = self._latest(metric, observations)
        elif metric.method == "percent_change":
            calculation = self._percent_change(metric, observations)
        elif metric.method == "difference":
            calculation = self._difference(metric, observations)
        elif metric.method == "policy_rate_minus_yoy_inflation":
            calculation = self._real_policy_rate_proxy(metric, observations)
        else:
            return self._unavailable(
                metric,
                reason=f"Unsupported calculation method: {metric.method}",
            )

        if calculation.value is None:
            return self._unavailable(
                metric,
                reason=calculation.reason
                or "Required aligned observations are missing",
                formula=calculation.formula,
                lineage=calculation.lineage,
            )

        freshness_days = max(
            (as_of_date - point.observation_date).days
            for point in calculation.freshness_points
        )
        stale_series = [
            point.internal_code
            for point in calculation.freshness_points
            if (as_of_date - point.observation_date).days
            > definitions[point.internal_code].freshness_sla_days
        ]
        status = "stale" if stale_series else "available"
        reason = (
            "Freshness SLA exceeded for: " + ", ".join(sorted(set(stale_series)))
            if stale_series
            else None
        )

        return MetricResult(
            code=metric.code,
            name=metric.name,
            unit=metric.unit,
            value=round(calculation.value, 6),
            status=status,
            observation_date=calculation.observation_date,
            freshness_days=freshness_days,
            formula=calculation.formula,
            reason=reason,
            lineage=calculation.lineage,
        )

    @staticmethod
    def _unavailable(
        metric: MetricDefinition,
        *,
        reason: str,
        formula: Optional[str] = None,
        lineage: Tuple[ObservationPoint, ...] = (),
    ) -> MetricResult:
        return MetricResult(
            code=metric.code,
            name=metric.name,
            unit=metric.unit,
            value=None,
            status="unavailable",
            observation_date=None,
            freshness_days=None,
            formula=formula or metric.method,
            reason=reason,
            lineage=lineage,
        )

    @staticmethod
    def _latest(
        metric: MetricDefinition,
        observations: Mapping[str, Tuple[ObservationPoint, ...]],
    ) -> _Calculation:
        code = metric.required_series[0]
        point = observations[code][-1]
        return _Calculation(
            value=point.value,
            observation_date=point.observation_date,
            formula=f"latest({code})",
            reason=None,
            lineage=(point,),
            freshness_points=(point,),
        )

    @staticmethod
    def _percent_change(
        metric: MetricDefinition,
        observations: Mapping[str, Tuple[ObservationPoint, ...]],
    ) -> _Calculation:
        code = metric.required_series[0]
        lag_months = int(metric.parameters["lag_months"])
        points = observations[code]
        by_date = _points_by_date(points)

        for current in reversed(points):
            lag_date = _shift_months(current.observation_date, -lag_months)
            previous = by_date.get(lag_date)
            if previous is None:
                continue
            if previous.value == 0:
                return _Calculation(
                    value=None,
                    observation_date=None,
                    formula=(f"(({code}[t] / {code}[t-{lag_months}m]) - 1) * 100"),
                    reason=f"Lagged denominator is zero at {lag_date.isoformat()}",
                    lineage=(previous, current),
                    freshness_points=(current,),
                )
            value = ((current.value / previous.value) - 1.0) * 100.0
            return _Calculation(
                value=value,
                observation_date=current.observation_date,
                formula=(f"(({code}[t] / {code}[t-{lag_months}m]) - 1) * 100"),
                reason=None,
                lineage=(previous, current),
                freshness_points=(current,),
            )

        return _Calculation(
            value=None,
            observation_date=None,
            formula=f"(({code}[t] / {code}[t-{lag_months}m]) - 1) * 100",
            reason=(
                f"No exact {lag_months}-month aligned pair is available for {code}"
            ),
            lineage=(),
            freshness_points=(),
        )

    @staticmethod
    def _difference(
        metric: MetricDefinition,
        observations: Mapping[str, Tuple[ObservationPoint, ...]],
    ) -> _Calculation:
        minuend_code, subtrahend_code = metric.required_series
        left = _points_by_date(observations[minuend_code])
        right = _points_by_date(observations[subtrahend_code])
        common_dates = sorted(set(left).intersection(right))
        if not common_dates:
            return _Calculation(
                value=None,
                observation_date=None,
                formula=f"{minuend_code}[t] - {subtrahend_code}[t]",
                reason="No exact common observation date is available",
                lineage=(),
                freshness_points=(),
            )

        current_date = common_dates[-1]
        minuend = left[current_date]
        subtrahend = right[current_date]
        return _Calculation(
            value=minuend.value - subtrahend.value,
            observation_date=current_date,
            formula=f"{minuend_code}[t] - {subtrahend_code}[t]",
            reason=None,
            lineage=(minuend, subtrahend),
            freshness_points=(minuend, subtrahend),
        )

    @staticmethod
    def _real_policy_rate_proxy(
        metric: MetricDefinition,
        observations: Mapping[str, Tuple[ObservationPoint, ...]],
    ) -> _Calculation:
        policy_code, inflation_index_code = metric.required_series
        lag_months = int(metric.parameters["inflation_lag_months"])
        policy = _points_by_date(observations[policy_code])
        inflation = _points_by_date(observations[inflation_index_code])

        for current_date in sorted(set(policy).intersection(inflation), reverse=True):
            lag_date = _shift_months(current_date, -lag_months)
            lagged_inflation = inflation.get(lag_date)
            if lagged_inflation is None:
                continue
            current_inflation = inflation[current_date]
            if lagged_inflation.value == 0:
                return _Calculation(
                    value=None,
                    observation_date=None,
                    formula=(
                        f"{policy_code}[t] - "
                        f"(({inflation_index_code}[t] / "
                        f"{inflation_index_code}[t-{lag_months}m] - 1) * 100)"
                    ),
                    reason=(
                        "Lagged inflation index denominator is zero at "
                        f"{lag_date.isoformat()}"
                    ),
                    lineage=(
                        lagged_inflation,
                        current_inflation,
                        policy[current_date],
                    ),
                    freshness_points=(
                        current_inflation,
                        policy[current_date],
                    ),
                )

            inflation_yoy = (
                (current_inflation.value / lagged_inflation.value) - 1.0
            ) * 100.0
            policy_point = policy[current_date]
            return _Calculation(
                value=policy_point.value - inflation_yoy,
                observation_date=current_date,
                formula=(
                    f"{policy_code}[t] - "
                    f"(({inflation_index_code}[t] / "
                    f"{inflation_index_code}[t-{lag_months}m] - 1) * 100)"
                ),
                reason=None,
                lineage=(
                    lagged_inflation,
                    current_inflation,
                    policy_point,
                ),
                freshness_points=(current_inflation, policy_point),
            )

        return _Calculation(
            value=None,
            observation_date=None,
            formula=(
                f"{policy_code}[t] - "
                f"(({inflation_index_code}[t] / "
                f"{inflation_index_code}[t-{lag_months}m] - 1) * 100)"
            ),
            reason=(
                "No exact common policy/CPI date with the required inflation lag "
                "is available"
            ),
            lineage=(),
            freshness_points=(),
        )
