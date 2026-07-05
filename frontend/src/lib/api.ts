const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export interface User {
  id: string;
  email: string;
  name: string;
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

  users: {
    updateMe: (body: { name?: string; ghostedThresholdDays?: number }) =>
      request<User>("/api/users/me", { method: "PATCH", body: JSON.stringify(body) }),

    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      request<{ ok: boolean }>("/api/users/me/password", { method: "PATCH", body: JSON.stringify(body) }),

    deleteMe: () =>
      request<{ ok: boolean }>("/api/users/me", { method: "DELETE" }),
  },
};
