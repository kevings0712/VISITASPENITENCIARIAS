import { Request, Response } from 'express';
import { getPool } from '../config/db';

export async function getVisits(_req: Request, res: Response) {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM visits ORDER BY visit_date DESC, visit_hour DESC'
  );
  res.json({ ok: true, visits: rows });
}

export async function postVisit(req: Request, res: Response) {
  const { visitor_name, inmate_name, visit_date, visit_hour, notes } = req.body;

  if (!visitor_name || !inmate_name || !visit_date || !visit_hour) {
    return res.status(400).json({ ok: false, message: 'Faltan campos requeridos' });
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO visits(visitor_name, inmate_name, visit_date, visit_hour, notes)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [visitor_name, inmate_name, visit_date, visit_hour, notes || null]
  );

  res.status(201).json({ ok: true, visit: rows[0] });
}

