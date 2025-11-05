// src/backend/src/controllers/visits.controller.ts
import { Request, Response } from "express";
import { getPool } from "../config/db";
import {
  createVisit,
  listVisits,
  updateVisit,
  deleteVisit,
} from "../services/visits.service";

// GET /api/visits?date=YYYY-MM-DD&status=PENDING|APPROVED|REJECTED&scope=all
export async function getVisits(req: Request, res: Response) {
  try {
    const { date, status, scope } = req.query as { date?: string; status?: string; scope?: string };

    const user = (req as any).user || {};
    const userId = user?.id as string | undefined;
    const isAdmin = user?.role === "ADMIN";

    const visits = await listVisits({
      date,
      status,
      // si es ADMIN y pide scope=all: no filtramos por creador
      created_by: isAdmin && scope === "all" ? undefined : userId,
    });

    return res.json({ ok: true, visits });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Error interno" });
  }
}

// POST /api/visits
// Acepta: { inmate_id, visit_date, visit_hour, notes?, visitor_name? }
// - Usuario normal: debe estar autorizado en user_inmates.
// - ADMIN: puede agendar para cualquier interno (skip_auth=true).
export async function postVisit(req: Request, res: Response) {
  try {
    const { inmate_id, visit_date, visit_hour, notes, visitor_name } = req.body || {};
    const user = (req as any).user || {};
    const userId = user?.id as string | undefined;
    const isAdmin = user?.role === "ADMIN";

    if (!userId) {
      return res.status(401).json({ ok: false, message: "No autenticado" });
    }
    if (!inmate_id || !visit_date || !visit_hour) {
      return res.status(400).json({ ok: false, message: "Faltan campos requeridos (inmate_id, visit_date, visit_hour)" });
    }

    const db = getPool();

    // 1) Validar que el interno exista
    const { rows: inmateRows } = await db.query(
      `SELECT id, first_name, last_name FROM inmates WHERE id=$1 LIMIT 1`,
      [inmate_id]
    );
    if (!inmateRows.length) {
      return res.status(404).json({ ok: false, message: "Interno no encontrado" });
    }
    const inmate = inmateRows[0];
    const inmate_name = `${inmate.first_name} ${inmate.last_name}`.trim();

    // 2) Nombre del visitante
    const vName = (visitor_name && String(visitor_name).trim()) || user?.name || "Visitante";

    // 3) Crear visita (ADMIN salta validación con skip_auth)
    const visit = await createVisit({
      visitor_name: vName,
      inmate_name,
      inmate_id,
      visit_date,
      visit_hour,
      notes,
      created_by: userId,
      skip_auth: isAdmin,
    });

    return res.status(201).json({ ok: true, visit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Error interno" });
  }
}

// PUT /api/visits/:id (sin cambios funcionales)
export async function putVisit(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ ok: false, message: "Falta id" });

  const { visitor_name, inmate_name, visit_date, visit_hour, status, notes } =
    req.body || {};
  try {
    const updated = await updateVisit(id, {
      visitor_name,
      inmate_name,
      visit_date,
      visit_hour,
      status,
      notes,
    });
    if (!updated)
      return res.status(404).json({ ok: false, message: "No encontrado" });
    return res.json({ ok: true, visit: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Error interno" });
  }
}

// DELETE /api/visits/:id
export async function deleteVisitCtrl(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ ok: false, message: "Falta id" });
  try {
    await deleteVisit(id);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Error interno" });
  }
}
