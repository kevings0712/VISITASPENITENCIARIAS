// src/backend/src/routes/inmates.routes.ts
import { Router } from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import {
  getMyInmatesCtrl,
  adminListInmatesCtrl,
  adminGetInmateCtrl,
  adminCreateInmateCtrl,
  adminUpdateInmateCtrl,
  adminAuthorizeUserCtrl,
  adminUnauthorizeUserCtrl,
} from "../controllers/inmates.controller";

const r = Router();

// Usuario autenticado: ver sus internos
r.get("/my", requireAuth, getMyInmatesCtrl);

// ADMIN: CRUD + autorizaciones (siempre requireAuth antes de requireAdmin)
r.get("/",               requireAuth, requireAdmin, adminListInmatesCtrl);
r.get("/:id",            requireAuth, requireAdmin, adminGetInmateCtrl);
r.post("/",              requireAuth, requireAdmin, adminCreateInmateCtrl);
r.put("/:id",            requireAuth, requireAdmin, adminUpdateInmateCtrl);
r.post("/:id/authorize", requireAuth, requireAdmin, adminAuthorizeUserCtrl);
r.delete("/:id/authorize/:userId",requireAuth, requireAdmin, adminUnauthorizeUserCtrl);

export default r;
