import { Request, Response } from "express";
import * as repo from "../repositories/inmates.repository";
import {
  listMyInmates,
  adminListInmates,
  adminGetInmate,
  adminCreateInmate,
  adminUpdateInmate,
  adminAuthorizeUser,
  adminUnauthorizeUser,
  InmateCreateDTO,
  InmateUpdateDTO,
  Relation
} from "../services/inmates.service";

export async function getMyInmatesCtrl(req: Request, res: Response) {
  try {
    const userId = req.user?.id; // ya tipado por express.d.ts
    if (!userId) return res.status(401).json({ ok: false, message: "No autenticado" });
    const q = (req.query.q as string) || "";
    const items = await listMyInmates(userId, q);
    return res.json({ ok: true, items });
  } catch (e) {
    console.error("[inmates] getMyInmates", e);
    return res.status(500).json({ ok: false, message: "Error interno" });
  }
}

export async function adminListInmatesCtrl(req: Request, res: Response) {
  try {
    const { q, status, page, limit } = req.query as any;
    const data = await adminListInmates({
      q,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });
    return res.json({ ok: true, ...data });
  } catch (e) {
    console.error("[inmates] adminList", e);
    return res.status(500).json({ ok: false, message: "Error interno" });
  }
}

export async function adminGetInmateCtrl(req: Request, res: Response) {
  try {
    const row = await adminGetInmate(req.params.id);
    if (!row) return res.status(404).json({ ok: false, message: "No encontrado" });
    return res.json({ ok: true, item: row });
  } catch (e) {
    console.error("[inmates] adminGet", e);
    return res.status(500).json({ ok: false, message: "Error interno" });
  }
}

export async function adminCreateInmateCtrl(req: Request, res: Response) {
  try {
    const payload: InmateCreateDTO = req.body || {};
    if (!payload.first_name || !payload.last_name) {
      return res.status(400).json({ ok: false, message: "Faltan nombres/apellidos" });
    }
    const row = await adminCreateInmate(payload);
    return res.status(201).json({ ok: true, item: row });
  } catch (e: any) {
    console.error("[inmates] adminCreate", e);
    return res.status(500).json({ ok: false, message: e?.detail || "Error interno" });
  }
}

export async function adminUpdateInmateCtrl(req: Request, res: Response) {
  try {
    const payload: InmateUpdateDTO = req.body || {};
    const row = await adminUpdateInmate(req.params.id, payload);
    if (!row) return res.status(404).json({ ok: false, message: "No encontrado" });
    return res.json({ ok: true, item: row });
  } catch (e: any) {
    console.error("[inmates] adminUpdate", e);
    return res.status(500).json({ ok: false, message: e?.detail || "Error interno" });
  }
}

export async function adminAuthorizeUserCtrl(req: Request, res: Response) {
  try {
    const inmateId = req.params.id;
    const { user_id, rel } = req.body as { user_id: string; rel?: Relation };
    if (!user_id) return res.status(400).json({ ok: false, message: "user_id requerido" });
    const row = await adminAuthorizeUser(inmateId, user_id, rel ?? "AUTHORIZED");
    return res.json({ ok: true, item: row });
  } catch (e) {
    console.error("[inmates] adminAuthorize", e);
    return res.status(500).json({ ok: false, message: "Error interno" });
  }
}

export async function adminUnauthorizeUserCtrl(req: Request, res: Response) {
  try {
    const inmateId = req.params.id;
    const userId = req.params.userId;
    await adminUnauthorizeUser(inmateId, userId);
    return res.json({ ok: true });
  } catch (e) {
    console.error("[inmates] adminUnauthorize", e);
    return res.status(500).json({ ok: false, message: "Error interno" });
  }
}

/** --------- Endpoints de apoyo a repositorios “crudos” (si aún los usas) --------- */

export async function listMine(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ ok: false, message: "Unauthorized" });
  const items = await repo.listForUser(userId);
  res.json({ ok: true, items });
}

export async function listAll(req: Request, res: Response) {
  const { q, status } = req.query as any;
  const items = await repo.listAll({ q, status });
  res.json({ ok: true, items });
}

export async function getOne(req: Request, res: Response) {
  const row = await repo.getById(req.params.id);
  if (!row) return res.status(404).json({ ok: false, message: "Not found" });
  res.json({ ok: true, item: row });
}

export async function create(req: Request, res: Response) {
  const item = await repo.create(req.body);
  res.status(201).json({ ok: true, item });
}

export async function update(req: Request, res: Response) {
  const item = await repo.update(req.params.id, req.body);
  res.json({ ok: true, item });
}

export async function remove(req: Request, res: Response) {
  await repo.remove(req.params.id);
  res.json({ ok: true });
}


