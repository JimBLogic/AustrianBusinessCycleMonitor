import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names while resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Format a numeric market value as USD without throwing on invalid input. */
export function formatCurrency(value: number | null | undefined): string {
  return usdFormatter.format(Number.isFinite(value) ? (value as number) : 0);
}

/** Format a percentage-point value, such as 3.2 meaning 3.2%. */
export function formatPercent(
  value: number | null | undefined,
  fractionDigits = 1
): string {
  const safeValue = Number.isFinite(value) ? (value as number) : 0;
  return `${safeValue.toFixed(fractionDigits)}%`;
}

/** Return an accessible text colour class for the dashboard's 0–10 risk scale. */
export function getRiskColor(risk: number | null | undefined): string {
  const safeRisk = Number.isFinite(risk) ? (risk as number) : 0;

  if (safeRisk >= 7) return 'text-red-500 dark:text-red-400';
  if (safeRisk >= 5) return 'text-amber-500 dark:text-amber-400';
  return 'text-emerald-500 dark:text-emerald-400';
}
