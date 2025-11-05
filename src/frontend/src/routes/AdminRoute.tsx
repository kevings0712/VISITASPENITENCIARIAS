import { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import api from "../api/client";

type Me = { ok: boolean; user?: { id: string; email: string; role: string; name?: string } };

export default function AdminRoute() {
  const [state, setState] = useState<"loading" | "ok" | "noauth" | "forbidden">("loading");

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const me = await api.get<Me>("/auth/me");
        if (cancel) return;
        if (!me?.user) return setState("noauth");
        if (me.user.role !== "ADMIN") return setState("forbidden");
        setState("ok");
      } catch {
        if (!cancel) setState("noauth");
      }
    })();
    return () => { cancel = true; };
  }, []);

  if (state === "loading") {
    return (
      <div className="app-light">
        <div className="container"><p>Cargando…</p></div>
      </div>
    );
  }
  if (state === "noauth") return <Navigate to="/login" replace />;
  if (state === "forbidden") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
