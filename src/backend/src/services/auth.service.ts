// src/backend/src/services/auth.service.ts
import { getDb } from '../config/db';
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { sendResetEmail } from '../lib/mailer';
import { JWT_SECRET, JWT_EXPIRES } from '../config/jwt';

type UserRow = {
  id: string;
  name: string;
  last_name: string;
  email: string;
  role: string;
  national_id: string | null;
  phone: string | null;
  address: string | null;
  notify_email: boolean;
  birth_date: string | null;      // YYYY-MM-DD
  password_hash?: string;
  avatar_url: string;
};

const PUBLIC_FIELDS =
  'id, name, last_name, email, role, national_id, phone, address, notify_email, birth_date, avatar_url';

export async function findUserById(id: string): Promise<UserRow | undefined> {
  const db = getDb();
  const { rows } = await db.query(
    `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1 LIMIT 1`,
    [id],
  );
  return rows[0];
}

export async function findUserByEmail(
  email: string,
): Promise<(UserRow & { password_hash: string }) | null> {
  const db = getDb();
  const { rows } = await db.query(
    `SELECT ${PUBLIC_FIELDS}, password_hash
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email.toLowerCase()],
  );
  return (rows[0] as any) ?? null;
}

export async function register(data: {
  name: string;
  last_name: string;
  email: string;
  password: string;
  national_id: string;
  birth_date?: string | null;
  role?: 'ADMIN' | 'USER';
}) {
  const db = getDb();

  const { rows: dup } = await db.query(
    `SELECT
       EXISTS(SELECT 1 FROM users WHERE email = $1)       AS email_taken,
       EXISTS(SELECT 1 FROM users WHERE national_id = $2) AS national_taken`,
    [data.email.toLowerCase(), data.national_id],
  );
  if (dup[0]?.email_taken)
    return { ok: false, code: 'EMAIL_TAKEN', message: 'Este correo ya tiene una cuenta.' };
  if (dup[0]?.national_taken)
    return { ok: false, code: 'NATIONAL_ID_TAKEN', message: 'Esta cédula ya está registrada.' };

  const hash = await bcrypt.hash(data.password, 10);
  const role = data.role ?? 'USER';

  const { rows } = await db.query(
    `INSERT INTO users (name, last_name, email, password_hash, role, national_id, birth_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING ${PUBLIC_FIELDS}`,
    [
      data.name,
      data.last_name,
      data.email.toLowerCase(),
      hash,
      role,
      data.national_id,
      data.birth_date ?? null,
    ],
  );
  const user = rows[0] as UserRow;

  const signOpts: SignOptions = { expiresIn: JWT_EXPIRES };
  const token = jwt.sign(
    { sub: user.id, id: user.id, role: user.role, email: user.email, name: user.name, last_name: user.last_name },
    JWT_SECRET as Secret,
    signOpts,
  );

  return { ok: true, token, user };
}

export async function login(email: string, password: string) {
  const row = await findUserByEmail(email);
  if (!row) return null;

  const ok = await bcrypt.compare(password, row.password_hash!);
  if (!ok) return null;

  const user: UserRow = {
    id: row.id,
    name: row.name,
    last_name: row.last_name,
    email: row.email,
    role: row.role,
    national_id: row.national_id,
    phone: row.phone ?? null,
    address: row.address ?? null,
    notify_email: row.notify_email ?? true,
    birth_date: row.birth_date,
    avatar_url: row.avatar_url,
  };

  const signOpts: SignOptions = { expiresIn: JWT_EXPIRES };
  const token = jwt.sign(
    { sub: user.id, id: user.id, role: user.role, email: user.email, name: user.name, last_name: user.last_name },
    JWT_SECRET as Secret,
    signOpts,
  );

  return { token, user };
}

export async function startPasswordReset(email: string) {
  const db = getDb();
  const { rows } = await db.query(
    'SELECT id, email FROM users WHERE email=$1 LIMIT 1',
    [email.toLowerCase()],
  );
  const user = rows[0];
  if (!user) return { ok: true };

  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await db.query('UPDATE users SET reset_token_hash=$1, reset_expires=$2 WHERE id=$3', [
    hash,
    expires,
    user.id,
  ]);

  const base = (process.env.APP_BASE_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const resetUrl = `${base}/reset?token=${token}`;

  try {
    await sendResetEmail(user.email, resetUrl);
  } catch (err: any) {
    console.error('[mailer] error:', err?.message || err);
    throw new Error('No se pudo enviar el correo de recuperación. Revisa las variables SMTP_* del backend.');
  }

  return { ok: true };
}

export async function resetPassword(token: string, newPassword: string) {
  const db = getDb();
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  const { rows } = await db.query(
    'SELECT id FROM users WHERE reset_token_hash=$1 AND reset_expires > now() LIMIT 1',
    [hash],
  );
  const user = rows[0];
  if (!user) return { ok: false, message: 'Token inválido o caducado' };

  const pwdHash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash=$1, reset_token_hash=NULL, reset_expires=NULL WHERE id=$2', [
    pwdHash,
    user.id,
  ]);

  return { ok: true };
}

export async function updateProfile(
  userId: string,
  data: { phone?: string | null; address?: string | null; avatar_url?: string | null },
) {
  const db = getDb();

  const sets: string[] = [];
  const params: any[] = [];
  let i = 1;
  const push = (col: string, val: any) => { sets.push(`${col}=$${i++}`); params.push(val); };

  if (data.phone !== undefined)      push('phone', data.phone);
  if (data.address !== undefined)    push('address', data.address);
  if (data.avatar_url !== undefined) push('avatar_url', data.avatar_url);

  if (!sets.length) {
    const { rows } = await db.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id=$1 LIMIT 1`, [userId]);
    return { ok: true, user: rows[0] };
  }

  params.push(userId);
  const { rows } = await db.query(
    `UPDATE users SET ${sets.join(', ')} WHERE id=$${i}
     RETURNING ${PUBLIC_FIELDS}`,
    params,
  );
  return { ok: true, user: rows[0] };
}

export async function changePassword(userId: string, currentPwd: string, newPwd: string) {
  const db = getDb();
  const { rows } = await db.query('SELECT password_hash FROM users WHERE id=$1 LIMIT 1', [userId]);
  if (!rows.length) return { ok: false, message: 'Usuario no encontrado' };

  const ok = await bcrypt.compare(currentPwd, rows[0].password_hash);
  if (!ok) return { ok: false, message: 'Contraseña actual incorrecta' };

  const hash = await bcrypt.hash(newPwd, 10);
  await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, userId]);

  return { ok: true };
}
