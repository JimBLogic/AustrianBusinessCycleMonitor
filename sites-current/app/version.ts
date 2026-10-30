// Public release identity shared by the UI, health, data and manifest endpoints.
export const SITE_RELEASE = 99;
export const ENGINE_VERSION = "abcm-sites-7-ten-signal";
export const CONTEXT_MODEL_VERSION = "abcm-six-force-2";
export const DATA_SCHEMA_VERSION = "1.5.0";

export const SOURCE_MIRROR = {
  repository: "https://github.com/JimBLogic/AustrianBusinessCycleMonitor",
  path: "sites-current",
  ref: "master",
} as const;
