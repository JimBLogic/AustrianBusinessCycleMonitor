import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import api, { ApiClientError } from '@/lib/api';
import type { TrustedSnapshotEnvelope } from '@/types/trustedSnapshot';

const lineageSchema = z.object({
  internal_code: z.string().min(1),
  observation_date: z.string().min(1),
  value: z.number().finite(),
  vintage_date: z.string().min(1),
  retrieved_at: z.string().min(1),
  source_url: z.string().url(),
  source_payload_hash: z.string().min(1),
});

const metricSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
  value: z.number().finite().nullable(),
  status: z.enum(['available', 'stale', 'unavailable']),
  observation_date: z.string().nullable(),
  freshness_days: z.number().int().nonnegative().nullable(),
  formula: z.string().min(1),
  reason: z.string().nullable(),
  lineage: z.array(lineageSchema),
});

const trustedSnapshotEnvelopeSchema = z.object({
  data: z.object({
    snapshot_id: z.string().regex(/^[0-9a-f]{24}$/),
    as_of_date: z.string().min(1),
    methodology_version: z.string().min(1),
    generated_at: z.string().min(1),
    status: z.enum(['complete', 'degraded', 'unavailable']),
    coverage_ratio: z.number().min(0).max(1),
    available_metrics: z.number().int().nonnegative(),
    total_metrics: z.number().int().nonnegative(),
    input_fingerprint: z.string().min(1),
    registry_hash: z.string().min(1),
    metrics: z.record(metricSchema),
  }),
  meta: z.object({
    contract_version: z.string().min(1),
    read_only: z.literal(true),
    source: z.literal('trusted_snapshot_store'),
  }),
});

export function useTrustedSnapshot() {
  return useQuery<TrustedSnapshotEnvelope, ApiClientError>({
    queryKey: ['trusted-snapshots', 'latest'],
    queryFn: async ({ signal }) => {
      const response = await api.get<unknown>('/api/trusted-snapshots/latest', { signal });
      const parsed = trustedSnapshotEnvelopeSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new ApiClientError('Trusted snapshot response failed contract validation.', {
          code: 'invalid_trusted_snapshot_contract',
          details: parsed.error.flatten(),
        });
      }

      return parsed.data;
    },
    retry: (failureCount, error) => {
      if (error.status === 400 || error.status === 404) {
        return false;
      }
      return failureCount < 1;
    },
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}
