// src/frontend/src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

type Visit = {
  id: string;
  visitor_name: string;
  inmate_name: string;
  visit_date: string; // YYYY-MM-DD
  visit_hour: string; // HH:mm[:ss]
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  notes?: string;
  created_at?: string;
  // opcional si ya migraste:
  inmate_id?: string | null;
};

type MeResp = {
  ok: boolean;
  user?: { id: string; name: string; email: string; role: string };
};

export default function DashboardPage() {
  const nav = useNavigate();

  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; body: string }>>([]);
  const [displayName, setDisplayName] = useState<string>(
    localStorage.getItem("user_name") ||
      localStorage.getItem("email") ||
      "Usuario"
  );

  

  // ----- Helpers UI -----
  const greet = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "¡Buenos días!";
    if (h < 19) return "¡Buenas tardes!";
    return "¡Buenas noches!";
  }, []);

  function parseDateTime(v: Visit) {
    // Normaliza a HH:mm:ss
    const hh = v.visit_hour.length === 5 ? `${v.visit_hour}:00` : v.visit_hour;
    // Ensambla ISO local
    return new Date(`${v.visit_date}T${hh}`);
  }

  // ----- Nombre usuario (me) -----
  useEffect(() => {
    (async () => {
      try {
        const me = await api.get<MeResp>("/auth/me");
        if (me?.user) {
          const name = me.user.name || me.user.email || "Usuario";
          setDisplayName(name);
          localStorage.setItem("user_name", me.user.name || "");
          localStorage.setItem("email", me.user.email || "");
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // ----- Visitas (para KPIs y próxima visita) -----
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<{ ok: boolean; visits?: Visit[] }>("/visits");
        if (!cancel) setVisits(res.visits ?? []);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // ----- Unread inicial -----
  async function refreshUnread() {
    try {
      const r = await api.get<{ ok: boolean; count: number }>("/notifications/unread-count");
      setUnread(r.count || 0);
    } catch {
      setUnread(0);
    }
  }

  useEffect(() => {
    refreshUnread();
  }, []);

  // ----- Escucha cambios globales de notificaciones (p.ej. "Marcar todas leídas") -----
  useEffect(() => {
    const onChanged = () => { refreshUnread(); };
    window.addEventListener("notif:changed", onChanged as any);
    return () => window.removeEventListener("notif:changed", onChanged as any);
  }, []);

  // ----- SSE en vivo para toasts y contador -----
  useEffect(() => {
    const base = (import.meta.env.VITE_API_BASE as string).replace(/\/+$/, "");
    const token = localStorage.getItem("token") || "";
    if (!token) return;

    const url = `${base}/api/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    const onNotif = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data);
        const n = data?.item;
        if (!n) return;

        // Sube contador si la noti es no leída
        setUnread((u) => u + (n.is_read ? 0 : 1));

        // Toast
        const id = n.id || Math.random().toString(36).slice(2);
        setToasts((t) => [{ id, title: n.title, body: n.body }, ...t]);

        // Autoremover a los 5s
        setTimeout(() => {
          setToasts((t) => t.filter((x) => x.id !== id));
        }, 5000);
      } catch {
        /* ignore */
      }
    };

    es.addEventListener("notif", onNotif);
    es.onerror = () => {
      // Puedes hacer retry simple cerrando; el browser reintentará
      // o llamar refreshUnread() si quieres sincronizar.
    };

    return () => {
      es.removeEventListener("notif", onNotif);
      es.close();
    };
  }, []);

  // ----- KPIs -----
  const { pending, approved, rejected } = useMemo(() => {
    const p = visits.filter((v) => v.status === "PENDING").length;
    const a = visits.filter((v) => v.status === "APPROVED").length;
    const r = visits.filter((v) => v.status === "REJECTED").length;
    return { pending: p, approved: a, rejected: r };
  }, [visits]);

  // Próxima visita (PENDING/APPROVED en el futuro más cercano)
  const nextVisit = useMemo(() => {
    const now = new Date();
    const candidates = visits.filter(
      (v) =>
        (v.status === "PENDING" || v.status === "APPROVED") &&
        parseDateTime(v).getTime() >= now.getTime()
    );
    candidates.sort((a, b) => parseDateTime(a).getTime() - parseDateTime(b).getTime());
    return candidates[0];
  }, [visits]);

  const notifCount = unread;

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login", { replace: true });
  };

  // ---- Render ----
  return (
    <div className="app-light">
      {/* TOASTS overlay */}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <strong>{t.title}</strong>
            <div>{t.body}</div>
          </div>
        ))}
      </div>

      <div className="dash">
        {/* HERO */}
        <header className="hero">
          <div className="hero-row">
            <div className="brand-avatar">VC</div>

            <div className="hero-titles">
              <div className="hero-greet">{greet}</div>
              <div className="hero-name">{displayName}</div>
            </div>

            <button className="btn-outline" onClick={() => nav("/profile")}>
              Mi perfil
            </button>

            {/* Campana */}
            <button
              className="hero-bell"
              onClick={() => nav("/notifications")}
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
                <path d="M12 2a7 7 0 0 0-7 7v3.09l-1.38 2.3A1 1 0 0 0 4.5 16h15a1 1 0 0 0 .88-1.5L19 12.09V9a7 7 0 0 0-7-7Zm0 20a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3Z" />
              </svg>
              {notifCount > 0 && <span className="badge">{notifCount}</span>}
            </button>
          </div>

          <div className="hero-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#fff"
                opacity=".85"
                d="M12 2L3 5v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V5l-9-3Zm0 2.2l7 2.3v4.5c0 4-2.8 7.9-7 9.1-4.2-1.2-7-5-7-9.1V6.5l7-2.3Z"
              />
            </svg>
            <span>Sistema de gestión de visitas penitenciarias</span>
          </div>
        </header>

        {/* ACCIONES */}

        
        <h2 className="section-title">Acciones Principales</h2>

        <div className="action-list">
          <button className="action-card" onClick={() => nav("/visits")}>
            <span className="icon-square red">+</span>
            <div className="action-text">
              <h3>Agendar Visita</h3>
              <p>Programa una nueva visita</p>
            </div>
          </button>

          <button className="action-card" onClick={() => nav("/history")}>
            <span className="icon-square blue">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
                <path d="M12 8v5l4 2 .7-1.3-3.2-1.7V8z" />
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
              </svg>
            </span>
            <div className="action-text">
              <h3>Mis Visitas / Historial</h3>
              <p>Ver tus visitas programadas y pasadas</p>
            </div>
          </button>

          <button className="action-card" onClick={() => nav("/inmates")}>
            <span className="icon-square green">👤</span>
            <div className="action-text">
              <h3>Mis Internos</h3>
              <p>Ver internos autorizados</p>
            </div>
          </button>

          <button className="action-card" onClick={() => nav("/notifications")}>
            <span className="icon-square orange">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
                <path d="M12 2a7 7 0 00-7 7v3.09L3.62 14.4A1 1 0 004.5 16h15a1 1 0 00.88-1.5L19 12.09V9a7 7 0 00-7-7z" />
              </svg>
              {notifCount > 0 && <span className="badge small">{notifCount}</span>}
            </span>
            <div className="action-text">
              <h3>Notificaciones</h3>
              <p>{notifCount} mensajes nuevos</p>
            </div>
          </button>
        </div>

        <button className="action-card" onClick={() => nav("/admin/inmates")}>
  <span className="icon-square purple">🛠️</span>
  <div className="action-text">
    <h3>Panel Admin</h3>
    <p>Gestionar internos</p>
  </div>
</button>

        {/* Próxima visita */}
        <div className="card-light" style={{ marginTop: 16 }}>
          <h3 className="subtitle">Próxima visita</h3>
          {loading ? (
            <p style={{ color: "#64748b", margin: 8 }}>Cargando…</p>
          ) : nextVisit ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="icon-square blue" aria-hidden>🗓️</div>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {nextVisit.inmate_name} · {nextVisit.visit_date} {nextVisit.visit_hour.length === 5 ? nextVisit.visit_hour : nextVisit.visit_hour.slice(0,5)}
                </div>
                <div style={{ color: "#64748b", fontSize: 14 }}>
                  Estado: {nextVisit.status === "PENDING" ? "Pendiente" :
                           nextVisit.status === "APPROVED" ? "Aprobada" :
                           nextVisit.status === "REJECTED" ? "Rechazada" : nextVisit.status}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: "#64748b", margin: 8 }}>No tienes visitas próximas.</p>
          )}
        </div>

        {/* Logout + sesión */}
        <button className="logout-ghost" onClick={logout}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path d="M10 17l5-5-5-5v10z" />
            <path d="M4 4h6v2H6v12h4v2H4z" />
          </svg>
        </button>
        <p className="session-note">Sesión iniciada como {displayName}</p>

        {/* RESUMEN KPIs */}
        <div className="card-light">
          <h3 className="subtitle">Resumen de Visitas</h3>
          {loading ? (
            <p style={{ color: "#64748b", margin: 8 }}>Cargando…</p>
          ) : (
            <div className="summary">
              <div className="summary-chip pending">
                <span className="chip-ico">🕑</span>
                <div>
                  <div className="chip-title">Pendientes</div>
                  <div className="chip-val">{pending}</div>
                </div>
              </div>
              <div className="summary-chip approved">
                <span className="chip-ico">✅</span>
                <div>
                  <div className="chip-title">Aprobadas</div>
                  <div className="chip-val">{approved}</div>
                </div>
              </div>
              <div className="summary-chip rejected">
                <span className="chip-ico">✖️</span>
                <div>
                  <div className="chip-title">Rechazadas</div>
                  <div className="chip-val">{rejected}</div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
