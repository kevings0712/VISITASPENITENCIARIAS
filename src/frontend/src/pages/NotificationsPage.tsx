import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

type NotifKind =
  | "VISIT_CREATED"
  | "VISIT_APPROVED"
  | "VISIT_CANCELED"
  | "VISIT_UPDATED"
  | "VISIT_REMINDER"
  | "SYSTEM";

type NotifMeta = {
  visit_id?: string;
  visitor_name?: string;
  inmate_name?: string;
  visit_date?: string;   // "YYYY-MM-DD" o ISO
  visit_hour?: string;   // "HH:mm" o "HH:mm:ss"
  status?: string;
  old_date?: string;
  old_hour?: string;
  new_date?: string;
  new_hour?: string;
};

type Notif = {
  id: string;
  visit_id?: string | null;     // 👈 también tomo el top-level por si acaso
  kind: NotifKind;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  meta?: NotifMeta | null;
};

function timeago(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const d = Math.floor(s / 86400);
  if (d >= 1) return `Hace ${d} día${d > 1 ? "s" : ""}`;
  const h = Math.floor(s / 3600);
  if (h >= 1) return `Hace ${h} h`;
  const m = Math.floor(s / 60);
  if (m >= 1) return `Hace ${m} min`;
  return "Justo ahora";
}

// ---------- helpers de formato ----------
const df = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeStyle: "short",
});

function parseDateSmart(date?: string) {
  if (!date) return undefined;
  // Si ya viene ISO, confío en Date; si es "YYYY-MM-DD", construyo a medianoche local.
  if (date.includes("T")) {
    const d = new Date(date);
    return isNaN(+d) ? undefined : d;
  }
  // yyyy-mm-dd
  const d = new Date(`${date}T00:00:00`);
  return isNaN(+d) ? undefined : d;
}

function composeDate(date?: string, hour?: string) {
  const d = parseDateSmart(date);
  if (!d) return undefined;
  if (hour) {
    const [H, M] = hour.split(":").map((x) => parseInt(x, 10));
    d.setHours(isNaN(H) ? 0 : H, isNaN(M) ? 0 : M, 0, 0);
  }
  return d;
}

function fmtWhen(date?: string, hour?: string) {
  const d = composeDate(date, hour);
  return d ? df.format(d) : undefined;
}

const iconFor = (k: NotifKind) =>
  k === "VISIT_APPROVED" ? "✅" :
  k === "VISIT_CANCELED" ? "❌" :
  k === "VISIT_REMINDER" ? "🕑" :
  k === "VISIT_UPDATED"  ? "🔁" :
  k === "VISIT_CREATED"  ? "📝" : "🔔";

const kindLabel = (k: NotifKind) =>
  k === "VISIT_APPROVED" ? "aprobada" :
  k === "VISIT_CANCELED" ? "rechazada" :
  k === "VISIT_REMINDER" ? "recordatorio" :
  k === "VISIT_UPDATED"  ? "reprogramada" :
  k === "VISIT_CREATED"  ? "creada" : "sistema";

const shortId = (id?: string | null) => (id ? id.slice(0, 8) : "");

// ---------- componente ----------
export default function NotificationsPage() {
  const nav = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const res = await api.get<{ ok: boolean; items: Notif[] }>(
        "/notifications?limit=100"
      );
      setItems(res.items ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo cargar");
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    const ids = items.filter(i => !i.is_read).map(i => i.id);
    if (!ids.length) return;
    setMarking(true);
    try {
      await api.post("/notifications/mark-read", { ids });
      window.dispatchEvent(new Event("notif:changed"));
      setItems(prev => prev.map(i => (ids.includes(i.id) ? { ...i, is_read: true } : i)));
    } finally {
      setMarking(false);
    }
  }

  useEffect(() => {
    load();
    const onChanged = () => load();
    window.addEventListener("notif:changed", onChanged);
    return () => window.removeEventListener("notif:changed", onChanged);
  }, []);

  return (
    <div className="app-light">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0 14px" }}>
          <h1 className="h1">Notificaciones</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-outline" onClick={() => nav("/dashboard")}>Volver</button>
            <button className="btn-outline" onClick={markAllRead} disabled={marking}>
              {marking ? "Marcando…" : "Marcar todas como leídas"}
            </button>
          </div>
        </div>

        {loading && <p>Cargando…</p>}
        {err && <p style={{ color: "#b91c1c" }}>{err}</p>}
        {!loading && !items.length && <p>No tienes notificaciones.</p>}

        {items.map(n => {
          const m = n.meta || {};
          const vId = n.visit_id ?? m.visit_id;
          const when = fmtWhen(m.visit_date, m.visit_hour);
          const headerLine = [
            vId ? `#${shortId(vId)}` : null,
            when || null,
            m.status ? `Estado: ${m.status}` : null,
          ].filter(Boolean).join(" • ");

          const before = fmtWhen(m.old_date, m.old_hour);
          const after  = fmtWhen(m.new_date, m.new_hour);
          const reprogramLine =
            n.kind === "VISIT_UPDATED" && (before || after)
              ? `${before ? `Antes: ${before}` : ""}${before && after ? "  →  " : ""}${after ? `Ahora: ${after}` : ""}`
              : "";

          return (
            <article
              key={n.id}
              className="notif-card"
              style={{
                borderLeft: n.is_read ? "6px solid transparent" : "6px solid #cf4444",
                opacity: n.is_read ? .85 : 1,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: 14,
                marginBottom: 12,
                boxShadow: "0 10px 30px rgba(0,0,0,.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span aria-hidden style={{ fontSize: 22 }}>{iconFor(n.kind)}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0 }}>{n.title}</h3>
                    {!n.is_read && <span className="badge">Nueva</span>}
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#f1f5f9",
                        color: "#334155",
                        textTransform: "capitalize",
                      }}
                      title={n.kind}
                    >
                      {kindLabel(n.kind)}
                    </span>
                  </div>

                  {headerLine && (
                    <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 600 }}>
                      {headerLine}
                    </div>
                  )}

                  {(m.visitor_name || m.inmate_name) && (
                    <div style={{ color: "#475569", fontSize: 14 }}>
                      {m.visitor_name ? `Visitante: ${m.visitor_name}` : ""}
                      {m.visitor_name && m.inmate_name ? " • " : ""}
                      {m.inmate_name ? `Interno: ${m.inmate_name}` : ""}
                    </div>
                  )}
                </div>
              </div>

              <p style={{ margin: "8px 0 6px 0", color: "#475569" }}>{n.body}</p>

              {reprogramLine && (
                <div style={{
                  background: "#f8fafc",
                  border: "1px dashed #e2e8f0",
                  borderRadius: 12,
                  padding: "8px 10px",
                  color: "#334155",
                  fontSize: 14,
                }}>
                  {reprogramLine}
                </div>
              )}

              <div style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>
                {timeago(n.created_at)}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
