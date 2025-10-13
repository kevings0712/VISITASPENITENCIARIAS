import { Request, Response } from 'express';
import { login } from '../services/auth.service';

export async function postLogin(req: Request, res: Response) {
  const { email, password } = req.body || {};
  try {
    const result = await login(email, password);
    if (!result) return res.status(401).json({ ok:false, message: 'Credenciales inválidas' });
    return res.json({ ok:true, ...result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok:false, message: 'Error interno' });
  }
}

