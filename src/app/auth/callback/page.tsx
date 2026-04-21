"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

// Supabase OAuth lands here with either a `code` query param (PKCE) or a
// hash fragment (implicit). The JS client auto-handles the fragment; we
// explicitly exchange the code if present. Then we bounce to `next`.
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center text-white/60">Signing you in…</main>}>
      <Callback />
    </Suspense>
  );
}

function Callback() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  useEffect(() => {
    const sb = getSupabase();
    const code = params.get("code");
    const finish = async () => {
      if (code) {
        await sb.auth.exchangeCodeForSession(window.location.href).catch(() => {});
      }
      // Auth state will update via onAuthStateChange in the store; nudge.
      router.replace(next);
    };
    finish();
  }, [params, next, router]);

  return (
    <main className="min-h-screen flex items-center justify-center text-white/60">
      Signing you in…
    </main>
  );
}
