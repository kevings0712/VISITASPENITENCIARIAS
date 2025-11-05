import { getPool } from "../config/db";

export async function listByUser(userId: string) {
  const db = getPool();
  const q = `
    SELECT i.*
      FROM user_inmates ui
      JOIN inmates i ON i.id = ui.inmate_id
     WHERE ui.user_id = $1
     ORDER BY i.full_name NULLS LAST
     LIMIT 500`;
  const { rows } = await db.query(q, [userId]);
  return rows;
}

export async function link(userId: string, inmateId: string) {
  const db = getPool();
  const q = `
    INSERT INTO user_inmates (user_id, inmate_id)
    VALUES ($1,$2)
    ON CONFLICT (user_id, inmate_id) DO NOTHING
    RETURNING *`;
  const { rows } = await db.query(q, [userId, inmateId]);
  return rows[0] ?? null;
}

export async function unlink(userId: string, inmateId: string) {
  const db = getPool();
  await db.query(`DELETE FROM user_inmates WHERE user_id=$1 AND inmate_id=$2`, [userId, inmateId]);
  return { ok: true };
}
