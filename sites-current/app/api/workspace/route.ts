import { getChatGPTUser, isTrustedMutation } from "../../chatgpt-auth";
import { ensureDatabase, getBindings, upsertUser } from "../../../db/runtime";

export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json({ error: "ChatGPT sign-in required" }, { status: 401 });
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalNumber(value: unknown) {
  if (value === "" || value == null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function context() {
  const user = await getChatGPTUser();
  if (!user) return null;
  await upsertUser(user.email, user.displayName);
  return { user, ...getBindings() };
}

export async function GET() {
  const ctx = await context();
  if (!ctx) return unauthorized();
  const [tasks, finances, reviews, snapshots] = await Promise.all([
    ctx.db.prepare("SELECT id, title, status, due_date AS dueDate, notes, created_at AS createdAt, updated_at AS updatedAt FROM tasks WHERE owner_email = ? ORDER BY created_at DESC").bind(ctx.user.email).all(),
    ctx.db.prepare("SELECT id, symbol, label, category, units, cost_basis AS costBasis, currency, notes, created_at AS createdAt FROM finance_items WHERE owner_email = ? ORDER BY created_at DESC").bind(ctx.user.email).all(),
    ctx.db.prepare("SELECT id, title, thesis, counter_thesis AS counterThesis, status, created_at AS createdAt FROM reviews WHERE owner_email = ? ORDER BY created_at DESC").bind(ctx.user.email).all(),
    ctx.db.prepare("SELECT id, requested_at AS requestedAt, refresh_mode AS refreshMode, regime, scores_json AS scoresJson FROM macro_snapshots ORDER BY requested_at DESC LIMIT 12").all(),
  ]);
  return Response.json({
    user: { displayName: ctx.user.displayName, email: ctx.user.email },
    tasks: tasks.results,
    finances: finances.results,
    reviews: reviews.results,
    snapshots: snapshots.results.map((item: unknown) => {
      const row = item as Record<string, unknown>;
      return { ...row, scores: JSON.parse(String(row.scoresJson ?? "{}")), scoresJson: undefined };
    }),
  }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

export async function POST(request: Request) {
  if (!isTrustedMutation(request)) return Response.json({ error: "Cross-site request rejected" }, { status: 403 });
  const ctx = await context();
  if (!ctx) return unauthorized();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });
  const kind = clean(body.kind, 20);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  if (kind === "task") {
    const title = clean(body.title, 180);
    if (!title) return Response.json({ error: "Title is required" }, { status: 400 });
    await ctx.db.prepare(
      "INSERT INTO tasks (id, owner_email, title, status, due_date, notes, created_at, updated_at) VALUES (?, ?, ?, 'open', ?, ?, ?, ?)",
    ).bind(id, ctx.user.email, title, clean(body.dueDate, 32) || null, clean(body.notes, 2000) || null, now, now).run();
  } else if (kind === "finance") {
    const symbol = clean(body.symbol, 20).toUpperCase();
    const label = clean(body.label, 120);
    if (!symbol || !label) return Response.json({ error: "Symbol and label are required" }, { status: 400 });
    await ctx.db.prepare(
      "INSERT INTO finance_items (id, owner_email, symbol, label, category, units, cost_basis, currency, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(id, ctx.user.email, symbol, label, clean(body.category, 40) || "asset", optionalNumber(body.units), optionalNumber(body.costBasis), clean(body.currency, 8).toUpperCase() || "USD", clean(body.notes, 2000) || null, now, now).run();
  } else if (kind === "review") {
    const title = clean(body.title, 180);
    const thesis = clean(body.thesis, 6000);
    if (!title || !thesis) return Response.json({ error: "Title and thesis are required" }, { status: 400 });
    await ctx.db.prepare(
      "INSERT INTO reviews (id, owner_email, title, thesis, counter_thesis, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)",
    ).bind(id, ctx.user.email, title, thesis, clean(body.counterThesis, 6000) || null, now, now).run();
  } else {
    return Response.json({ error: "Unsupported record kind" }, { status: 400 });
  }
  return Response.json({ ok: true, id }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  if (!isTrustedMutation(request)) return Response.json({ error: "Cross-site request rejected" }, { status: 403 });
  const ctx = await context();
  if (!ctx) return unauthorized();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const id = clean(body?.id, 80);
  const kind = clean(body?.kind, 20);
  if (!id) return Response.json({ error: "ID is required" }, { status: 400 });
  const now = new Date().toISOString();
  if (kind === "task") {
    const status = clean(body?.status, 20);
    if (!["open", "done"].includes(status)) return Response.json({ error: "Invalid status" }, { status: 400 });
    await ctx.db.prepare("UPDATE tasks SET status = ?, updated_at = ? WHERE id = ? AND owner_email = ?").bind(status, now, id, ctx.user.email).run();
  } else if (kind === "review") {
    const status = clean(body?.status, 20);
    if (!["draft", "reviewed", "archived"].includes(status)) return Response.json({ error: "Invalid status" }, { status: 400 });
    await ctx.db.prepare("UPDATE reviews SET status = ?, updated_at = ? WHERE id = ? AND owner_email = ?").bind(status, now, id, ctx.user.email).run();
  } else {
    return Response.json({ error: "Unsupported record kind" }, { status: 400 });
  }
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  if (!isTrustedMutation(request)) return Response.json({ error: "Cross-site request rejected" }, { status: 403 });
  const ctx = await context();
  if (!ctx) return unauthorized();
  const url = new URL(request.url);
  const kind = clean(url.searchParams.get("kind"), 20);
  const id = clean(url.searchParams.get("id"), 80);
  const tables: Record<string, string> = { task: "tasks", finance: "finance_items", review: "reviews" };
  const table = tables[kind];
  if (!table || !id) return Response.json({ error: "Invalid delete target" }, { status: 400 });
  await ensureDatabase();
  await ctx.db.prepare(`DELETE FROM ${table} WHERE id = ? AND owner_email = ?`).bind(id, ctx.user.email).run();
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
