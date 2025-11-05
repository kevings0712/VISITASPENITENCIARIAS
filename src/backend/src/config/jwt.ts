// src/backend/src/config/jwt.ts
import type { Secret, SignOptions } from "jsonwebtoken";

export const JWT_SECRET: Secret =
  (process.env.JWT_SECRET && process.env.JWT_SECRET.trim() !== "")
    ? (process.env.JWT_SECRET as string)
    : "dev-secret";

export const JWT_EXPIRES: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES && process.env.JWT_EXPIRES.trim() !== "")
    ? (process.env.JWT_EXPIRES as unknown as SignOptions["expiresIn"])
    : "8h";
