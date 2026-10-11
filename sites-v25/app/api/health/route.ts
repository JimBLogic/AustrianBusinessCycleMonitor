import { ensureDatabase, getBindings, getRuntimeBindings } from "../../../db/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  let database = "unavailable";
  let storage = "unavailable";
  try {
    await ensureDatabase();
    const { db, bucket } = getBindings();
    await db.prepare("SELECT 1 AS ok").first();
    database = "ready";
    storage = bucket ? "ready" : "unavailable";
  } catch {
    database = "unavailable";
  }
  const status = database === "ready" && storage === "ready" ? "ok" : "degraded";
  return Response.json({
    status,
    service: "austrian-business-cycle-monitor",
    engine: "abcm-sites-3",
    runtime: "gpt-sites-temporary-backend",
    checkedAt,
    components: {
      database,
      storage,
      fredRest: getRuntimeBindings()?.FRED_API_KEY ? "configured" : "awaiting-private-key",
      macroFallback: "official-source-mesh",
    },
    endpoints: ["/api/data", "/api/data-manifest", "/api/health"],
  }, {
    status: status === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
