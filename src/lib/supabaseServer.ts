import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client. Uses the SECRET service_role key — bypasses RLS.
// Only import this from API routes / server code. Never ship to the browser.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !secretKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — check .env.local / Vercel env",
  );
}

export function getAdminSupabase() {
  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
