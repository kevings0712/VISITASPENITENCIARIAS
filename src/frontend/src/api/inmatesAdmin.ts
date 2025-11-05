// src/frontend/src/api/inmatesAdmin.ts
import api from "./client";

export type AdminInmate = {
  id: string;
  first_name: string;
  last_name: string;
  national_id: string | null;
  birth_date: string | null;
  pavilion: string | null;
  cell: string | null;
  status: "ENABLED" | "BLOCKED" | string;
  created_at: string;
};

export type AdminListResp = {
  ok: boolean;
  items: AdminInmate[];
  pagination: { page: number; limit: number; total: number };
};

export async function adminListInmates(opts?: {
  q?: string;
  status?: "ENABLED" | "BLOCKED";
  page?: number;
  limit?: number;
}): Promise<AdminListResp> {
  const p = new URLSearchParams();
  if (opts?.q) p.set("q", opts.q);
  if (opts?.status) p.set("status", opts.status);
  if (opts?.page) p.set("page", String(opts.page));
  if (opts?.limit) p.set("limit", String(opts.limit));

  const path = `/inmates${p.toString() ? `?${p.toString()}` : ""}`;
  return api.get<AdminListResp>(path);
}
