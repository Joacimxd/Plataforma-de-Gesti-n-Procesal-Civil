-- Add avatar_url to profiles (run in Supabase SQL editor if not using migrations)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
