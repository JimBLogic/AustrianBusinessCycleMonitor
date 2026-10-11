"""Core monitor functionality tests (consolidated)."""
from pathlib import Path
import sys
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
from apps.core.austrian_monitor import AustrianCycleMonitor  # type: ignore  # noqa: E402


def test_cycle_monitor_basic():
    monitor = AustrianCycleMonitor()
    analysis = getattr(monitor, 'get_current_analysis', lambda: None)() or monitor.analyze()
    assert analysis is not None
    # Support possible attribute naming differences
    phase = getattr(analysis, 'phase', None) or getattr(analysis, 'cycle_phase', None)
    assert phase is not None


def test_market_data_shape():
    monitor = AustrianCycleMonitor()
    data = monitor.get_market_data()
    assert isinstance(data, dict)
    assert 'bitcoin' in data
