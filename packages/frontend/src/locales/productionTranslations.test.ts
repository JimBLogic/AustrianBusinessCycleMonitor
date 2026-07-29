import { describe, expect, it } from 'vitest';

import en from './production.en.json';
import es from './production.es.json';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return flattenKeys(child, path);
  });
}

describe('production translations', () => {
  it('keeps English and Spanish key sets identical', () => {
    expect(flattenKeys(es).sort()).toEqual(flattenKeys(en).sort());
  });

  it('provides contextual labels for every trusted metric', () => {
    const expectedMetricCodes = [
      'fed_funds_effective_pct',
      'treasury_10y_pct',
      'treasury_2y_pct',
      'capacity_utilization_pct',
      'm2_yoy_pct',
      'cpi_yoy_pct',
      'industrial_production_yoy_pct',
      'total_debt_yoy_pct',
      'yield_curve_10y_2y_spread_pp',
      'real_fed_funds_proxy_pp',
    ].sort();

    expect(Object.keys(en.production.metrics).sort()).toEqual(expectedMetricCodes);
    expect(Object.keys(es.production.metrics).sort()).toEqual(expectedMetricCodes);

    for (const code of expectedMetricCodes) {
      expect(en.production.metrics[code as keyof typeof en.production.metrics].context.length).toBeGreaterThan(20);
      expect(es.production.metrics[code as keyof typeof es.production.metrics].context.length).toBeGreaterThan(20);
    }
  });
});
