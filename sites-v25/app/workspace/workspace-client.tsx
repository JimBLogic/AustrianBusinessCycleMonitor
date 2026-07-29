"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

type RecordRow = Record<string, string | number | null | undefined>;
type WorkspaceData = {
  tasks: RecordRow[];
  finances: RecordRow[];
  reviews: RecordRow[];
  snapshots: Array<RecordRow & { scores?: Record<string, number> }>;
};
type StoredFile = { id: string; filename: string; contentType: string; sizeBytes: number; createdAt: string };

const empty: WorkspaceData = { tasks: [], finances: [], reviews: [], snapshots: [] };

export default function WorkspaceClient({ user, signOutPath }: { user: { displayName: string; email: string }; signOutPath: string }) {
  const [data, setData] = useState<WorkspaceData>(empty);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [notice, setNotice] = useState("Sincronizando tu área privada…");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [workspaceResponse, filesResponse] = await Promise.all([
      fetch("/api/workspace", { cache: "no-store" }),
      fetch("/api/files", { cache: "no-store" }),
    ]);
    if (!workspaceResponse.ok || !filesResponse.ok) throw new Error("No se pudo leer el área privada");
    const workspace = await workspaceResponse.json() as WorkspaceData;
    const filePayload = await filesResponse.json() as { files: StoredFile[] };
    setData(workspace);
    setFiles(filePayload.files ?? []);
    setNotice("Datos persistentes sincronizados");
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load().catch((error: Error) => setNotice(error.message)), 0);
    return () => window.clearTimeout(initial);
  }, [load]);

  async function create(kind: string, fields: Record<string, unknown>) {
    setBusy(true);
    setNotice("Guardando en D1…");
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...fields }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "No se pudo guardar");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Error de persistencia");
    } finally {
      setBusy(false);
    }
  }

  async function update(kind: string, id: string, status: string) {
    setBusy(true);
    const response = await fetch("/api/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, status }),
    });
    if (response.ok) await load();
    else setNotice("No se pudo actualizar el registro");
    setBusy(false);
  }

  async function remove(kind: string, id: string) {
    if (!window.confirm("¿Eliminar este registro de forma permanente?")) return;
    setBusy(true);
    const response = await fetch(`/api/workspace?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) await load();
    else setNotice("No se pudo eliminar el registro");
    setBusy(false);
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setNotice("Cifrando transporte y guardando en R2…");
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/files", { method: "POST", body });
    if (response.ok) {
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } else {
      setNotice((await response.json()).error ?? "No se pudo subir el archivo");
    }
    setBusy(false);
  }

  return <main className="workspace-shell">
    <header className="workspace-top">
      <Link href="/" className="workspace-brand"><span>₿</span> ABCM</Link>
      <nav><Link href="/" target="_blank">Monitor ↗</Link><Link href="/learn?lang=es" target="_blank">Aprende ↗</Link><a href={signOutPath}>Cerrar sesión</a></nav>
    </header>
    <section className="workspace-hero">
      <div><span>ÁREA SOBERANA · CHATGPT IDENTITY</span><h1>Tu memoria de análisis,<br/><em>portable por diseño.</em></h1><p>Tareas, posiciones de estudio, tesis, archivos y snapshots macro persisten fuera del navegador y se pueden exportar cuando quieras.</p></div>
      <aside><small>IDENTIDAD VERIFICADA</small><strong>{user.displayName}</strong><span>{user.email}</span><i>● D1 + R2 conectados</i></aside>
    </section>
    <div className="workspace-status"><span>{notice}</span><b>{busy ? "PROCESANDO" : "LISTO"}</b></div>

    <section className="snapshot-strip">
      <div><span>SNAPSHOTS MACRO</span><strong>{data.snapshots.length}</strong><small>últimos registros visibles</small></div>
      {data.snapshots.slice(0, 4).map((snapshot) => <article key={String(snapshot.id)}>
        <span>{String(snapshot.requestedAt ?? "").slice(0, 16).replace("T", " ")}</span>
        <b>{String(snapshot.regime ?? "—").replaceAll("-", " ")}</b>
        <small>RISK {snapshot.scores?.composite ?? "—"}/100</small>
      </article>)}
    </section>

    <section className="workspace-grid">
      <article className="workspace-panel">
        <div className="workspace-panel-title"><span>01</span><div><small>OPERACIONES</small><h2>Tareas</h2></div></div>
        <form onSubmit={(event) => {
          event.preventDefault();
          const element = event.currentTarget;
          const form = new FormData(element);
          void create("task", { title: form.get("title"), dueDate: form.get("dueDate"), notes: form.get("notes") }).then(() => element.reset());
        }}>
          <input name="title" required maxLength={180} placeholder="Revisar divergencia M2 / oro" />
          <div className="form-row"><input name="dueDate" type="date" /><button disabled={busy}>Añadir</button></div>
          <textarea name="notes" maxLength={2000} placeholder="Condición de confirmación o refutación" />
        </form>
        <div className="private-list">
          {data.tasks.map((task) => <div key={String(task.id)} className={task.status === "done" ? "done" : ""}><button className="check" onClick={() => void update("task", String(task.id), task.status === "done" ? "open" : "done")}>{task.status === "done" ? "✓" : "○"}</button><span><b>{task.title}</b><small>{task.dueDate || "Sin fecha"}</small></span><button className="remove" onClick={() => void remove("task", String(task.id))}>×</button></div>)}
          {!data.tasks.length && <p>Aún no hay tareas.</p>}
        </div>
      </article>

      <article className="workspace-panel">
        <div className="workspace-panel-title"><span>02</span><div><small>FINANZAS</small><h2>Cartera de estudio</h2></div></div>
        <form onSubmit={(event) => {
          event.preventDefault();
          const element = event.currentTarget;
          const form = new FormData(element);
          void create("finance", { symbol: form.get("symbol"), label: form.get("label"), category: form.get("category"), units: form.get("units"), costBasis: form.get("costBasis"), currency: "USD" }).then(() => element.reset());
        }}>
          <div className="form-row"><input name="symbol" required maxLength={20} placeholder="BTC" /><input name="label" required maxLength={120} placeholder="Bitcoin autocustodia" /></div>
          <div className="form-row"><select name="category"><option value="hard-money">Dinero duro</option><option value="equity">Renta variable</option><option value="cash">Liquidez</option><option value="debt">Deuda</option></select><input name="units" type="number" step="any" placeholder="Unidades" /><input name="costBasis" type="number" step="any" placeholder="Coste" /></div>
          <button disabled={busy}>Guardar posición</button>
        </form>
        <div className="private-list finance-list">
          {data.finances.map((item) => <div key={String(item.id)}><span className="symbol">{item.symbol}</span><span><b>{item.label}</b><small>{item.units ?? "—"} uds · {item.costBasis ?? "—"} {item.currency}</small></span><button className="remove" onClick={() => void remove("finance", String(item.id))}>×</button></div>)}
          {!data.finances.length && <p>Aún no hay posiciones.</p>}
        </div>
      </article>

      <article className="workspace-panel review-panel">
        <div className="workspace-panel-title"><span>03</span><div><small>JOURNAL</small><h2>Revisiones de tesis</h2></div></div>
        <form onSubmit={(event) => {
          event.preventDefault();
          const element = event.currentTarget;
          const form = new FormData(element);
          void create("review", { title: form.get("title"), thesis: form.get("thesis"), counterThesis: form.get("counterThesis") }).then(() => element.reset());
        }}>
          <input name="title" required maxLength={180} placeholder="Liquidez vuelve, pero el crédito no confirma" />
          <textarea name="thesis" required maxLength={6000} placeholder="Tesis y datapoints que la sostienen" />
          <textarea name="counterThesis" maxLength={6000} placeholder="Qué la invalidaría" />
          <button disabled={busy}>Guardar revisión</button>
        </form>
        <div className="review-list">
          {data.reviews.map((review) => <div key={String(review.id)}><span>{review.status}</span><h3>{review.title}</h3><p>{review.thesis}</p><small>REFUTACIÓN · {review.counterThesis || "Pendiente"}</small><div><button onClick={() => void update("review", String(review.id), review.status === "reviewed" ? "draft" : "reviewed")}>{review.status === "reviewed" ? "Reabrir" : "Marcar revisada"}</button><button onClick={() => void remove("review", String(review.id))}>Eliminar</button></div></div>)}
          {!data.reviews.length && <p>Aún no hay revisiones.</p>}
        </div>
      </article>

      <article className="workspace-panel files-panel">
        <div className="workspace-panel-title"><span>04</span><div><small>R2 VAULT</small><h2>Archivos y backups</h2></div></div>
        <form onSubmit={upload} className="upload-form"><input ref={fileRef} name="file" type="file" required accept=".json,.csv,.txt,.pdf,.png,.jpg,.jpeg,.webp" /><button disabled={busy}>Subir hasta 5 MB</button></form>
        <div className="export-actions"><a href="/api/export?format=json">Exportar todo · JSON</a><a href="/api/export?format=csv">Exportar todo · CSV</a></div>
        <div className="private-list">
          {files.map((file) => <div key={file.id}><span className="file-icon">↧</span><span><a href={`/api/files/${file.id}`}>{file.filename}</a><small>{Math.ceil(file.sizeBytes / 1024)} KB · {file.contentType}</small></span></div>)}
          {!files.length && <p>Aún no hay archivos.</p>}
        </div>
        <div className="portability-note"><b>PORTABILIDAD</b><p>El JSON conserva el esquema completo. El CSV normaliza tareas, finanzas, revisiones, archivos y snapshots para importación a otra plataforma.</p></div>
      </article>
    </section>
  </main>;
}
