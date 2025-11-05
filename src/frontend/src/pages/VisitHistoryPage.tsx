import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

type Visit = {
  id: string;
  visitor_name: string;
  inmate_name: string;
  visit_date: string; // YYYY-MM-DD o ISO
  visit_hour: string; // HH:mm:ss
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  notes?: string;
  created_at?: string;
};

type VisitForm = {
  visitor_name: string;
  inmate_name: string;
  visit_date: string; // YYYY-MM-DD
  visit_hour: string; // HH:mm
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string;
};

const formSchema = z.object({
  visitor_name: z.string().min(2, "El nombre del visitante es requerido"),
  inmate_name: z.string().min(2, "El nombre del interno es requerido"),
  visit_date: z.string().min(10, "Fecha inválida"),
  visit_hour: z.string().min(4, "Hora inválida"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  notes: z.string().optional().default(""),
});

export default function VisitHistoryPage() {
  const nav = useNavigate();

  // datos
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // filtros
  const [qVisitor, setQVisitor] = useState("");
  const [qInmate, setQInmate] = useState("");
  const [qStatus, setQStatus] = useState<"" | "PENDING" | "APPROVED" | "REJECTED">("");
  const [qDate, setQDate] = useState("");

  // edición
  const [editing, setEditing] = useState<Visit | null>(null);
  const [editForm, setEditForm] = useState<VisitForm | null>(null);
  const [editErr, setEditErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setApiError(null);
      try {
        const res = await api.get<{ ok: boolean; visits?: Visit[] }>("/visits");
        if (!cancel) setVisits(res.visits ?? []);
      } catch (err: any) {
        if (!cancel) setApiError(err?.message ?? "Error cargando visitas");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const filtered = useMemo(() => {
    return (visits ?? []).filter(v => {
      const byVisitor = qVisitor ? v.visitor_name.toLowerCase().includes(qVisitor.toLowerCase()) : true;
      const byInmate = qInmate ? v.inmate_name.toLowerCase().includes(qInmate.toLowerCase()) : true;
      const byStatus = qStatus ? v.status === qStatus : true;
      const byDate = qDate ? (v.visit_date.includes("T") ? v.visit_date.slice(0, 10) : v.visit_date) === qDate : true;
      return byVisitor && byInmate && byStatus && byDate;
    });
  }, [visits, qVisitor, qInmate, qStatus, qDate]);

  function openEdit(v: Visit) {
    setEditing(v);
    setEditForm({
      visitor_name: v.visitor_name,
      inmate_name: v.inmate_name,
      visit_date: v.visit_date.includes("T") ? v.visit_date.slice(0, 10) : v.visit_date,
      visit_hour: v.visit_hour?.slice(0, 5) ?? "",
      status: (v.status as any) ?? "PENDING",
      notes: v.notes ?? "",
    });
    setEditErr(null);
  }

  function onChangeEdit<K extends keyof VisitForm>(key: K, value: VisitForm[K]) {
    if (!editForm) return;
    setEditForm({ ...editForm, [key]: value });
    setEditErr(null);
  }

  async function saveEdit() {
    if (!editing || !editForm) return;
    const parsed = formSchema.safeParse(editForm);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setEditErr(first?.message ?? "Datos inválidos");
      return;
    }
    try {
      const payload = {
        ...parsed.data,
        visit_hour:
          parsed.data.visit_hour.length === 5
            ? `${parsed.data.visit_hour}:00`
            : parsed.data.visit_hour,
      };
      const res = await api.put<{ ok: boolean; visit: Visit }>(
        `/visits/${editing.id}`, payload
      );
      setVisits((list) => list.map(v => v.id === editing.id ? res.visit : v));
      setEditing(null); setEditForm(null);
    } catch (err: any) {
      setEditErr(err?.message ?? "Error guardando");
    }
  }

  async function removeVisit(id: string) {
    if (!confirm("¿Eliminar esta visita?")) return;
    try {
      await api.del<{ ok: boolean }>(`/visits/${id}`);
      setVisits((list) => list.filter(v => v.id !== id));
    } catch (err: any) {
      alert(err?.message ?? "Error eliminando");
    }
  }

  return (
    <div className="app-light">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0 6px 0" }}>
          <h1 className="h1">Historial de visitas</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-outline" onClick={() => nav("/dashboard")}>Volver</button>
          </div>
        </div>

        {/* Filtros */}
        <div className="card-light" style={{ marginBottom: 12 }}>
          <div className="filters" style={{ gridTemplateColumns: "1.2fr 1.2fr 1fr 1fr auto" }}>
            <input className="input-light" placeholder="Filtrar por visitante"
              value={qVisitor} onChange={(e) => setQVisitor(e.target.value)} />
            <input className="input-light" placeholder="Filtrar por interno"
              value={qInmate} onChange={(e) => setQInmate(e.target.value)} />
            <select className="input-light" value={qStatus} onChange={(e) => setQStatus(e.target.value as any)}>
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="REJECTED">Rechazadas</option>
            </select>
            <input className="input-light" type="date" value={qDate} onChange={(e) => setQDate(e.target.value)} />
            <button className="btn-outline" onClick={() => { setQVisitor(""); setQInmate(""); setQStatus(""); setQDate(""); }}>
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Tabla */}
        <section className="card-light">
          {loading ? (
            <p style={{ color: "#64748b" }}>Cargando…</p>
          ) : apiError ? (
            <p style={{ color: "#b91c1c" }}>{apiError}</p>
          ) : (
            <div className="vc-table-wrapper">
              {/* 👇 usa la clase table-primary */}
              <table className="table table-primary">
                <thead>
                  <tr>
                    <th>Visitante</th>
                    <th>Interno</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Notas</th>
                    <th style={{ width: 140 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => (
                    <tr key={v.id}>
                      <td>{v.visitor_name}</td>
                      <td>{v.inmate_name}</td>
                      <td>{v.visit_date.includes("T") ? v.visit_date.slice(0, 10) : v.visit_date}</td>
                      <td>{v.visit_hour?.slice(0, 5)}</td>
                      <td>{v.status}</td>
                      <td>{v.notes ?? ""}</td>
                      <td>
                        <div className="actions">
                          <button className="btn-icon" title="Editar" onClick={() => openEdit(v)}>✏️</button>
                          <button className="btn-icon danger" title="Eliminar" onClick={() => removeVisit(v.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ color: "#64748b" }}>Sin resultados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="link-muted" style={{ margin: "8px 0 0" }}>
          ¿Quieres agendar una visita?{" "}
          <a href="/visits" style={{ color: "#b91c1c", fontWeight: 600 }}>Agendar</a>
        </p>
      </div>


      {/* Modal edición */}
      {editing && editForm && (
        <div className="modal" onClick={() => { setEditing(null); setEditForm(null); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Editar visita</h3>

            <div className="row">
              <label>
                Visitante
                <input className="input-light" value={editForm.visitor_name}
                  onChange={e => onChangeEdit("visitor_name", e.target.value)} />
              </label>
              <label>
                Interno
                <input className="input-light" value={editForm.inmate_name}
                  onChange={e => onChangeEdit("inmate_name", e.target.value)} />
              </label>
              <label>
                Fecha
                <input className="input-light" type="date" value={editForm.visit_date}
                  onChange={e => onChangeEdit("visit_date", e.target.value)} />
              </label>
              <label>
                Hora
                <input className="input-light" type="time" value={editForm.visit_hour}
                  onChange={e => onChangeEdit("visit_hour", e.target.value)} />
              </label>
              <label>
                Estado
                <select className="input-light" value={editForm.status}
                  onChange={e => onChangeEdit("status", e.target.value as any)}>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </label>
              <label className="vc-col-span-2">
                Notas
                <input className="input-light" value={editForm.notes}
                  onChange={e => onChangeEdit("notes", e.target.value)} />
              </label>
            </div>

            {editErr && <p style={{ color: "#b91c1c" }}>{editErr}</p>}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button className="btn-outline" onClick={() => { setEditing(null); setEditForm(null); }}>Cancelar</button>
              <button className="btn" onClick={saveEdit}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
