import dotenv from 'dotenv';
import { Pool } from 'pg';
dotenv.config();

let pool: Pool | null = null;

export function getDb(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5433),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

// Alias por compatibilidad si en algún archivo usamos getPool
export const getPool = getDb;

export async function query<T = any>(text: string, params?: any[]) {
  const p = getDb();
  return p.query<T>(text, params);
}
