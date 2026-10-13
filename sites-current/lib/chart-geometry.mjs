export function validChartPoints(points) {
  const byDate = new Map();
  for (const point of points ?? []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(point?.date) || !Number.isFinite(point.value)) continue;
    const date = new Date(`${point.date}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== point.date) continue;
    byDate.set(point.date, point);
  }
  return [...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

export function timePosition(date, first, last) {
  const timestamp = value => Date.parse(value.length === 7 ? `${value}-01T00:00:00Z` : `${value}T00:00:00Z`);
  const range = timestamp(last) - timestamp(first);
  return range > 0 ? 5 + 90 * (timestamp(date)-timestamp(first))/range : 50;
}

export function chartSegments(points, maximumGapDays) {
  const segments = [];
  for (const point of points) {
    const current = segments.at(-1);
    const previous = current?.at(-1);
    if (!previous || (Date.parse(point.date)-Date.parse(previous.date))/86400000 > maximumGapDays) segments.push([point]);
    else current.push(point);
  }
  return segments;
}
