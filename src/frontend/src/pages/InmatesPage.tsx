// src/frontend/src/pages/InmatesPage.tsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { getMyInmates, type MyInmate, adminListInmates, type AdminListResp } from "../api/inmates";

type MeResp = { ok: boolean; user?: { id: string; role: string; name?: string } };

export default function InmatesPage() {
  const nav = useNavigate();
  const [role, setRole] = useState<string>("USER");
  const [items, setItems] = useState<MyInmate[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // cargo rol
  useEffect(() => {
    (async () => {
      try {
        const me = await api.get<MeResp>("/auth/me");
        setRole(me?.user?.role || "USER");
      } catch { /* ignore */ }
    })();
  }, []);

  // cargo internos según rol
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setErr(null);
        setLoading(true);

        if (role === "ADMIN") {
          const r: AdminListResp = await adminListInmates({ page: 1, limit: 500 });
          // mapeo al shape de MyInmate solo para pintar
          const mapped: MyInmate[] = (r.items || []).map(i => ({
            inmate_id: i.id,
            first_name: i.first_name,
            last_name: i.last_name,
            relation: "ADMIN"
          }));
          if (!cancel) setItems(mapped);
        } else {
          const rows = await getMyInmates();
          if (!cancel) setItems(rows);
        }
      } catch (e: any) {
        if (!cancel) setErr(e?.message ?? "No se pudo cargar");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [role]);

  const isAdmin = role === "ADMIN";

  return (
    <div className="app-light">
      <div className="container">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"10px 0 14px"}}>
          <h1 className="h1">{isAdmin ? "Todos los internos (Admin)" : "Mis internos"}</h1>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn-outline" onClick={() => nav("/dashboard")}>Volver</button>
            <button className="btn" onClick={() => nav("/visits")}>Agendar visita</button>
          </div>
        </div>

        {loading && <p>Cargando…</p>}
        {err && <p style={{color:"#b91c1c"}}>{err}</p>}
        {!loading && !items.length && (
          <div className="card-light" style={{padding:16}}>
            <p>{isAdmin ? "No hay internos." : "No tienes internos autorizados aún."}</p>
          </div>
        )}

        {items.map(i => (
          <article key={i.inmate_id} className="notif-card" style={{
            background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, padding:14, marginBottom:12,
            boxShadow:"0 10px 30px rgba(0,0,0,.06)"
          }}>
            <h3 style={{margin:"0 0 6px"}}>{i.first_name} {i.last_name}</h3>
            <div style={{color:"#64748b", fontSize:14}}>
              Relación: {isAdmin ? "—" : i.relation}
            </div>
            <div style={{ marginTop: 10 }}>
              <button
                className="btn-outline"
                onClick={() => nav(`/visits?inmate=${i.inmate_id}`)}
              >
                Agendar visita
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
