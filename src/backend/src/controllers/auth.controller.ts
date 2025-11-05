/**import { Request, Response } from 'express';
import { login, register, findUserById, startPasswordReset, resetPassword} from '../services/auth.service';

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

export async function postRegister(req: Request, res: Response) {
  const { name, last_name, email, password, national_id, birth_date } = req.body || {};
  if (!name || !last_name || !email || !password || !national_id) {
    return res.status(400).json({ ok: false, message: 'Faltan campos requeridos' });
  }
  try {
    const out = await register({ name, last_name, email, password, national_id, birth_date });
    if (!out.ok) return res.status(409).json(out); // duplicado
    return res.json(out);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error interno' });
  }
}

export async function postForgotPassword(req: Request, res: Response) {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ ok: false, message: 'Falta el correo' });

  try {
    await startPasswordReset(email);
    // Respondemos siempre OK para no revelar si existe o no
    return res.json({
      ok: true,
      message: 'Si el correo existe, te enviaremos instrucciones.'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error interno' });
  }
}

export async function postResetPassword(req: Request, res: Response) {
  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ ok: false, message: 'Faltan datos' });
  }

  try {
    const out = await resetPassword(token, password);
    if (!out.ok) return res.status(400).json(out);
    return res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error interno' });
  }
}


export async function getMe(req: Request, res: Response) {
  const id = (req as any).user?.sub as string | undefined;
  if (!id) return res.status(401).json({ ok:false, message:'No autenticado' });

  const user = await findUserById(id);
  if (!user) return res.status(404).json({ ok:false, message:'Usuario no encontrado' });

  return res.json({ ok:true, user });
}**/

import { Request, Response } from 'express';
import {
  login,
  register,
  findUserById,
  startPasswordReset,
  resetPassword,
  updateProfile,           // 👈 nuevo
  changePassword,          // 👈 nuevo
} from '../services/auth.service';

export async function postLogin(req: Request, res: Response) {
  const { email, password } = req.body || {};
  try {
    const result = await login(email, password);
    if (!result) return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error interno' });
  }
}

export async function postRegister(req: Request, res: Response) {
  const { name, last_name, email, password, national_id, birth_date } = req.body || {};
  if (!name || !last_name || !email || !password || !national_id) {
    return res.status(400).json({ ok: false, message: 'Faltan campos requeridos' });
  }
  try {
    const out = await register({ name, last_name, email, password, national_id, birth_date });
    if (!out.ok) return res.status(409).json(out);
    return res.json(out);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error interno' });
  }
}

export async function postForgotPassword(req: Request, res: Response) {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ ok: false, message: 'Falta el correo' });

  try {
    await startPasswordReset(email);
    return res.json({ ok: true, message: 'Si el correo existe, te enviaremos instrucciones.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error interno' });
  }
}

export async function postResetPassword(req: Request, res: Response) {
  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ ok: false, message: 'Faltan datos' });
  }
  try {
    const out = await resetPassword(token, password);
    if (!out.ok) return res.status(400).json(out);
    return res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error interno' });
  }
}

export async function getMe(req: Request, res: Response) {
  const id = (req as any).user?.sub as string | undefined;
  if (!id) return res.status(401).json({ ok: false, message: 'No autenticado' });

  const user = await findUserById(id);
  if (!user) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });

  return res.json({ ok: true, user });
}

// ---------- NUEVO: actualizar perfil ----------
// auth.controller.ts
export async function patchMe(req: Request, res: Response) {
  const id = (req as any).user?.sub as string | undefined;
  if (!id) return res.status(401).json({ ok:false, message:'No autenticado' });

  const { phone, address, avatar_url } = req.body || {};

  try {
    const out = await updateProfile(id, { phone, address, avatar_url });
    return res.json(out);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok:false, message:'Error interno' });
  }
}


// ---------- NUEVO: cambiar contraseña ----------
export async function postChangePassword(req: Request, res: Response) {
  const id = (req as any).user?.sub as string | undefined;
  if (!id) return res.status(401).json({ ok: false, message: 'No autenticado' });

  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) {
    return res.status(400).json({ ok: false, message: 'Faltan datos' });
  }
  try {
    const out = await changePassword(id, current_password, new_password);
    if (!out.ok) return res.status(400).json(out);
    return res.json({ ok: true, message: 'Contraseña actualizada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Error interno' });
  }
}
