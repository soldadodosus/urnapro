import Constants from "expo-constants";

import { storage } from "@/src/utils/storage";

export type Role = "admin" | "collaborator";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Scenario = {
  factor: number;
  projected_votes: number;
  target_percentage: number;
  reaches_target: boolean;
};

export type Campaign = {
  id: string;
  name: string;
  target_votes: number;
  confirmed_votes: number;
  estimated_votes: number;
  updated_at: string;
  updated_by: string;
  scenarios: Record<"ruim" | "real" | "otimista", Scenario>;
};

const TOKEN_KEY = "urnapro.auth.token";
const configuredBase = process.env.EXPO_BACKEND_URL ?? Constants.expoConfig?.extra?.backendUrl ?? process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
const API_URL = `${configuredBase.replace(/\/$/, "")}/api`;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await storage.secureGet<string | null>(TOKEN_KEY, null);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail ?? "Não foi possível concluir a operação.");
  return body as T;
}

export const api = {
  async login(email: string, password: string): Promise<User> {
    const response = await request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await storage.secureSet(TOKEN_KEY, response.token);
    return response.user;
  },
  me: () => request<User>("/auth/me"),
  campaign: () => request<Campaign>("/campaign"),
  updateCampaign: (payload: Pick<Campaign, "target_votes" | "confirmed_votes" | "estimated_votes">) =>
    request<Campaign>("/campaign", { method: "PUT", body: JSON.stringify(payload) }),
  team: () => request<User[]>("/team"),
  createTeamMember: (payload: { name: string; email: string; password: string }) =>
    request<User>("/team", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => storage.secureRemove(TOKEN_KEY),
};