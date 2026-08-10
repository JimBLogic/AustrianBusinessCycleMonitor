import { getChatGPTUser, isTrustedMutation } from "../../chatgpt-auth";
import { getBindings, upsertUser } from "../../../db/runtime";

export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/json", "text/csv", "text/plain", "application/pdf",
  "image/jpeg", "image/png", "image/webp",
]);

function safeFilename(value: string) {
  return value.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "file";
}

async function context() {
  const user = await getChatGPTUser();
  if (!user) return null;
  await upsertUser(user.email, user.displayName);
  const bindings = getBindings();
  if (!bindings.bucket) throw new Error("R2 binding BUCKET is unavailable");
  return { user, ...bindings, bucket: bindings.bucket };
}

export async function GET() {
  const ctx = await context();
  if (!ctx) return Response.json({ error: "ChatGPT sign-in required" }, { status: 401 });
  const result = await ctx.db.prepare(
    "SELECT id, filename, content_type AS contentType, size_bytes AS sizeBytes, created_at AS createdAt FROM files WHERE owner_email = ? ORDER BY created_at DESC",
  ).bind(ctx.user.email).all();
  return Response.json({ files: result.results }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isTrustedMutation(request)) return Response.json({ error: "Cross-site request rejected" }, { status: 403 });
  const ctx = await context();
  if (!ctx) return Response.json({ error: "ChatGPT sign-in required" }, { status: 401 });
  const form = await request.formData();
  const candidate = form.get("file");
  if (!(candidate instanceof File)) return Response.json({ error: "File is required" }, { status: 400 });
  if (candidate.size <= 0 || candidate.size > MAX_FILE_BYTES) return Response.json({ error: "File must be between 1 byte and 5 MB" }, { status: 413 });
  if (!ALLOWED_TYPES.has(candidate.type)) return Response.json({ error: "Unsupported file type" }, { status: 415 });

  const id = crypto.randomUUID();
  const filename = safeFilename(candidate.name);
  const objectKey = `users/${encodeURIComponent(ctx.user.email)}/${id}-${filename}`;
  await ctx.bucket.put(objectKey, await candidate.arrayBuffer(), {
    httpMetadata: { contentType: candidate.type },
    customMetadata: { owner: ctx.user.email },
  });
  const now = new Date().toISOString();
  try {
    await ctx.db.prepare(
      "INSERT INTO files (id, owner_email, object_key, filename, content_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).bind(id, ctx.user.email, objectKey, filename, candidate.type, candidate.size, now).run();
  } catch (error) {
    await ctx.bucket.delete(objectKey);
    throw error;
  }
  return Response.json({ ok: true, id, filename }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
