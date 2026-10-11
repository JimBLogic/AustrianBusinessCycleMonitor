"""Bitcoin network statistics with honest failure and freshness semantics.

No network value is synthesized. Missing provider responses are reported as
unavailable, while previously validated observations may be retained as stale.
"""
from __future__ import annotations

import copy
import logging
import time
from datetime import UTC, datetime
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)


class BlockchainTracker:
    """Fetch Bitcoin network metrics from the documented mempool.space API."""

    def __init__(self, session: Optional[requests.Session] = None) -> None:
        self.mempool_base = "https://mempool.space/api"
        self.last_update = 0.0
        self.cache_duration = 60
        self._stats_cache: Dict[str, Any] = {}
        self.session = session or requests.Session()

    def get_blockchain_stats(self) -> Dict[str, Any]:
        now = time.time()
        if now - self.last_update < self.cache_duration and self._stats_cache:
            return copy.deepcopy(self._stats_cache)

        block_height = self._get_block_height()
        difficulty = self._get_difficulty()
        hashrate = self._calculate_hashrate(difficulty)
        mempool = self._get_mempool_stats()
        fees = self._get_fee_estimates()

        fresh_values: Dict[str, Any] = {
            "block_height": block_height,
            "hashrate": hashrate,
            "difficulty": difficulty,
            "mempool": mempool,
            "fees": fees,
        }
        resolved_values: Dict[str, Any] = {}
        field_status: Dict[str, str] = {}
        warnings = []

        previous_availability = self._stats_cache.get("availability", {})
        for field, value in fresh_values.items():
            if value is not None:
                resolved_values[field] = value
                field_status[field] = "live"
                continue

            if self._stats_cache and previous_availability.get(field):
                resolved_values[field] = copy.deepcopy(self._stats_cache.get(field))
                field_status[field] = "stale"
                warnings.append(f"{field} retained from the last known good snapshot")
            else:
                resolved_values[field] = self._empty_value(field)
                field_status[field] = "unavailable"
                warnings.append(f"{field} unavailable from mempool.space")

        live_count = sum(status == "live" for status in field_status.values())
        stale_count = sum(status == "stale" for status in field_status.values())
        if live_count == len(field_status):
            overall_status = "live"
        elif live_count or stale_count:
            overall_status = "degraded"
        else:
            overall_status = "unavailable"

        stats = {
            **resolved_values,
            "network_health": self._network_health_not_scored(),
            "timestamp": datetime.now(UTC).isoformat(),
            "retrieved_at": now,
            "source": "mempool.space",
            "status": overall_status,
            "availability": {
                field: status in {"live", "stale"}
                for field, status in field_status.items()
            },
            "field_status": field_status,
            "is_last_known_good": stale_count > 0,
            "warnings": warnings,
        }

        self._stats_cache = stats
        self.last_update = now
        logger.info(
            "Bitcoin network refresh completed with status=%s block=%s",
            overall_status,
            stats["block_height"] or "unavailable",
        )
        return copy.deepcopy(stats)

    @staticmethod
    def _empty_value(field: str) -> Any:
        if field == "mempool":
            return {"count": 0, "vsize": 0, "total_fee": 0}
        if field == "fees":
            return {"fastestFee": 0, "halfHourFee": 0, "hourFee": 0}
        return 0

    def _get_block_height(self) -> Optional[int]:
        try:
            response = self.session.get(
                f"{self.mempool_base}/blocks/tip/height", timeout=5
            )
            response.raise_for_status()
            height = int(response.text)
            return height if height > 0 else None
        except (requests.RequestException, TypeError, ValueError) as exc:
            logger.warning("Block height fetch failed: %s", exc)
            return None

    def _get_difficulty(self) -> Optional[float]:
        try:
            response = self.session.get(
                f"{self.mempool_base}/v1/difficulty-adjustment", timeout=5
            )
            response.raise_for_status()
            payload = response.json()
            difficulty = payload.get("currentDifficulty") if isinstance(payload, dict) else None
            if isinstance(difficulty, (int, float)) and difficulty > 0:
                return float(difficulty)
        except (requests.RequestException, TypeError, ValueError) as exc:
            logger.warning("Difficulty fetch failed: %s", exc)
        return None

    @staticmethod
    def _calculate_hashrate(difficulty: Optional[float]) -> Optional[float]:
        if difficulty is None or difficulty <= 0:
            return None
        return (difficulty * (2**32)) / 600

    def _get_mempool_stats(self) -> Optional[Dict[str, Any]]:
        try:
            response = self.session.get(f"{self.mempool_base}/mempool", timeout=5)
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict):
                return {
                    "count": int(payload.get("count", 0)),
                    "vsize": int(payload.get("vsize", 0)),
                    "total_fee": float(payload.get("total_fee", 0)),
                }
        except (requests.RequestException, TypeError, ValueError) as exc:
            logger.warning("Mempool stats fetch failed: %s", exc)
        return None

    def _get_fee_estimates(self) -> Optional[Dict[str, Any]]:
        try:
            response = self.session.get(
                f"{self.mempool_base}/v1/fees/recommended", timeout=5
            )
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict):
                return {
                    "fastestFee": int(payload.get("fastestFee", 0)),
                    "halfHourFee": int(payload.get("halfHourFee", 0)),
                    "hourFee": int(payload.get("hourFee", 0)),
                }
        except (requests.RequestException, TypeError, ValueError) as exc:
            logger.warning("Fee estimates fetch failed: %s", exc)
        return None

    @staticmethod
    def _network_health_not_scored() -> Dict[str, Any]:
        return {
            "security_score": None,
            "decentralization_score": None,
            "status": "not_scored",
            "methodology": (
                "Composite network-health scoring is disabled until auditable "
                "hashrate, node-count and decentralization inputs are defined."
            ),
        }

    def get_difficulty_adjustment_info(self) -> Dict[str, Any]:
        attempted_at = time.time()
        try:
            response = self.session.get(
                f"{self.mempool_base}/v1/difficulty-adjustment", timeout=5
            )
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, dict):
                raise ValueError("mempool.space returned a non-object response")
            return {
                "progress_percent": payload.get("progressPercent"),
                "difficulty_change": payload.get("difficultyChange"),
                "estimated_retarget_date": payload.get("estimatedRetargetDate"),
                "remaining_blocks": payload.get("remainingBlocks"),
                "remaining_time": payload.get("remainingTime"),
                "source": "mempool.space",
                "status": "live",
                "retrieved_at": attempted_at,
                "error": None,
            }
        except (requests.RequestException, TypeError, ValueError) as exc:
            logger.warning("Difficulty adjustment fetch failed: %s", exc)
            return {
                "progress_percent": None,
                "difficulty_change": None,
                "estimated_retarget_date": None,
                "remaining_blocks": None,
                "remaining_time": None,
                "source": "mempool.space",
                "status": "unavailable",
                "retrieved_at": attempted_at,
                "error": str(exc),
            }


_tracker_instance: Optional[BlockchainTracker] = None


def get_blockchain_tracker() -> BlockchainTracker:
    global _tracker_instance
    if _tracker_instance is None:
        _tracker_instance = BlockchainTracker()
    return _tracker_instance
