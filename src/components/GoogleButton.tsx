"use client";
import { useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { isNativeApp } from "@/lib/platform";
import { NATIVE_CALLBACK } from "@/lib/nativeAuth";
import { useT } from "@/lib/i18n/context";

// "Continue with Google" button.
//
// On web: Supabase redirects the browser → Google → Supabase → /auth/callback.
// In the native Android app (Capacitor WebView): Google blocks embedded
// WebViews, so we open a Chrome Custom Tab, let Google do its thing, and
// Supabase redirects to our custom URL scheme (com.familymatters.party://…).
// Android hands that off to the app, and the deep-link handler in
// nativeAuth.ts reads the session tokens out of the URL.
export function GoogleButton({ redirectTo = "/" }: { redirectTo?: string }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setErr(null);
    const sb = getSupabase();

    if (isNativeApp()) {
      // Build the OAuth URL but don't navigate the WebView. We'll open it
      // in a Chrome Custom Tab via the Browser plugin.
      const { data, error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: NATIVE_CALLBACK, skipBrowserRedirect: true },
      });
      if (error || !data?.url) {
        setBusy(false);
        return setErr(error?.message || "Could not start Google sign-in");
      }
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: data.url });
      // The listener in nativeAuth.ts will close the browser + set the
      // session when the deep link comes back. Leave busy=false cleanup
      // to the listener (it doesn't have a ref to this state).
      setBusy(false);
      return;
    }

    // Web flow
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      setBusy(false);
      setErr(error.message);
    }
    // Successful web flow navigates away; no need to clear busy.
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-3 rounded-xl py-3 px-4 font-bold bg-white text-slate-800 border border-white/40 hover:brightness-95 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
        <span>{busy ? t("common.loading") : t("auth.continueWithGoogle")}</span>
      </button>
      {err && <p className="text-rose-400 text-xs mt-1">{err}</p>}
    </>
  );
}
