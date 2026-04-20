"use client";
import { createClient } from "@supabase/supabase-js";

// Browser-side Supabase client. Uses the publishable/anon key — safe to expose.
// Row-level security in the database protects against misuse.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anonKey) {
  // Surfacing this early in dev saves a lot of debugging later.
  // In the browser this throws on first import, making the misconfig obvious.
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — check .env.local",
  );
}

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_client) {
    _client = createClient(url, anonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return _client;
}
