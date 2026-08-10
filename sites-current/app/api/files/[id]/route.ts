import { getChatGPTUser, isTrustedMutation } from "../../../chatgpt-auth";
import { getBindings, upsertUser } from "../../../../db/runtime";

export const dynamic = "force-dynamic";

async function ownedFile(id: string) {
  const user = await getChatGPTUser();
  if (!user) return { error: Response.json({ error: "ChatGPT sign-in required" }, { status: 401 }) };
  await upsertUser(user.email, user.displayName);
  const { db, bucket } = getBindings();
  if (!bucket) return { error: Response.json({ error: "File storage unavailable" }, { status: 503 }) };
  const file = await db.prepare(
    "SELECT id, object_key AS objectKey, filename, content_type AS contentType, size_bytes AS sizeBytes FROM files WHERE id = ? AND owner_email = ?",
  ).bind(id, user.email).first<Record<string, string | number>>();
  if (!file) return { error: Response.json({ error: "File not found" }, { status: 404 }) };
  return { db, bucket, file, user };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await ownedFile(id);
  if ("error" in ctx) return ctx.error;
  const object = await ctx.bucket.get(String(ctx.file.objectKey));
  if (!object) return Response.json({ error: "Object not found" }, { status: 404 });
  return new Response(object.body, {
    headers: {
      "Content-Type": String(ctx.file.contentType),
      "Content-Disposition": `attachment; filename="${String(ctx.file.filename).replaceAll('"', "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutation(request)) return Response.json({ error: "Cross-site request rejected" }, { status: 403 });
  const { id } = await params;
  const ctx = await ownedFile(id);
  if ("error" in ctx) return ctx.error;
  await ctx.bucket.delete(String(ctx.file.objectKey));
  await ctx.db.prepare("DELETE FROM files WHERE id = ? AND owner_email = ?").bind(id, ctx.user.email).run();
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
