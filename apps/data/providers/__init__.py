"""External provider adapters."""

from .fred import FredProvider, FredProviderError

__all__ = ["FredProvider", "FredProviderError"]
