// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/lib/api';
import { useTrustedSnapshot } from '@/hooks/useTrustedSnapshot';
import type { TrustedSnapshotEnvelope } from '@/types/trustedSnapshot';
import { TrustedSnapshotPanel } from './TrustedSnapshotPanel';

vi.mock('@/hooks/useTrustedSnapshot', () => ({
  useTrustedSnapshot: vi.fn(),
}));

const mockedUseTrustedSnapshot = vi.mocked(useTrustedSnapshot);
const refetch = vi.fn();

const envelope: TrustedSnapshotEnvelope = {
  data: {
    snapshot_id: '0123456789abcdef01234567',
    as_of_date: '2025-02-01',
    methodology_version: '2026-07-16.1',
    generated_at: '2025-02-01T13:00:00+00:00',
    status: 'complete',
    coverage_ratio: 1,
    available_metrics: 1,
    total_metrics: 1,
    input_fingerprint: 'a'.repeat(64),
    registry_hash: 'b'.repeat(64),
    metrics: {
      m2_yoy_pct: {
        code: 'm2_yoy_pct',
        name: 'M2 Year-over-Year Growth',
        unit: 'percent',
        value: 4.25,
        status: 'available',
        observation_date: '2025-01-01',
        freshness_days: 31,
        formula: '(current / lagged - 1) * 100',
        reason: null,
        lineage: [
          {
            internal_code: 'us_m2',
            observation_date: '2025-01-01',
            value: 22000,
            vintage_date: '2025-01-20',
            retrieved_at: '2025-02-01T12:00:00+00:00',
            source_url: 'https://fred.stlouisfed.org/series/M2SL',
            source_payload_hash: 'hash-m2',
          },
        ],
      },
    },
  },
  meta: {
    contract_version: '1.0',
    read_only: true,
    source: 'trusted_snapshot_store',
  },
};

function queryResult(overrides: Record<string, unknown>) {
  return {
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
    refetch,
    ...overrides,
  } as unknown as ReturnType<typeof useTrustedSnapshot>;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('TrustedSnapshotPanel', () => {
  it('renders deterministic values and provenance from a valid snapshot', () => {
    mockedUseTrustedSnapshot.mockReturnValue(queryResult({ data: envelope }));

    render(<TrustedSnapshotPanel />);

    expect(screen.getByRole('heading', { name: 'Trusted economic snapshot' })).not.toBeNull();
    expect(screen.getByText(/100%/)).not.toBeNull();
    expect(screen.getByText('4.25%')).not.toBeNull();
    expect(screen.getByText('Read-only · deterministic')).not.toBeNull();

    fireEvent.click(screen.getByText('Formula and provenance'));
    const source = screen.getByRole('link', { name: /Source/ });
    expect(source.getAttribute('href')).toBe('https://fred.stlouisfed.org/series/M2SL');
  });

  it('preserves date-only fields in time zones west of UTC', () => {
    const originalTimeZone = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';

    try {
      mockedUseTrustedSnapshot.mockReturnValue(queryResult({ data: envelope }));

      render(<TrustedSnapshotPanel />);

      expect(screen.getByText('01 Feb 2025')).not.toBeNull();
      expect(screen.getByText('01 Jan 2025')).not.toBeNull();
      expect(screen.getByText(/us_m2 · vintage 20 Jan 2025/)).not.toBeNull();
    } finally {
      if (originalTimeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimeZone;
      }
    }
  });

  it('shows an explicit unavailable state without fabricated replacement values', () => {
    mockedUseTrustedSnapshot.mockReturnValue(
      queryResult({
        error: new ApiClientError('Trusted snapshot store is unavailable.', {
          status: 503,
          code: 'snapshot_store_unavailable',
        }),
      })
    );

    render(<TrustedSnapshotPanel />);

    expect(screen.getByRole('heading', { name: 'Trusted snapshot store unavailable' })).not.toBeNull();
    expect(screen.getByText(/No replacement or simulated values are being shown/)).not.toBeNull();
    expect(screen.queryByText('4.25%')).toBeNull();
  });

  it('distinguishes an empty store from a transport failure', () => {
    mockedUseTrustedSnapshot.mockReturnValue(
      queryResult({
        error: new ApiClientError('No trusted snapshots have been persisted.', {
          status: 404,
          code: 'snapshot_not_found',
        }),
      })
    );

    render(<TrustedSnapshotPanel />);

    expect(screen.getByRole('heading', { name: 'Waiting for the first trusted snapshot' })).not.toBeNull();
    expect(screen.getByText(/no deterministic snapshot has been persisted yet/i)).not.toBeNull();
  });
});
