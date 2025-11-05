// src/frontend/src/pages/AdminInmatesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminListInmates, type Inmate } from "../api/inmates";

export default function AdminInmatesPage() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | "ENABLED" | "BLOCKED">("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [rows, setRows] = useState<Inmate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load(p = page) {
    setLoading(true);
    setErr(null);
    try {
      const r = await adminListInmates({
        q: q.trim() || undefined,
        status: status || undefined,
        page: p,
        limit,
      });
      setRows(r.items || []);
      setTotal(r.pagination.total || 0);
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo cargar la lista");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setPage(1); load(1); }, [q, status]);
  useEffect(() => { load(page); }, [page]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  return (
    <div className="app-light">
      <div className="container">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", margin:"14px 0" }}>
          <h1 className="h1">Administración · Internos</h1>
          <button className="btn-outline" onClick={() => nav("/dashboard")}>Volver</button>
        </div>

        <div className="card-light" style={{ padding: 12, marginBottom: 12 }}>
          <div className="row">
            <label>
              Buscar
              <input
                className="input-light"
                placeholder="Nombre o cédula"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <label>
              Estado
              <select
                className="input-light"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="">Todos</option>
                <option value="ENABLED">ENABLED</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </label>
            <div style={{ display:"flex", alignItems:"flex-end" }}>
              <button className="btn" onClick={() => load(1)}>Aplicar</button>
            </div>
          </div>
        </div>

        {loading && <p>Cargando…</p>}
        {err && <p style={{ color:"#b91c1c" }}>{err}</p>}
        {!loading && !rows.length && <div className="card-light" style={{ padding: 16 }}>Sin resultados</div>}

        {rows.map(i => (
          <article key={i.id} className="notif-card" style={{
            background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, padding:14, marginBottom:12,
            boxShadow:"0 10px 30px rgba(0,0,0,.06)"
          }}>
            <h3 style={{ margin:"0 0 6px" }}>{i.first_name} {i.last_name}</h3>
            <div style={{ color:"#64748b", fontSize:14 }}>
              {i.national_id ? <>Cédula: {i.national_id} · </> : null}
              Estado: {i.status}
              {i.pavilion ? <> · Pab: {i.pavilion}</> : null}
              {i.cell ? <> · Celda: {i.cell}</> : null}
            </div>
          </article>
        ))}

        {pages > 1 && (
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <button className="btn-outline" disabled={page<=1} onClick={() => setPage(p => p-1)}>Anterior</button>
            <div style={{ padding:"6px 10px" }}>Página {page} / {pages}</div>
            <button className="btn-outline" disabled={page>=pages} onClick={() => setPage(p => p+1)}>Siguiente</button>
          </div>
        )}
      </div>
    </div>
  );
}
