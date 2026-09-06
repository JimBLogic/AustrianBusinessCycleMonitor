export const LANGUAGE_STORAGE_KEY = "abcm:language";
export const WATCHLIST_STORAGE_KEY = "abcm:watchlist";
export const EDUCATIONAL_NOTICE_STORAGE_KEY = "abcm:educational-notice:v1";
export const MANUAL_REFRESH_STORAGE_KEY = "abcm:manual-refresh-state:v1";

const LEGACY_STORAGE_KEYS = [
  "abcm:last-valid-snapshot",
  "abcm:visit-baseline",
] as const;

export type LanguagePreference = "en" | "es";
export const WATCH_KEYS = [
  "m2",
  "creditSpread",
  "cpi",
  "unemployment",
  "federalDebt",
  "bitcoin",
] as const;
export type WatchPreference = (typeof WATCH_KEYS)[number];

export type VisitBaselinePreference = {
  capturedAt: string;
  requestedAt: string;
  regime: string;
  composite: number;
  modelReady: boolean;
  bitcoinPrice: number | null;
  latestDates: Record<string, string | null>;
};

type ManualRefreshPreference = {
  previousSnapshot: VisitBaselinePreference;
  nextAllowedAt: number;
};

function localStorageOrNull() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function validTimestamp(value: unknown) {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getUTCFullYear() >= 2000;
}

function parseVisitBaseline(value: unknown): VisitBaselinePreference | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const parsed = value as Partial<VisitBaselinePreference>;
  if (!validTimestamp(parsed.capturedAt) || typeof parsed.requestedAt !== "string" || typeof parsed.regime !== "string") return null;
  if (!Number.isFinite(parsed.composite) || typeof parsed.modelReady !== "boolean") return null;
  if (parsed.bitcoinPrice != null && !Number.isFinite(parsed.bitcoinPrice)) return null;
  if (!parsed.latestDates || typeof parsed.latestDates !== "object" || Array.isArray(parsed.latestDates)) return null;
  const latestDates = Object.fromEntries(
    Object.entries(parsed.latestDates).filter(([, date]) => date == null || typeof date === "string"),
  );
  return { ...parsed, latestDates } as VisitBaselinePreference;
}

export function readLanguagePreference(): LanguagePreference | null {
  try {
    const value = localStorageOrNull()?.getItem(LANGUAGE_STORAGE_KEY);
    return value === "en" || value === "es" ? value : null;
  } catch {
    return null;
  }
}

export function saveLanguagePreference(language: LanguagePreference) {
  try {
    localStorageOrNull()?.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // The interface remains usable when browser storage is unavailable.
  }
}

export function readWatchlistPreference(): WatchPreference[] {
  try {
    const value = localStorageOrNull()?.getItem(WATCHLIST_STORAGE_KEY);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter(
      (key): key is WatchPreference => typeof key === "string" && WATCH_KEYS.includes(key as WatchPreference),
    ))].slice(0, 4);
  } catch {
    return [];
  }
}

export function saveWatchlistPreference(keys: Iterable<WatchPreference>) {
  const safeKeys = [...new Set(keys)]
    .filter((key) => WATCH_KEYS.includes(key))
    .slice(0, 4);
  try {
    localStorageOrNull()?.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(safeKeys));
  } catch {
    // The in-memory watchlist still works.
  }
}

export function hasAcceptedEducationalNotice() {
  try {
    return localStorageOrNull()?.getItem(EDUCATIONAL_NOTICE_STORAGE_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function saveEducationalNoticeAcceptance() {
  try {
    localStorageOrNull()?.setItem(EDUCATIONAL_NOTICE_STORAGE_KEY, "accepted");
  } catch {
    // The notice closes for this page view even if persistence is unavailable.
  }
}

export function readManualRefreshPreference(): ManualRefreshPreference | null {
  try {
    const value = localStorageOrNull()?.getItem(MANUAL_REFRESH_STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<ManualRefreshPreference>;
    const previousSnapshot = parseVisitBaseline(parsed.previousSnapshot);
    if (!previousSnapshot || !Number.isFinite(parsed.nextAllowedAt)) return null;
    return { previousSnapshot, nextAllowedAt: Number(parsed.nextAllowedAt) };
  } catch {
    return null;
  }
}

export function saveManualRefreshPreference(
  previousSnapshot: VisitBaselinePreference,
  nextAllowedAt: number,
) {
  if (!Number.isFinite(nextAllowedAt) || !parseVisitBaseline(previousSnapshot)) return;
  try {
    localStorageOrNull()?.setItem(
      MANUAL_REFRESH_STORAGE_KEY,
      JSON.stringify({ previousSnapshot, nextAllowedAt }),
    );
  } catch {
    // Manual refresh and comparison still work for the current page view.
  }
}

export function clearLocalPreferences() {
  try {
    const storage = localStorageOrNull();
    if (!storage) return false;
    for (const key of [
      LANGUAGE_STORAGE_KEY,
      WATCHLIST_STORAGE_KEY,
      EDUCATIONAL_NOTICE_STORAGE_KEY,
      MANUAL_REFRESH_STORAGE_KEY,
      ...LEGACY_STORAGE_KEYS,
    ]) {
      storage.removeItem(key);
    }
    window.dispatchEvent(new Event("abcm:preferences-cleared"));
    return true;
  } catch {
    // Nothing is sent to a server if local deletion is unavailable.
    return false;
  }
}
