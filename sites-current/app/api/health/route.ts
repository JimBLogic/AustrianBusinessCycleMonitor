import { ensureDatabase, getBindings, getRuntimeBindings } from "../../../db/runtime";
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
  const status = database === "ready" ? "ok" : "degraded";
  return Response.json({
    status,
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
    endpoints: ["/api/data", "/api/bitcoin", "/api/data-manifest", "/api/health"],
  }, {
    status: status === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
