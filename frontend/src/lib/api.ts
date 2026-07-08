import type { Application } from "@/lib/mock-data";
import { getIncomingCookieHeader } from "@/lib/ssr-cookie";
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const cookie = getIncomingCookieHeader();
  if (cookie) headers.cookie = cookie;

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string> | undefined) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export interface User {
  id: string;
  email: string;
  name: string;
  hasPassword: boolean;
  gmailConnected: boolean;
  ghostedThresholdDays: number;
  createdAt: string;
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; name: string }) =>
      request<{ user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      request<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

    logout: () =>
      request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

    me: () =>
      request<User>("/api/auth/me"),

    googleUrl: () => `${BASE}/api/auth/google`,
  },

  gmail: {
    connectUrl: () => `${BASE}/api/gmail/connect`,
    disconnect: () =>
      request<{ ok: boolean }>("/api/gmail/disconnect", { method: "DELETE" }),
  },

  users: {
    updateMe: (body: { name?: string; ghostedThresholdDays?: number }) =>
      request<User>("/api/users/me", { method: "PATCH", body: JSON.stringify(body) }),

    changePassword: (body: { currentPassword?: string; newPassword: string }) =>
      request<{ ok: boolean }>("/api/users/me/password", { method: "PATCH", body: JSON.stringify(body) }),

    deleteMe: () =>
      request<{ ok: boolean }>("/api/users/me", { method: "DELETE" }),
  },
  
  applications: {
    list: (params?: { search?: string; stage?: string }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.stage && params.stage !== "all") qs.set("stage", params.stage);
      return request<Application[]>(`/api/applications?${qs}`);
    },

    create: (body: {
      company: string;
      position: string;
      location?: string;
      stage?: string;
      salary?: string;
      notes?: string;
    }) =>
      request<Application>("/api/applications", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    update: (id: string, body: Partial<Application>) =>
      request<Application>(`/api/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),

    remove: (id: string) =>
      request<{ ok: boolean }>(`/api/applications/${id}`, {
        method: "DELETE",
      }),
  },
};
