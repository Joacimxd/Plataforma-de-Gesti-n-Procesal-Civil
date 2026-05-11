import type { AxiosInstance } from "axios";
import type { CaseDocument } from "@/types";

export function getDocuments(
  api: AxiosInstance,
  caseId: string
): Promise<CaseDocument[]> {
  return api.get(`/api/cases/${caseId}/documents`).then((r) => r.data);
}

export function uploadDocument(
  api: AxiosInstance,
  caseId: string,
  formData: FormData
): Promise<CaseDocument> {
  return api
    .post(`/api/cases/${caseId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
}
