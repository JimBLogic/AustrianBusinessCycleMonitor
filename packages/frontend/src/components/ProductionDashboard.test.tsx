// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n';
import { ApiClientError } from '@/lib/api';
import { useTrustedSnapshot } from '@/hooks/useTrustedSnapshot';
import type { TrustedSnapshotEnvelope } from '@/types/trustedSnapshot';
import { ProductionDashboard } from './ProductionDashboard';

vi.mock('@/hooks/useTrustedSnapshot', () => ({
  useTrustedSnapshot: vi.fn(),
}));

const mockedUseTrustedSnapshot = vi.mocked(useTrustedSnapshot);
const refetch = vi.fn();

const envelope: TrustedSnapshotEnvelope = {
  data: {
    snapshot_id: '0123456789abcdef01234567',
    as_of_date: '2026-07-01',
    methodology_version: '2026-07-16.1',
    generated_at: '2026-07-02T10:00:00+00:00',
    status: 'complete',
    coverage_ratio: 1,
    available_metrics: 1,
    total_metrics: 1,
    input_fingerprint: 'a'.repeat(64),
    registry_hash: 'b'.repeat(64),
    metrics: {
      cpi_yoy_pct: {
        code: 'cpi_yoy_pct',
        name: 'CPI Year-over-Year Inflation',
        unit: 'percent',
        value: 2.75,
        status: 'available',
        observation_date: '2026-06-01',
        freshness_days: 30,
        formula: '((cpi[t] / cpi[t-12m]) - 1) * 100',
        reason: null,
        lineage: [
          {
            internal_code: 'us_cpi_all_urban',
            observation_date: '2026-06-01',
            value: 320,
            vintage_date: '2026-07-01',
            retrieved_at: '2026-07-02T09:00:00+00:00',
            source_url: 'https://fred.stlouisfed.org/series/CPIAUCSL',
            source_payload_hash: 'hash',
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

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ProductionDashboard', () => {
  it('renders the verified snapshot without mounting legacy copy', () => {
    mockedUseTrustedSnapshot.mockReturnValue(queryResult({ data: envelope }));

    render(<ProductionDashboard />);

    expect(screen.getByRole('heading', { name: 'Trusted economic data' })).not.toBeNull();
    expect(screen.getByText('CPI annual inflation')).not.toBeNull();
    expect(screen.getByText('2.75%')).not.toBeNull();
    expect(screen.queryByText('In Satoshi We Trust')).toBeNull();
  });

  it('uses contextual Spanish copy for the public view', async () => {
    await i18n.changeLanguage('es');
    mockedUseTrustedSnapshot.mockReturnValue(queryResult({ data: envelope }));

    render(<ProductionDashboard />);

    expect(screen.getByRole('heading', { name: 'Datos económicos de confianza' })).not.toBeNull();
    expect(screen.getByText('Inflación interanual del IPC')).not.toBeNull();
    expect(screen.getByText('Variación interanual del índice de precios de consumo.')).not.toBeNull();
  });

  it('explains a missing snapshot without displaying substitute figures', () => {
    mockedUseTrustedSnapshot.mockReturnValue(
      queryResult({
        error: new ApiClientError('No trusted snapshots have been persisted.', {
          status: 404,
          code: 'snapshot_not_found',
        }),
      }),
    );

    render(<ProductionDashboard />);

    expect(screen.getByRole('heading', { name: 'Waiting for the first verified snapshot' })).not.toBeNull();
    expect(screen.queryByText('2.75%')).toBeNull();
  });
});
