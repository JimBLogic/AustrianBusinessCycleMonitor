export type TrustedMetricStatus = 'available' | 'stale' | 'unavailable';
export type TrustedSnapshotStatus = 'complete' | 'degraded' | 'unavailable';

export interface TrustedObservationLineage {
  internal_code: string;
  observation_date: string;
  value: number;
  vintage_date: string;
  retrieved_at: string;
  source_url: string;
  source_payload_hash: string;
}

export interface TrustedMetric {
  code: string;
  name: string;
  unit: string;
  value: number | null;
  status: TrustedMetricStatus;
  observation_date: string | null;
  freshness_days: number | null;
  formula: string;
  reason: string | null;
  lineage: TrustedObservationLineage[];
}

export interface TrustedSnapshot {
  snapshot_id: string;
  as_of_date: string;
  methodology_version: string;
  generated_at: string;
  status: TrustedSnapshotStatus;
  coverage_ratio: number;
  available_metrics: number;
  total_metrics: number;
  input_fingerprint: string;
  registry_hash: string;
  metrics: Record<string, TrustedMetric>;
}

export interface TrustedSnapshotMeta {
  contract_version: string;
  read_only: true;
  source: 'trusted_snapshot_store';
}

export interface TrustedSnapshotEnvelope {
  data: TrustedSnapshot;
  meta: TrustedSnapshotMeta;
}
