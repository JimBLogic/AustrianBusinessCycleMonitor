// One contract shared by snapshot writers and readers. Compatible historical
// editions remain eligible as recovery data; freshness is checked separately.
export const SOURCE_POLICY_VERSION = '2026-10-02-retain-history-v2';
export function supportedSnapshot(provenance) {
  return provenance?.dataRightsPolicy !== '2026-09-28-v1' &&
    ['2026-09-28-quality-v1', SOURCE_POLICY_VERSION].includes(provenance?.sourcePolicyVersion);
}
