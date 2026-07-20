import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  ExternalLink,
  FileCheck2,
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
import LanguageSwitcher from './LanguageSwitcher';

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

function formatDate(value: string, locale: string, includeTime = false): string {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isDateOnly ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(isDateOnly ? { timeZone: 'UTC' } : {}),
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

function sourceKey(source: TrustedObservationLineage): string {
  return `${source.internal_code}:${source.observation_date}:${source.vintage_date}`;
}

function MethodologySection() {
  const { t } = useTranslation();
  const cards = [
    ['official', Database],
    ['deterministic', FileCheck2],
    ['interpretation', ShieldCheck],
  ] as const;

  return (
    <section className="border-t border-slate-800 bg-slate-950/80 px-4 py-12" aria-labelledby="methodology-title">
      <div className="container mx-auto max-w-6xl">
        <h2 id="methodology-title" className="text-2xl font-semibold text-white">
          {t('production.methodology.title')}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
          {t('production.methodology.intro')}
        </p>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {cards.map(([key, Icon]) => (
            <article key={key} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <Icon className="h-5 w-5 text-orange-300" aria-hidden="true" />
              <h3 className="mt-4 font-semibold text-slate-100">
                {t(`production.methodology.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {t(`production.methodology.${key}.body`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricCard({ metric, locale }: { metric: TrustedMetric; locale: string }) {
  const { t } = useTranslation();
  const sources = useMemo(() => {
    const unique = new Map<string, TrustedObservationLineage>();
    metric.lineage.forEach((source) => unique.set(sourceKey(source), source));
    return [...unique.values()];
  }, [metric.lineage]);

  const metricName = t(`production.metrics.${metric.code}.name`, { defaultValue: metric.name });
  const metricContext = t(`production.metrics.${metric.code}.context`, { defaultValue: '' });
  const renderedValue = metric.value === null
    ? t('production.snapshot.notAvailable')
    : new Intl.NumberFormat(locale, {
        minimumFractionDigits: Math.abs(metric.value) < 10 ? 2 : 1,
        maximumFractionDigits: Math.abs(metric.value) < 10 ? 2 : 1,
      }).format(metric.value);
  const unit = metric.value === null
    ? ''
    : metric.unit === 'percent'
      ? '%'
      : metric.unit === 'percentage_points'
        ? ' pp'
        : ` ${metric.unit}`;

  return (
    <article className="rounded-xl border border-slate-700/80 bg-slate-900/75 p-4 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.code}</p>
          <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-100">{metricName}</h3>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${metricStatusStyles[metric.status]}`}>
          {t(`production.status.${metric.status}`)}
        </span>
      </div>

      <p className="mt-4 text-2xl font-semibold tabular-nums text-white">
        {renderedValue}{unit}
      </p>
      {metricContext ? <p className="mt-2 text-xs leading-5 text-slate-500">{metricContext}</p> : null}

      <dl className="mt-4 space-y-2 text-xs text-slate-400">
        <div className="flex justify-between gap-3">
          <dt>{t('production.snapshot.observation')}</dt>
          <dd className="text-right text-slate-200">
            {metric.observation_date ? formatDate(metric.observation_date, locale) : '—'}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{t('production.snapshot.freshness')}</dt>
          <dd className="text-right text-slate-200">
            {metric.freshness_days === null
              ? '—'
              : t('production.snapshot.days', { count: metric.freshness_days })}
          </dd>
        </div>
      </dl>

      {metric.reason ? (
        <p className="mt-3 rounded-md border border-slate-700 bg-slate-950/60 p-2 text-xs leading-relaxed text-slate-300">
          <span className="font-semibold">{t('production.snapshot.technicalReason')}:</span>{' '}
          <span lang="en">{metric.reason}</span>
        </p>
      ) : null}

      <details className="group mt-4 border-t border-slate-800 pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
          {t('production.snapshot.formula')}
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="mt-3 space-y-3 text-xs text-slate-400">
          <p className="rounded-md bg-slate-950/70 p-2 font-mono leading-relaxed text-slate-300">{metric.formula}</p>
          {sources.length > 0 ? (
            <ul className="space-y-2">
              {sources.map((source) => (
                <li key={sourceKey(source)} className="flex items-start justify-between gap-3">
                  <span className="font-mono text-[11px]">
                    {source.internal_code} · {formatDate(source.vintage_date, locale)}
                  </span>
                  <a
                    href={source.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-orange-300 underline-offset-2 hover:underline"
                  >
                    {t('production.actions.source')}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t('production.snapshot.noSource')}</p>
          )}
        </div>
      </details>
    </article>
  );
}

function LoadingState() {
  const { t } = useTranslation();
  return (
    <main className="container mx-auto max-w-6xl px-4 py-12" aria-busy="true">
      <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm font-medium text-slate-300">{t('production.status.loading')}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-28 rounded-lg bg-slate-800" />)}
        </div>
      </div>
    </main>
  );
}

export function ProductionDashboard() {
  const { t, i18n } = useTranslation();
  const { data, error, isLoading, isFetching, refetch } = useTrustedSnapshot();
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const locale = i18n.resolvedLanguage === 'es' ? 'es-ES' : 'en-GB';

  let content;
  if (isLoading) {
    content = <LoadingState />;
  } else if (error || !data) {
    const isMissing = error?.status === 404;
    const isStoreUnavailable = error?.status === 503;
    const titleKey = isMissing
      ? 'production.status.firstSnapshot'
      : isStoreUnavailable
        ? 'production.status.storeUnavailable'
        : 'production.status.invalidContract';
    const messageKey = isMissing
      ? 'production.snapshot.emptyMessage'
      : isStoreUnavailable
        ? 'production.snapshot.storeMessage'
        : 'production.snapshot.contractMessage';

    content = (
      <main className="container mx-auto max-w-6xl px-4 py-12">
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6" role="status">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-slate-100">{t(titleKey)}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{t(messageKey)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:border-orange-400 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
            {t('production.actions.retry')}
          </button>
        </section>
      </main>
    );
  } else {
    const snapshot = data.data;
    const metrics = Object.values(snapshot.metrics);
    const visibleMetrics = showAllMetrics ? metrics : metrics.slice(0, 5);
    const coveragePercent = Math.round(snapshot.coverage_ratio * 100);

    content = (
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <section aria-labelledby="trusted-data-title">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
                {t('production.snapshot.eyebrow')}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h2 id="trusted-data-title" className="text-2xl font-semibold text-white">
                  {t('production.snapshot.title')}
                </h2>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${snapshotStatusStyles[snapshot.status]}`}>
                  {t(`production.status.${snapshot.status}`)}
                </span>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                {t('production.snapshot.description')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300 hover:border-orange-400 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
              {t('production.actions.revalidate')}
            </button>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                <Database className="h-4 w-4" aria-hidden="true" /> {t('production.snapshot.coverage')}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-slate-100">{coveragePercent}% <span className="text-sm font-normal text-slate-500">({snapshot.available_metrics}/{snapshot.total_metrics})</span></dd>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                <Clock3 className="h-4 w-4" aria-hidden="true" /> {t('production.snapshot.asOf')}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-slate-100">{formatDate(snapshot.as_of_date, locale)}</dd>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">{t('production.snapshot.methodology')}</dt>
              <dd className="mt-2 text-lg font-semibold text-slate-100">{snapshot.methodology_version}</dd>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {t('production.snapshot.generated')}
              </dt>
              <dd className="mt-2 text-sm font-semibold text-slate-100">{formatDate(snapshot.generated_at, locale, true)}</dd>
            </div>
          </dl>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {visibleMetrics.map((metric) => <MetricCard key={metric.code} metric={metric} locale={locale} />)}
          </div>

          {metrics.length > 5 ? (
            <button
              type="button"
              onClick={() => setShowAllMetrics((current) => !current)}
              aria-expanded={showAllMetrics}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 hover:border-orange-400"
            >
              {showAllMetrics
                ? t('production.actions.showLess')
                : t('production.actions.showAll', { count: metrics.length })}
              <ChevronDown className={`h-4 w-4 transition-transform ${showAllMetrics ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          ) : null}

          <div className="mt-6 flex flex-col gap-1 border-t border-slate-800 pt-4 font-mono text-[11px] text-slate-600 md:flex-row md:justify-between">
            <span>{t('production.snapshot.snapshotId')} {snapshot.snapshot_id}</span>
            <span>{t('production.snapshot.registry')} {snapshot.registry_hash.slice(0, 16)}… · {t('production.snapshot.inputs')} {snapshot.input_fingerprint.slice(0, 16)}…</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-orange-500/25 bg-slate-950/95 px-4 py-5 backdrop-blur">
        <div className="container mx-auto flex max-w-6xl items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">{t('production.brand.badge')}</p>
            <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">{t('production.brand.title')}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{t('production.brand.subtitle')}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {content}
      <MethodologySection />

      <footer className="border-t border-slate-800 bg-black/20 px-4 py-8">
        <div className="container mx-auto grid max-w-6xl gap-2 text-xs leading-5 text-slate-500 md:grid-cols-3">
          <p>{t('production.footer.scope')}</p>
          <p>{t('production.footer.privacy')}</p>
          <p>{t('production.footer.source')}</p>
        </div>
      </footer>
    </div>
  );
}
