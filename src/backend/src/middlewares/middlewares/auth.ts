import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ ok:false, message: 'No token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ ok:false, message: 'Token inválido' });
  }
}
