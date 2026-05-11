import type { AxiosInstance } from "axios";
import type { User } from "@/types";
import type { Role } from "@/types";

export function searchUsers(
  api: AxiosInstance,
  query: string,
  role?: Role
): Promise<User[]> {
  const params: { q?: string; role?: Role } = {};
  if (query) params.q = query;
  if (role) params.role = role;
  return api.get("/api/users/search", { params }).then((r) => r.data);
}
