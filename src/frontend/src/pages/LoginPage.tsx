// src/frontend/src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import logo from "../../../../docs/logovisicontrol.png";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@visicontrol.dev");
  const [password, setPassword] = useState("Admin123!");
  const [showPwd, setShowPwd] = useState(false);           // 👈 estado del ojito
  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ ok:boolean; token:string; user:{id:string;name:string;email:string;role:string} }>(
        "/auth/login",
        { email, password }
      );
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      nav("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div>
        <img className="login-logo" src={logo} alt="VisiControl" />
        <p className="login-sub">Sistema de Gestión de Visitas Penitenciarias</p>

        <form className="login-card" onSubmit={onSubmit}>
          <div className="field">
            <label className="label">Usuario o Correo Electrónico</label>
            <input
              className="input"
              type="email"
              placeholder="Ingresa tu usuario o correo"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="label">Contraseña</label>
            <div className="input-wrap">
              <input
                className="input has-toggle"
                type={showPwd ? "text" : "password"}   // 👈 alterna tipo
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="eye-btn"
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPwd ? "Ocultar" : "Mostrar"}
                onClick={() => setShowPwd(s => !s)}
              >
                {showPwd ? (
                  // eye-off
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A3 3 0 0113.42 13.42" />
                    <path d="M17.94 17.94A10.94 10.94 0 0112 20C5 20 1 12 1 12a21.56 21.56 0 016.06-7.06" />
                    <path d="M9.88 4.12A10.94 10.94 0 0112 4c7 0 11 8 11 8a20.29 20.29 0 01-3.87 5.14" />
                  </svg>
                ) : (
                  // eye
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p style={{color:"#b91c1c", margin:"8px 0"}}>{error}</p>}

          <button className="btn" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          <div className="link-row">
            <Link to="/forgot">¿Olvidaste tu contraseña?</Link>
          </div>
          <div className="link-muted">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </div>
        </form>

        <p style={{textAlign:"center", color:"#64748b", marginTop:12}}>
          © 2025 VisiControl. Sistema seguro y confiable.
        </p>
      </div>
    </div>
  );
}
