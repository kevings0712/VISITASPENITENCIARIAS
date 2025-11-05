import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import {
  listNotifications,
  markAsRead,
  countUnread,
  upsertTomorrowReminders,
} from "../services/notifications.service";
import { sseHandle } from "../utils/sse";

const r = Router();

// SSE sin header (usa ?token=)
r.get("/stream", sseHandle);

// Todo lo demás protegido
r.use(requireAuth);

r.get("/", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ ok: false, message: "No user" });

    // saneo de query
    const rawLimit = String(req.query.limit ?? "50");
    const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 50, 1), 200);
    const onlyUnread = ["1", "true", "yes"].includes(String(req.query.onlyUnread || "").toLowerCase());

    const items = await listNotifications({ userId, onlyUnread, limit });
    res.json({ ok: true, items });
  } catch (e: any) {
    console.error("[/api/notifications] GET failed:", e?.message || e);
    res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
});

r.get("/unread-count", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ ok: false, message: "No user" });
    const count = await countUnread(userId);
    res.json({ ok: true, count });
  } catch (e: any) {
    console.error("[/api/notifications/unread-count] GET failed:", e?.message || e);
    res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
});

r.post("/mark-read", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const { updated } = await markAsRead(userId, ids);
    res.json({ ok: true, updated });
  } catch (e: any) {
    console.error("[/api/notifications/mark-read] POST failed:", e?.message || e);
    res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
});

// DEV: generar recordatorios
r.post("/run-reminders", async (_req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ ok: false, message: "Forbidden" });
  }
  await upsertTomorrowReminders();
  res.json({ ok: true });
});

export default r;
