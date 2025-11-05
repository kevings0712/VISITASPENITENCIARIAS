import 'dotenv/config';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

const isProd = process.env.NODE_ENV === 'production';

// Permite controlar SSL con una var explícita
// DB_SSL=true/false (por defecto: true en prod, false en dev)
const wantSSL =
  (process.env.DB_SSL ?? (isProd ? 'true' : 'false'))
    .toString()
    .toLowerCase() === 'true';

const useUrl = !!process.env.DATABASE_URL;

export const pool = new Pool(
  useUrl
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: wantSSL ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.PGHOST || '127.0.0.1',
        port: Number(process.env.PGPORT ?? 5432),
        database: process.env.PGDATABASE || 'visicontrol',
        user: process.env.PGUSER || 'visictrl_admin',
        password: process.env.PGPASSWORD,
        ssl: wantSSL ? { rejectUnauthorized: false } : false,
      }
);

// Helpers
export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => pool.query<T>(text, params);

export const getPool = () => pool;
export const getDb = () => pool;

export default { pool, query, getPool, getDb };
