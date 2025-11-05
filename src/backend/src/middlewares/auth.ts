import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, message: "No token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any; // { sub, email, role, name? }

    // Normalizamos SIEMPRE a 'id'
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      sub: payload.sub
    };

    (res.locals as any).user = req.user;
    next();
  } catch (e) {
    console.error("JWT verify failed", e);
    return res.status(401).json({ ok: false, message: "Token inválido" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ ok: false, message: "No autenticado" });
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ ok: false, message: "Solo administradores" });
  }
  next();
}
