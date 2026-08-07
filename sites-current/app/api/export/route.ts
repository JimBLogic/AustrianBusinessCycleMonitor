import { getChatGPTUser } from "../../chatgpt-auth";
import { getBindings, upsertUser } from "../../../db/runtime";

export const dynamic = "force-dynamic";

function csv(value: unknown) {
  const text = value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "ChatGPT sign-in required" }, { status: 401 });
  await upsertUser(user.email, user.displayName);
  const { db } = getBindings();
  const [tasks, finances, reviews, files, snapshots] = await Promise.all([
    db.prepare("SELECT * FROM tasks WHERE owner_email = ? ORDER BY created_at DESC").bind(user.email).all(),
    db.prepare("SELECT * FROM finance_items WHERE owner_email = ? ORDER BY created_at DESC").bind(user.email).all(),
    db.prepare("SELECT * FROM reviews WHERE owner_email = ? ORDER BY created_at DESC").bind(user.email).all(),
    db.prepare("SELECT id, filename, content_type, size_bytes, created_at FROM files WHERE owner_email = ? ORDER BY created_at DESC").bind(user.email).all(),
    db.prepare("SELECT id, requested_at, refresh_mode, regime, scores_json, metrics_json, provenance_json FROM macro_snapshots ORDER BY requested_at DESC LIMIT 500").all(),
  ]);
  const exportedAt = new Date().toISOString();
  const payload = {
    schemaVersion: "1.0.0",
    exportedAt,
    owner: { email: user.email, displayName: user.displayName },
    data: { tasks: tasks.results, finances: finances.results, reviews: reviews.results, files: files.results, macroSnapshots: snapshots.results },
  };
  const format = new URL(request.url).searchParams.get("format") === "csv" ? "csv" : "json";
  if (format === "json") {
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="abcm-backup-${exportedAt.slice(0, 10)}.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  }
  const rows: unknown[][] = [["type", "id", "title_or_symbol", "status_or_category", "content_or_amount", "created_at"]];
  for (const item of tasks.results as Record<string, unknown>[]) rows.push(["task", item.id, item.title, item.status, item.notes, item.created_at]);
  for (const item of finances.results as Record<string, unknown>[]) rows.push(["finance", item.id, item.symbol, item.category, { units: item.units, costBasis: item.cost_basis, currency: item.currency }, item.created_at]);
  for (const item of reviews.results as Record<string, unknown>[]) rows.push(["review", item.id, item.title, item.status, { thesis: item.thesis, counterThesis: item.counter_thesis }, item.created_at]);
  for (const item of files.results as Record<string, unknown>[]) rows.push(["file", item.id, item.filename, item.content_type, item.size_bytes, item.created_at]);
  for (const item of snapshots.results as Record<string, unknown>[]) rows.push(["macro_snapshot", item.id, item.regime, item.refresh_mode, item.scores_json, item.requested_at]);
  return new Response(rows.map((row) => row.map(csv).join(",")).join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="abcm-backup-${exportedAt.slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
