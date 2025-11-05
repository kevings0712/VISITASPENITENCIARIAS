// src/backend/src/utils/sse.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt";

const clients = new Map<string, Set<Response>>();

export function sseHandle(req: Request, res: Response) {
  const token = (req.query.token as string) || "";
  let userId: string | undefined;

  try {
    const p = jwt.verify(token, JWT_SECRET) as any;
    userId = p.sub || p.id;
  } catch {
    res.status(401).end();
    return;
  }
  if (!userId) {
    res.status(401).end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  res.write(`event: hello\ndata: {"ok":true}\n\n`);

  const set = clients.get(userId) || new Set<Response>();
  set.add(res);
  clients.set(userId, set);

  const ping = setInterval(() => {
    if (!res.writableEnded) res.write(`event: ping\ndata: {}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(ping);
    set.delete(res);
    if (!set.size) clients.delete(userId!);
  });
}

export function ssePush(userId: string, payload: any) {
  const set = clients.get(userId);
  if (!set) return;
  const str = `event: notif\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const r of set) {
    if (!r.writableEnded) r.write(str);
  }
}
