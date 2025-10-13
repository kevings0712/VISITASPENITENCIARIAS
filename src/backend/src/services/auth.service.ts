import { getDb } from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function findUserByEmail(email: string) {
  const db = getDb();
  const { rows } = await db.query('SELECT * FROM users WHERE email=$1 LIMIT 1', [email]);
  return rows[0];
}

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;

  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '8h' }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

