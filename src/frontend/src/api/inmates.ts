// src/frontend/src/api/inmates.ts
import api from "./client";

/* ---------- Usuario (mis internos) ---------- */
export type MyInmate = {
  inmate_id: string;
  first_name: string;
  last_name: string;
  relation: "AUTHORIZED" | "FAMILY" | "LAWYER" | "OTHER" | string;
};

export async function getMyInmates(): Promise<MyInmate[]> {
  const r = await api.get<{ ok: boolean; items: MyInmate[] }>("/inmates/my");
  return r.items ?? [];
}

// Alias, por compatibilidad con código viejo
export const listMyInmates = getMyInmates;

/* ---------- Admin (listar todos) ---------- */
export type Inmate = {
  id: string;
  first_name: string;
  last_name: string;
  national_id: string | null;
  pavilion: string | null;
  cell: string | null;
  status: "ENABLED" | "BLOCKED";
};

export type AdminListParams = {
  q?: string;
  status?: "ENABLED" | "BLOCKED";
  page?: number;
  limit?: number;
};

export type AdminListResp = {
  ok: boolean;
  items: Inmate[];
  pagination: { page: number; limit: number; total: number };
};

export async function adminListInmates(
  params: AdminListParams = {}
): Promise<AdminListResp> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status) qs.set("status", params.status);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));

  const url = `/inmates${qs.toString() ? `?${qs.toString()}` : ""}`;
  // El backend devuelve { ok, items, pagination }
  return api.get<AdminListResp>(url);
}
