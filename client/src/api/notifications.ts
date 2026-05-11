import type { AxiosInstance } from "axios";

export function getNotifications(api: AxiosInstance): Promise<unknown[]> {
  return api.get("/api/notifications").then((r) => r.data);
}

export function markRead(api: AxiosInstance, id: string): Promise<unknown> {
  return api.patch(`/api/notifications/${id}/read`).then((r) => r.data);
}

export function markAllRead(api: AxiosInstance): Promise<unknown> {
  return api.patch("/api/notifications/read-all").then((r) => r.data);
}
