import { Router } from "express";

import authRoutes from "./auth.routes";
import healthRoutes from "./health.routes";
import visitsRoutes from "./visits.routes";
import notificationsRoutes from "./notifications.routes";
import inmatesRoutes from "./inmates.routes";
import userInmatesRoutes from "./user-inmates.routes";

const r = Router();

// públicos/diagnóstico
r.use("/health", healthRoutes);

// auth
r.use("/auth", authRoutes);

// app
r.use("/visits", visitsRoutes);
r.use("/notifications", notificationsRoutes);

// NUEVO
r.use("/inmates", inmatesRoutes);
r.use("/user-inmates", userInmatesRoutes);

export default r;
