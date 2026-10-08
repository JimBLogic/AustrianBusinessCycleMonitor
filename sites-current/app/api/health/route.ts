import { snapshotHealth } from "../../data/snapshot-health";
import { ensureDatabase, getBindings, getRuntimeBindings, readLatestMacroSnapshot } from "../../../db/runtime";
import { CONTEXT_MODEL_VERSION, DATA_SCHEMA_VERSION, ENGINE_VERSION, SITE_RELEASE, SOURCE_MIRROR } from "../../version";
import { getUpstreamHealth } from "../../data/upstream";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  let database = "unavailable";
  try {
    await ensureDatabase();
    const { db } = getBindings();
    await db.prepare("SELECT 1 AS ok").first();
    database = "ready";
  } catch {
    database = "unavailable";
  }
  const snapshot = await readLatestMacroSnapshot().catch(() => null);
  const data = snapshotHealth(snapshot);
  const status = database === "ready" ? data.status : "UNAVAILABLE";
  return Response.json({
    status,
    data,
    persistence: {binding:"DB", status:database, snapshotReadable:Boolean(snapshot)},
    service: "austrian-business-cycle-monitor",
    siteRelease: SITE_RELEASE,
    engine: ENGINE_VERSION,
    contextModel: CONTEXT_MODEL_VERSION,
    dataSchema: DATA_SCHEMA_VERSION,
    sourceMirror: SOURCE_MIRROR,
    runtime: "gpt-sites-temporary-backend",
    checkedAt,
    components: {
      database,
      fredRest: getRuntimeBindings()?.FRED_API_KEY ? "configured" : "awaiting-private-key",
      macroFallback: "official-source-mesh",
      upstreamCircuits: getUpstreamHealth(),
    },
    endpoints: ["/api/data", "/api/bitcoin", "/api/data-manifest", "/api/health", "/api/source-health"],
  }, {
    status: status === "UNAVAILABLE" ? 503 : 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
