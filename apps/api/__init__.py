"""Read-only HTTP interfaces for trusted application data."""

from .trusted_snapshots import register_trusted_snapshot_routes

__all__ = ["register_trusted_snapshot_routes"]
