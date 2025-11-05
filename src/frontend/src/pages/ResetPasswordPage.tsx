import { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import api from '../api/client';
import logo from "../../../../docs/logovisicontrol.png";


const schema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
});

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const { search } = useLocation();
  const token = useMemo(() => new URLSearchParams(search).get('token') || '', [search]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setOkMsg(null);

    if (!token) {
      setErr('Token inválido');
      return;
    }

    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/reset-password', { token, password: parsed.data.password });
      setOkMsg('Contraseña actualizada. Ahora puedes iniciar sesión.');
      setTimeout(() => nav('/login', { replace: true }), 1200);
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <img className="login-logo" src={logo} alt="VisiControl" />
        <h1 className="login-title">Restablecer contraseña</h1>

        <div className="field">
          <label className="label">Nueva contraseña</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña segura"
          />
        </div>

        <div className="field">
          <label className="label">Confirmar contraseña</label>
          <input
            className="input"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repetir contraseña"
          />
        </div>

        {err && <div className="link-row" style={{ color: '#b91c1c' }}>{err}</div>}
        {okMsg && <div className="link-row" style={{ color: '#16a34a' }}>{okMsg}</div>}

        <button className="btn" disabled={loading}>
          {loading ? 'Guardando…' : 'Actualizar contraseña'}
        </button>

        <div className="link-muted" style={{ marginTop: 12 }}>
          <Link to="/login">Volver al inicio de sesión</Link>
        </div>
      </form>
    </div>
  );
}
