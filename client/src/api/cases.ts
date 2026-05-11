import type { AxiosInstance } from "axios";
import type { Case, CaseStatus } from "@/types";

export function getCases(api: AxiosInstance): Promise<Case[]> {
  return api.get("/api/cases").then((r) => r.data);
}

export function getCase(api: AxiosInstance, id: string): Promise<Case> {
  return api.get(`/api/cases/${id}`).then((r) => r.data);
}

export function createCase(
  api: AxiosInstance,
  body: { title: string; description?: string | null }
): Promise<Case> {
  return api.post("/api/cases", body).then((r) => r.data);
}

export function updateCaseStatus(
  api: AxiosInstance,
  id: string,
  status: CaseStatus
): Promise<Case> {
  return api.patch(`/api/cases/${id}/status`, { status }).then((r) => r.data);
}

export function addParticipant(
  api: AxiosInstance,
  caseId: string,
  user_id: string,
  side: "PLAINTIFF" | "DEFENSE"
): Promise<unknown> {
  return api
    .post(`/api/cases/${caseId}/participants`, { user_id, side })
    .then((r) => r.data);
}
