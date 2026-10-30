import packageInfo from "../package.json";

// Product version: major / security-or-medium / small adjustment.
// Package metadata is the single source of the public product version.
export const APP_VERSION = packageInfo.version;
// Internal Sites checkpoint; retained as a number for existing automation.
export const SITE_RELEASE = 101;
export const ENGINE_VERSION = "abcm-sites-7-ten-signal";
export const CONTEXT_MODEL_VERSION = "abcm-six-force-2";
export const DATA_SCHEMA_VERSION = "1.5.0";

export const SOURCE_MIRROR = {
  repository: "https://github.com/JimBLogic/AustrianBusinessCycleMonitor",
  path: "sites-current",
  ref: "master",
} as const;
