// src/backend/src/types/express.d.ts
import "express";

declare global {
  namespace Express {
    type Role = "ADMIN" | "VISITOR" | "STAFF";

    interface User {
      id: string;           // <- usaremos siempre 'id'
      email: string;
      role: Role;
      name?: string;
      sub?: string;         // compatibilidad si en algún sitio quedó 'sub'
    }

    interface Request {
      user?: User;          // <- añade req.user al tipo Request
    }
  }
}

export {};
