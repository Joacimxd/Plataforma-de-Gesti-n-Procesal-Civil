import type { AxiosInstance } from "axios";
import type { CaseEvent } from "@/types";

export function getEvents(
  api: AxiosInstance,
  caseId: string
): Promise<CaseEvent[]> {
  return api.get(`/api/cases/${caseId}/events`).then((r) => r.data);
}
