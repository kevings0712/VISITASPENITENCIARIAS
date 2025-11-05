// src/backend/src/services/inmates.service.ts
import { getPool } from "../config/db";

export type InmateStatus = "ENABLED" | "BLOCKED";
export type DocType = "CEDULA" | "PASAPORTE" | "OTRO";
export type Relation = "AUTHORIZED" | "FAMILY" | "LAWYER" | "OTHER";

export type InmateCreateDTO = {
  first_name: string;
  last_name: string;
  doc_type?: DocType;
  national_id?: string | null;
  birth_date?: string | null; // YYYY-MM-DD
  pavilion?: string | null;
  cell?: string | null;
  status?: InmateStatus;
  notes?: string | null;
};

export type InmateUpdateDTO = Partial<InmateCreateDTO>;

export async function listMyInmates(userId: string, search?: string) {
  const db = getPool();

  const vals: any[] = [userId];
  let searchSql = "";

  if (search && search.trim()) {
    vals.push(`%${search.trim().toLowerCase()}%`);
    searchSql = `
      AND (
        lower(i.first_name || ' ' || i.last_name) LIKE $${vals.length}
        OR i.national_id ILIKE $${vals.length}
      )
    `;
  }

  // Nota de estado: acepta ambas convenciones por si tu tabla quedó con ACTIVE/ENABLED
  const statusSql = `AND (i.status = 'ENABLED' OR i.status = 'ACTIVE')`;

  const q = `
    SELECT
      i.id         AS inmate_id,
      i.first_name,
      i.last_name,
      ui.rel       AS relation
    FROM user_inmates ui
    JOIN inmates i ON i.id = ui.inmate_id
    WHERE ui.user_id = $1
      ${statusSql}
      ${searchSql}
    ORDER BY i.first_name ASC, i.last_name ASC
    LIMIT 200;
  `;

  const { rows } = await db.query(q, vals);
  return rows;
}


export async function adminListInmates(params: {
  q?: string;
  status?: InmateStatus;
  page?: number;
  limit?: number;
}) {
  const db = getPool();
  const page = Math.max(1, Number(params.page || 1));
  const limit = Math.min(200, Math.max(1, Number(params.limit || 50)));
  const offset = (page - 1) * limit;

  const vals: any[] = [];
  const wh: string[] = [];

  if (params.status) {
    vals.push(params.status);
    wh.push(`i.status = $${vals.length}`);
  }
  if (params.q && params.q.trim()) {
    vals.push(`%${params.q.trim().toLowerCase()}%`);
    wh.push(`(lower(i.full_name) LIKE $${vals.length} OR i.national_id ILIKE $${vals.length})`);
  }

  const where = wh.length ? `WHERE ${wh.join(" AND ")}` : "";

  const sql = `
    SELECT i.*
      FROM inmates i
      ${where}
     ORDER BY i.created_at DESC
     LIMIT ${limit} OFFSET ${offset};
  `;

  const countSql = `SELECT count(*)::int AS total FROM inmates i ${where};`;

  const [listRes, countRes] = await Promise.all([
    db.query(sql, vals),
    db.query(countSql, vals),
  ]);

  return {
    items: listRes.rows,
    pagination: { page, limit, total: countRes.rows[0].total },
  };
}

export async function adminGetInmate(id: string) {
  const db = getPool();
  const { rows } = await db.query(`SELECT * FROM inmates WHERE id=$1 LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function adminCreateInmate(data: InmateCreateDTO) {
  const db = getPool();
  const q = `
    INSERT INTO inmates (first_name, last_name, doc_type, national_id, birth_date, pavilion, cell, status, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `;
  const vals = [
    data.first_name,
    data.last_name,
    data.doc_type ?? "CEDULA",
    data.national_id ?? null,
    data.birth_date ?? null,
    data.pavilion ?? null,
    data.cell ?? null,
    data.status ?? "ENABLED",
    data.notes ?? null,
  ];
  const { rows } = await db.query(q, vals);
  return rows[0];
}

export async function adminUpdateInmate(id: string, data: InmateUpdateDTO) {
  const db = getPool();

  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;

  const push = (col: string, v: any) => { sets.push(`${col}=$${i++}`); vals.push(v); };

  if (data.first_name !== undefined) push("first_name", data.first_name);
  if (data.last_name !== undefined)  push("last_name",  data.last_name);
  if (data.doc_type !== undefined)   push("doc_type",   data.doc_type);
  if (data.national_id !== undefined)push("national_id",data.national_id);
  if (data.birth_date !== undefined) push("birth_date", data.birth_date);
  if (data.pavilion !== undefined)   push("pavilion",   data.pavilion);
  if (data.cell !== undefined)       push("cell",       data.cell);
  if (data.status !== undefined)     push("status",     data.status);
  if (data.notes !== undefined)      push("notes",      data.notes);

  if (!sets.length) return adminGetInmate(id);

  vals.push(id);
  const q = `
    UPDATE inmates SET ${sets.join(", ")}
     WHERE id=$${i}
     RETURNING *;
  `;
  const { rows } = await db.query(q, vals);
  return rows[0] || null;
}

export async function adminAuthorizeUser(inmateId: string, userId: string, rel: Relation = "AUTHORIZED") {
  const db = getPool();
  const q = `
    INSERT INTO user_inmates (user_id, inmate_id, rel)
    VALUES ($1,$2,$3)
    ON CONFLICT (user_id, inmate_id) DO UPDATE SET rel = EXCLUDED.rel
    RETURNING *;
  `;
  const { rows } = await db.query(q, [userId, inmateId, rel]);
  return rows[0];
}

export async function adminUnauthorizeUser(inmateId: string, userId: string) {
  const db = getPool();
  await db.query(`DELETE FROM user_inmates WHERE user_id=$1 AND inmate_id=$2`, [userId, inmateId]);
  return { ok: true };
}
