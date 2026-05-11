# Authentication & User Architecture (Supabase Best Practices)

## Summary

- **Supabase Auth (`auth.users`)** is the only source of truth for authentication (identity, email, password/session).
- **`public.profiles`** holds only extended app data (e.g. `full_name`, `role`); it references `auth.users(id)` and is created automatically on signup.
- No duplicate email/password in app tables; no custom login logic; session and redirect behavior are consistent and safe.

---

## 1. Authentication Source of Truth

- **Authority**: Only Supabase Auth is used to sign in, sign up, and manage sessions. Passwords and tokens are handled solely by Supabase.
- **Removed**: Custom `users` table that duplicated email and mixed auth with app data. Any logic that depended on a custom users table for “is this user logged in?” has been removed.
- **Result**: Login state is determined only by `supabase.auth.getSession()` and `onAuthStateChange`. No “user record not found” due to missing rows in a custom table.

---

## 2. User Data Architecture

- **`public.profiles`**:
  - **`id`**: `uuid` primary key, same as `auth.users(id)`, with `REFERENCES auth.users(id) ON DELETE CASCADE`.
  - **Extra fields only**: e.g. `full_name`, `role`, `created_at`. No `email` or `password`.
- **Other tables** (cases, case_participants, documents, case_events, notifications) reference `profiles(id)` (i.e. the auth user id), not a separate users table.
- **Email**: Comes only from the session (`session.user.email`) and is merged into the app’s “user” object in the client; it is not stored in `profiles`.

---

## 3. Registration Flow

- **Client**: Calls only `supabase.auth.signUp({ email, password, options: { data: { full_name, role } } })`. No separate API call to create a “user” row.
- **Backend**: A database trigger on `auth.users` (after insert) creates the corresponding row in `public.profiles` using `NEW.raw_user_meta_data` (`full_name`, `role`), with `ON CONFLICT (id) DO NOTHING` to avoid duplicates.
- **Failure handling**: If the trigger fails, the user exists in Auth but may have no profile; the server returns a clear error (“Profile not found; complete registration or sign in again”) so the flow can be fixed (e.g. retry or support tooling).

---

## 4. AuthContext Refactor

- **Session**: Uses `supabase.auth.getSession()` on mount and `supabase.auth.onAuthStateChange()` for updates. Session is persisted by Supabase (e.g. local storage).
- **Profile**: When a session exists, the context fetches the row from `public.profiles` for `session.user.id` and merges auth user + profile into a single `user` state (e.g. `id`, `email` from auth; `full_name`, `role` from profile).
- **Redirects**: No navigation during render. Redirects after login/register or when already logged in are done in `useEffect` based on `user` and `loading`.
- **Loading**: A single `loading` flag is set until the initial session check is done, so protected routes don’t redirect before auth is known.

---

## 5. Route Protection

- **PrivateRoute** (or equivalent):
  - Waits until auth loading is finished (`loading === false`).
  - Renders protected content only when `user` is non-null.
  - Redirects to login only when loading is done and `user` is definitively null (no premature redirect).

---

## 6. Security

- **RLS on `profiles`**:
  - **SELECT**: `auth.uid() = id` (users read only their own row).
  - **UPDATE**: `auth.uid() = id` (users update only their own row).
  - **INSERT**: Not exposed to client; only the trigger (with `SECURITY DEFINER`) inserts rows, so no public insert and no duplicate profiles from the client.
- **Service role**: Used only on the backend (e.g. Express). Never used in frontend code. Frontend uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## 7. Environment Variables

- **Frontend** (e.g. `.env`):
  - `VITE_SUPABASE_URL`: Supabase project URL.
  - `VITE_SUPABASE_ANON_KEY`: Supabase anon (public) key.
- **Backend** (e.g. `server/.env`):
  - `SUPABASE_URL`: Same project URL.
  - `SUPABASE_SERVICE_ROLE_KEY`: Server-only; must never be exposed to the frontend.

---

## 8. Cleanup Done

- **Removed**: Custom `users` table and any auth logic that depended on it; redundant registration endpoint that duplicated profile creation.
- **Removed**: Redirects or other navigation side effects from render; they are done in `useEffect` only.
- **Result**: Single auth source (Supabase Auth), one profile table, clear session + profile merge, and RLS on profiles, ready to extend (e.g. for future AI or extra profile fields).
