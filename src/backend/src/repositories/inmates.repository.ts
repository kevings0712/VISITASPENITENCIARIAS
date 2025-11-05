import { getPool } from "../config/db";

export type InmateCreate = {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  id_document?: string | null;
  birth_date?: string | null;     // YYYY-MM-DD
  pavilion?: string | null;
  cell?: string | null;
  status?: "ENABLED" | "BLOCKED";
  notes?: string | null;
};

export async function listForUser(userId: string) {
  const db = getPool();
  const q = `
    SELECT i.*
      FROM user_inmates ui
      JOIN inmates i ON i.id = ui.inmate_id
     WHERE ui.user_id = $1
     ORDER BY i.full_name NULLS LAST, i.first_name NULLS LAST
     LIMIT 500;`;
  const { rows } = await db.query(q, [userId]);
  return rows;
}

export async function listAll(opts?: { q?: string; status?: string }) {
  const db = getPool();
  const wh: string[] = [];
  const vals: any[] = [];
  if (opts?.q) {
    wh.push(`(unaccent(i.full_name) ILIKE unaccent($${vals.length + 1})
          OR unaccent(i.first_name||' '||i.last_name) ILIKE unaccent($${vals.length + 1})
          OR i.id_document ILIKE $${vals.length + 1})`);
    vals.push(`%${opts.q}%`);
  }
  if (opts?.status) {
    wh.push(`i.status = $${vals.length + 1}`);
    vals.push(opts.status);
  }
  const where = wh.length ? `WHERE ${wh.join(" AND ")}` : "";
  const q = `SELECT i.* FROM inmates i ${where} ORDER BY i.full_name NULLS LAST LIMIT 500`;
  const { rows } = await db.query(q, vals);
  return rows;
}

export async function getById(id: string) {
  const db = getPool();
  const { rows } = await db.query(`SELECT * FROM inmates WHERE id=$1 LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function create(data: InmateCreate) {
  const db = getPool();
  const q = `
    INSERT INTO inmates
      (first_name,last_name,full_name,id_document,birth_date,pavilion,cell,status,notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`;
  const { rows } = await db.query(q, [
    data.first_name ?? null,
    data.last_name ?? null,
    data.full_name ?? null,
    data.id_document ?? null,
    data.birth_date ?? null,
    data.pavilion ?? null,
    data.cell ?? null,
    data.status ?? "ENABLED",
    data.notes ?? null,
  ]);
  return rows[0];
}

export async function update(id: string, data: InmateCreate) {
  const db = getPool();
  const q = `
    UPDATE inmates
       SET first_name=$1,last_name=$2,full_name=$3,id_document=$4,birth_date=$5,
           pavilion=$6,cell=$7,status=$8,notes=$9,updated_at=now()
     WHERE id=$10
     RETURNING *`;
  const { rows } = await db.query(q, [
    data.first_name ?? null,
    data.last_name ?? null,
    data.full_name ?? null,
    data.id_document ?? null,
    data.birth_date ?? null,
    data.pavilion ?? null,
    data.cell ?? null,
    data.status ?? "ENABLED",
    data.notes ?? null,
    id,
  ]);
  return rows[0];
}

export async function remove(id: string) {
  const db = getPool();
  await db.query(`DELETE FROM inmates WHERE id=$1`, [id]);
  return { ok: true };
}
