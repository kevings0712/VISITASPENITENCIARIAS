import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import api from '../api/client';
import logo from "../../../../docs/logovisicontrol.png";


const schema = z.object({
  email: z.string().trim().toLowerCase().email('Correo inválido'),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setOkMsg(null);

    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? 'Correo inválido');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/forgot-password', { email: parsed.data.email });
      setOkMsg('Si el correo existe, te enviaremos instrucciones.');
    } catch (e: any) {
      // Tu client.ts devolverá message mapeado si hay error
      setErr(e?.message ?? 'No se pudo procesar la solicitud');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <img className="login-logo" src={logo} alt="VisiControl" />
        <h1 className="login-title">Recuperar Contraseña</h1>
        <p className="login-sub">
          Ingresa tu correo y te enviaremos instrucciones para recuperarla.
        </p>

        <div className="field">
          <label className="label">Correo Electrónico</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErr(null); setOkMsg(null); }}
            placeholder="correo@ejemplo.com"
          />
        </div>

        {err && <div className="link-row" style={{ color: '#b91c1c' }}>{err}</div>}
        {okMsg && <div className="link-row" style={{ color: '#16a34a' }}>{okMsg}</div>}

        <button className="btn" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar Instrucciones'}
        </button>

        <div className="link-muted" style={{ marginTop: 12 }}>
          <Link to="/login">Volver al inicio de sesión</Link>
        </div>
      </form>
    </div>
  );
}
