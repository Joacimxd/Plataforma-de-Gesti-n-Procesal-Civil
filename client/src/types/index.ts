export type Role = "JUDGE" | "PLAINTIFF_LAWYER" | "DEFENSE_LAWYER";
export type CaseStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type ParticipantSide = "PLAINTIFF" | "DEFENSE";
export type DocumentType =
  | "DEMAND"
  | "RESPONSE"
  | "MOTION"
  | "EVIDENCE"
  | "ORDER"
  | "SENTENCE";

export interface Profile {
  id: string;
  full_name: string | null;
  role: Role;
  avatar_url?: string | null;
  created_at: string;
}

export interface User extends Profile {
  email: string;
}

export interface CaseParticipant {
  id: string;
  case_id: string;
  user_id: string;
  side: ParticipantSide;
  user?: { id: string; full_name: string | null };
}

export interface Case {
  id: string;
  title: string;
  description: string | null;
  status: CaseStatus;
  judge_id: string;
  judge?: Profile;
  participants?: CaseParticipant[];
  created_at: string;
  updated_at?: string;
}

export interface CaseDocument {
  id: string;
  case_id: string;
  title: string;
  type: DocumentType;
  file_url: string;
  uploaded_by: string;
  uploader?: Profile;
  created_at: string;
}

export interface CaseEvent {
  id: string;
  case_id: string;
  event_type: string;
  description: string | null;
  created_at: string;
}

export type GetTokenFn = () => Promise<string | undefined>;
