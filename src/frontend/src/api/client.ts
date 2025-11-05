// src/frontend/src/api/client.ts
const RAW_BASE = import.meta.env.VITE_API_BASE as string; // SIN /api al final en dev/prod
const API_PREFIX = "/api";

// Normaliza base y path para evitar dobles barras y dobles /api
function buildUrl(path: string) {
  const base = RAW_BASE.replace(/\/+$/, "");     // quita / al final
  const prefix = API_PREFIX.replace(/\/+$/, ""); // deja /api (sin barra final)
  const p = (path || "").startsWith("/") ? path : `/${path}`;
  return `${base}${prefix}${p}`;                 // ej: http://:4000 + /api + /auth/login
}

async function request<T>(path: string, init: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(buildUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    // Intenta leer { message } del backend
    let msg = "";
    try {
      const data = await res.json();
      msg = (data as any)?.message || "";
    } catch {
      // si no vino JSON, seguimos con fallbacks
    }

    // Fallbacks por código si no hubo message
    if (!msg) {
      if (res.status === 401) msg = "Credenciales inválidas";
      else if (res.status === 404) msg = "Servicio no encontrado";
      else if (res.status === 409) msg = "Ya existe un registro con esos datos";
      else msg = res.statusText || `HTTP ${res.status}`;
    }

    throw new Error(msg);
  }

  return (await res.json()) as T;
}

export const api = {
  get:  <T>(path: string) =>
    request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),

  put:  <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),

  // 👇 NUEVO
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),

  del:  <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};

export default api;
