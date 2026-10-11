"""Trusted economic-data ingestion primitives."""

from .contracts import NormalizedObservation, ProviderFetchResult, SeriesDefinition
from .registry import SeriesRegistryError, load_series_registry
from .sqlite_repository import SQLiteObservationRepository

__all__ = [
    "NormalizedObservation",
    "ProviderFetchResult",
    "SeriesDefinition",
    "SeriesRegistryError",
    "SQLiteObservationRepository",
    "load_series_registry",
]
