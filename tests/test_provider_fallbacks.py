"""Regression tests for honest external-provider failure behaviour."""
from __future__ import annotations

from typing import Any

import requests

from apps.utils.blockchain_tracker import BlockchainTracker
from apps.utils.live_asset_tracker import LiveAssetTracker


class FakeResponse:
    def __init__(
        self,
        *,
        payload: Any = None,
        text: str = "",
        status_code: int = 200,
    ) -> None:
        self._payload = payload
        self.text = text
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise requests.HTTPError(f"HTTP {self.status_code}")

    def json(self) -> Any:
        return self._payload


class AssetSession:
    def __init__(self) -> None:
        self.fail = False

    def get(self, *_args: Any, **_kwargs: Any) -> FakeResponse:
        if self.fail:
            raise requests.ConnectionError("CoinGecko unavailable")
        return FakeResponse(
            payload={
                "bitcoin": {
                    "usd": 100_000,
                    "usd_24h_change": 1.25,
                    "last_updated_at": 1_700_000_000,
                },
                "ethereum": {
                    "usd": 4_000,
                    "usd_24h_change": -0.5,
                    "last_updated_at": 1_700_000_000,
                },
                "tether-gold": {
                    "usd": 2_500,
                    "usd_24h_change": 0.1,
                    "last_updated_at": 1_700_000_000,
                },
                "silver-token": {
                    "usd": 35,
                    "usd_24h_change": 0.2,
                    "last_updated_at": 1_700_000_000,
                },
            }
        )


class FailingSession:
    def get(self, *_args: Any, **_kwargs: Any) -> FakeResponse:
        raise requests.ConnectionError("Provider unavailable")


class MempoolSession:
    def __init__(self) -> None:
        self.fail = False

    def get(self, url: str, *_args: Any, **_kwargs: Any) -> FakeResponse:
        if self.fail:
            raise requests.ConnectionError("mempool.space unavailable")
        if url.endswith("/blocks/tip/height"):
            return FakeResponse(text="900000")
        if url.endswith("/v1/difficulty-adjustment"):
            return FakeResponse(
                payload={
                    "currentDifficulty": 80_000_000_000_000,
                    "progressPercent": 50.0,
                    "difficultyChange": 1.2,
                    "estimatedRetargetDate": 1_800_000_000,
                    "remainingBlocks": 1008,
                    "remainingTime": 604800000,
                }
            )
        if url.endswith("/mempool"):
            return FakeResponse(
                payload={"count": 12_345, "vsize": 45_000_000, "total_fee": 2.5}
            )
        if url.endswith("/v1/fees/recommended"):
            return FakeResponse(
                payload={"fastestFee": 12, "halfHourFee": 8, "hourFee": 5}
            )
        raise AssertionError(f"Unexpected test URL: {url}")


def test_asset_tracker_reports_unavailable_instead_of_fabricating_prices() -> None:
    tracker = LiveAssetTracker(session=FailingSession())

    prices = tracker.get_latest_prices()

    assert set(prices) == {"bitcoin", "ethereum", "gold", "silver"}
    for observation in prices.values():
        assert observation["price"] == 0.0
        assert observation["status"] == "unavailable"
        assert observation["is_last_known_good"] is False
        assert observation["updated_at"] is None
        assert "Demo" not in observation["source"]
        assert observation["error"]


def test_asset_tracker_preserves_last_known_good_as_stale() -> None:
    session = AssetSession()
    tracker = LiveAssetTracker(session=session)

    first = tracker.get_latest_prices()["bitcoin"]
    assert first["price"] == 100_000
    assert first["status"] == "live"

    session.fail = True
    tracker.last_update_time = 0
    second = tracker.get_latest_prices()["bitcoin"]

    assert second["price"] == first["price"]
    assert second["updated_at"] == first["updated_at"]
    assert second["status"] == "stale"
    assert second["is_last_known_good"] is True
    assert second["error"] == "CoinGecko unavailable"


def test_blockchain_tracker_reports_unavailable_without_fake_stats() -> None:
    tracker = BlockchainTracker(session=FailingSession())

    stats = tracker.get_blockchain_stats()

    assert stats["status"] == "unavailable"
    assert stats["block_height"] == 0
    assert stats["difficulty"] == 0
    assert stats["hashrate"] == 0
    assert all(status == "unavailable" for status in stats["field_status"].values())
    assert stats["network_health"]["status"] == "not_scored"
    assert stats["network_health"]["security_score"] is None
    assert stats["network_health"]["decentralization_score"] is None
    assert stats["warnings"]


def test_blockchain_tracker_preserves_last_known_good_fields_as_stale() -> None:
    session = MempoolSession()
    tracker = BlockchainTracker(session=session)

    first = tracker.get_blockchain_stats()
    assert first["status"] == "live"
    assert first["block_height"] == 900000
    assert first["fees"]["fastestFee"] == 12

    session.fail = True
    tracker.last_update = 0
    second = tracker.get_blockchain_stats()

    assert second["status"] == "degraded"
    assert second["block_height"] == first["block_height"]
    assert second["difficulty"] == first["difficulty"]
    assert second["mempool"] == first["mempool"]
    assert second["fees"] == first["fees"]
    assert all(status == "stale" for status in second["field_status"].values())
    assert second["is_last_known_good"] is True


def test_difficulty_adjustment_failure_has_explicit_contract() -> None:
    tracker = BlockchainTracker(session=FailingSession())

    result = tracker.get_difficulty_adjustment_info()

    assert result["status"] == "unavailable"
    assert result["source"] == "mempool.space"
    assert result["difficulty_change"] is None
    assert result["remaining_blocks"] is None
    assert result["error"]
