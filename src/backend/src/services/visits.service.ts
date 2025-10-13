import { getPool } from '../config/db';

export type CreateVisitDTO = {
  visitor_name: string;
  inmate_name: string;
  visit_date: string; // "YYYY-MM-DD"
  visit_hour: string; // "HH:mm"
  notes?: string;
};

export async function createVisit(dto: CreateVisitDTO) {
  const pool = getPool();
  const q = `
    INSERT INTO visits (visitor_name, inmate_name, visit_date, visit_hour, notes)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *`;
  const { rows } = await pool.query(q, [
    dto.visitor_name,
    dto.inmate_name,
    dto.visit_date,
    dto.visit_hour,
    dto.notes ?? null
  ]);
  return rows[0];
}

export async function listVisits(params: { date?: string; status?: string }) {
  const pool = getPool();
  const wh: string[] = [];
  const vals: any[] = [];

  if (params.date) { wh.push(`visit_date = $${vals.length+1}`); vals.push(params.date); }
  if (params.status) { wh.push(`status = $${vals.length+1}`); vals.push(params.status); }

  const where = wh.length ? `WHERE ${wh.join(' AND ')}` : '';
  const q = `SELECT * FROM visits ${where} ORDER BY visit_date DESC, visit_hour DESC LIMIT 200`;
  const { rows } = await pool.query(q, vals);
  return rows;
}
