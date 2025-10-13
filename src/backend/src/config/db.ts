import 'dotenv/config';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

const isProd = process.env.NODE_ENV === 'production';

export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host: process.env.PGHOST,
        port: Number(process.env.PGPORT ?? 5432),
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ssl: isProd ? { rejectUnauthorized: false } : false
      }
);

// Helper tipado para consultas (TS y @types/pg nuevos)
export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => pool.query<T>(text, params);

// ✅ Compatibilidad con código existente
export const getPool = () => pool;
export const getDb = () => pool;

// (opcional) export default si en algún punto usaron default-import
export default { pool, query, getPool, getDb };

