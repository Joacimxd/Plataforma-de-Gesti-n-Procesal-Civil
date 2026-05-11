import type { AxiosInstance } from "axios";
import type { User } from "@/types";

export function getProfile(api: AxiosInstance): Promise<User> {
  return api.get("/api/profile").then((r) => r.data);
}

export function updateProfile(
  api: AxiosInstance,
  data: { avatar_url?: string | null; full_name?: string | null }
): Promise<User> {
  return api.patch("/api/profile", data).then((r) => r.data);
}
