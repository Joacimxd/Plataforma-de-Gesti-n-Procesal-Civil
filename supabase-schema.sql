-- ============================================================
-- Plataforma de Gestión Procesal Civil - Supabase Schema
-- Run this entire script in the Supabase SQL Editor.
-- This uses a CUSTOM users table (NOT auth.users) so the
-- backend handles auth via its own token system.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('JUDGE', 'PLAINTIFF_LAWYER', 'DEFENSE_LAWYER')) DEFAULT 'PLAINTIFF_LAWYER',
  avatar_url  TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. CASES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')),
  judge_id    UUID NOT NULL REFERENCES public.users(id),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. CASE PARTICIPANTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.case_participants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id    UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id),
  side       TEXT NOT NULL CHECK (side IN ('PLAINTIFF', 'DEFENSE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(case_id, side)
);

-- ============================================================
-- 4. DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('DEMAND', 'RESPONSE', 'MOTION', 'EVIDENCE', 'ORDER', 'SENTENCE')),
  file_url    TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. CASE EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.case_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  description TEXT,
  created_by  UUID NOT NULL REFERENCES public.users(id),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 6. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  case_id    UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cases_judge_id ON public.cases(judge_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_case_participants_case_id ON public.case_participants(case_id);
CREATE INDEX IF NOT EXISTS idx_case_participants_user_id ON public.case_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_case_id ON public.case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- Since we use service_role key in the backend, all RLS
-- is bypassed. We still enable it as a security best practice,
-- but all access goes through authenticated backend only.
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically.
-- No anon/authenticated client policies needed since all
-- access goes through the backend with service_role.

-- ============================================================
-- 9. STORAGE BUCKET FOR DOCUMENTS
-- Run this separately OR create via Supabase dashboard:
--   Bucket name: documents
--   Public: true (for direct URL access)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documents', 'documents', true)
-- ON CONFLICT (id) DO NOTHING;
