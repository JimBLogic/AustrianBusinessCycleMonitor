import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { useTrustedSnapshot } from '@/hooks/useTrustedSnapshot';
import type {
  TrustedMetric,
  TrustedMetricStatus,
  TrustedObservationLineage,
  TrustedSnapshotStatus,
} from '@/types/trustedSnapshot';

const metricStatusStyles: Record<TrustedMetricStatus, string> = {
  available: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  stale: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  unavailable: 'border-slate-600 bg-slate-800/80 text-slate-300',
};

const snapshotStatusStyles: Record<TrustedSnapshotStatus, string> = {
  complete: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  degraded: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  unavailable: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
};

function formatDate(value: string, includeTime = false): string {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isDateOnly ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(isDateOnly ? { timeZone: 'UTC' } : {}),
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

function formatMetricValue(metric: TrustedMetric): string {
  if (metric.value === null) {
    return 'Not available';
  }

  const rendered = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: Math.abs(metric.value) < 10 ? 2 : 1,
    maximumFractionDigits: Math.abs(metric.value) < 10 ? 2 : 1,
  }).format(metric.value);

  if (metric.unit === 'percent') {
    return `${rendered}%`;
  }
  if (metric.unit === 'percentage_points') {
    return `${rendered} pp`;
  }
  return `${rendered} ${metric.unit}`;
}

function sourceKey(source: TrustedObservationLineage): string {
  return `${source.internal_code}:${source.source_url}`;
}

function MetricCard({ metric }: { metric: TrustedMetric }) {
  const sources = useMemo(() => {
    const unique = new Map<string, TrustedObservationLineage>();
    metric.lineage.forEach((source) => unique.set(sourceKey(source), source));
    return [...unique.values()];
  }, [metric.lineage]);

  return (
    <article className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.code}</p>
          <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-100">{metric.name}</h3>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${metricStatusStyles[metric.status]}`}
        >
          {metric.status}
        </span>
      </div>

      <p className="mt-4 text-2xl font-semibold tabular-nums text-white">{formatMetricValue(metric)}</p>

      <dl className="mt-4 space-y-2 text-xs text-slate-400">
        <div className="flex justify-between gap-3">
          <dt>Observation</dt>
          <dd className="text-right text-slate-200">
            {metric.observation_date ? formatDate(metric.observation_date) : '—'}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Freshness</dt>
          <dd className="text-right text-slate-200">
            {metric.freshness_days === null ? '—' : `${metric.freshness_days} days`}
          </dd>
        </div>
      </dl>

      {metric.reason ? (
        <p className="mt-3 rounded-md border border-slate-700 bg-slate-950/60 p-2 text-xs leading-relaxed text-slate-300">
          {metric.reason}
        </p>
      ) : null}

      <details className="group mt-4 border-t border-slate-800 pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
          Formula and provenance
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="mt-3 space-y-3 text-xs text-slate-400">
          <p className="rounded-md bg-slate-950/70 p-2 font-mono leading-relaxed text-slate-300">{metric.formula}</p>
          {sources.length > 0 ? (
            <ul className="space-y-2">
              {sources.map((source) => (
                <li key={sourceKey(source)} className="flex items-start justify-between gap-3">
                  <span>
                    {source.internal_code} · vintage {formatDate(source.vintage_date)}
                  </span>
                  <a
                    href={source.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-orange-300 underline-offset-2 hover:underline"
                  >
                    Source <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>No source observation was available for this metric.</p>
          )}
        </div>
      </details>
    </article>
  );
}

function LoadingPanel() {
  return (
    <section
      aria-label="Loading trusted economic snapshot"
      aria-busy="true"
      className="border-b border-slate-800 bg-slate-950 px-4 py-6 text-white"
    >
      <div className="container mx-auto animate-pulse">
        <div className="h-6 w-64 rounded bg-slate-800" />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 rounded-xl border border-slate-800 bg-slate-900" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrustedSnapshotPanel() {
  const { data, error, isLoading, isFetching, refetch } = useTrustedSnapshot();
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  if (isLoading) {
    return <LoadingPanel />;
  }

  if (error || !data) {
    const isMissing = error?.status === 404;
    const isUnavailable = error?.status === 503;
    const title = isMissing
      ? 'Waiting for the first trusted snapshot'
      : isUnavailable
        ? 'Trusted snapshot store unavailable'
        : 'Trusted snapshot could not be loaded';
    const description = isMissing
      ? 'The dashboard remains available, but no deterministic snapshot has been persisted yet.'
      : isUnavailable
        ? 'The read-only data store cannot be reached. No replacement or simulated values are being shown.'
        : error?.message ?? 'The trusted data contract could not be read.';

    return (
      <section className="border-b border-slate-800 bg-slate-950 px-4 py-5 text-white" aria-labelledby="trusted-snapshot-error-title">
        <div className="container mx-auto flex flex-col gap-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3" role="status">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
            <div>
              <h2 id="trusted-snapshot-error-title" className="font-semibold text-slate-100">{title}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-orange-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
            Retry
          </button>
        </div>
      </section>
    );
  }

  const snapshot = data.data;
  const metrics = Object.values(snapshot.metrics);
  const visibleMetrics = showAllMetrics ? metrics : metrics.slice(0, 5);
  const coveragePercent = Math.round(snapshot.coverage_ratio * 100);

  return (
    <section className="border-b border-orange-500/20 bg-slate-950 px-4 py-6 text-white" aria-labelledby="trusted-snapshot-title">
      <div className="container mx-auto">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-2.5 text-orange-300">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="trusted-snapshot-title" className="text-xl font-semibold text-slate-50">Trusted economic snapshot</h2>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${snapshotStatusStyles[snapshot.status]}`}>
                  {snapshot.status}
                </span>
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-200">
                  Read-only · deterministic
                </span>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
                Persisted FRED observations transformed through versioned formulas. This panel does not refresh providers or execute the legacy analysis engine.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-orange-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
            Revalidate
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500"><Database className="h-4 w-4" aria-hidden="true" /> Coverage</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-100">{coveragePercent}% <span className="text-sm font-normal text-slate-500">({snapshot.available_metrics}/{snapshot.total_metrics})</span></dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500"><Clock3 className="h-4 w-4" aria-hidden="true" /> As of</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-100">{formatDate(snapshot.as_of_date)}</dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Methodology</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-100">{snapshot.methodology_version}</dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Generated</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-100">{formatDate(snapshot.generated_at, true)}</dd>
          </div>
        </dl>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {visibleMetrics.map((metric) => <MetricCard key={metric.code} metric={metric} />)}
        </div>

        {metrics.length > 5 ? (
          <button
            type="button"
            onClick={() => setShowAllMetrics((current) => !current)}
            aria-expanded={showAllMetrics}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-orange-400 hover:text-white"
          >
            {showAllMetrics ? 'Show fewer metrics' : `Show all ${metrics.length} metrics`}
            <ChevronDown className={`h-4 w-4 transition-transform ${showAllMetrics ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        ) : null}

        <div className="mt-5 flex flex-col gap-1 border-t border-slate-800 pt-4 font-mono text-[11px] text-slate-600 md:flex-row md:items-center md:justify-between">
          <span>Snapshot {snapshot.snapshot_id}</span>
          <span>Registry {snapshot.registry_hash.slice(0, 16)}… · Inputs {snapshot.input_fingerprint.slice(0, 16)}…</span>
        </div>
      </div>
    </section>
  );
}
