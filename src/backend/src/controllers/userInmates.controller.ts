import { Request, Response } from "express";
import * as links from "../repositories/userInmates.repository";


export async function listMe(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ ok: false, message: "Unauthorized" });
  const items = await links.listByUser(userId);
  res.json({ ok: true, items });
}

export async function linkUser(req: Request, res: Response) {
  const { user_id, inmate_id } = req.body;
  if (!user_id || !inmate_id) {
    return res.status(400).json({ ok: false, message: "user_id & inmate_id required" });
  }
  const row = await links.link(user_id, inmate_id);
  res.status(201).json({ ok: true, item: row });
}

export async function unlinkUser(req: Request, res: Response) {
  const { user_id, inmate_id } = req.body;
  if (!user_id || !inmate_id) {
    return res.status(400).json({ ok: false, message: "user_id & inmate_id required" });
  }
  await links.unlink(user_id, inmate_id);
  res.json({ ok: true });
}