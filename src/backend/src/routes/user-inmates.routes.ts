// src/backend/src/routes/user-inmates.routes.ts
import { Router } from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import * as ctrl from "../controllers/userInmates.controller";

const r = Router();

// El propio usuario ve sus internos autorizados
r.get("/me", requireAuth, ctrl.listMe);

// Admin crea/elimina vínculos usuario <-> interno
r.post("/", requireAdmin, ctrl.linkUser);
r.delete("/", requireAdmin, ctrl.unlinkUser);

export default r;
