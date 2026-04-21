"use client";
// Handles native deep-link OAuth completion. When Supabase redirects
// to our custom scheme (com.familymatters.party://auth/callback) with
// access + refresh tokens in the URL fragment, Android routes it to
// the app, we parse the tokens, and hand them to Supabase so the
// WebView becomes authenticated.

import { isNativeApp } from "./platform";
import { getSupabase } from "./supabaseClient";

export const NATIVE_CALLBACK = "com.familymatters.party://auth/callback";

let installed = false;

export async function installDeepLinkHandler() {
  if (installed || !isNativeApp()) return;
  installed = true;

  // Dynamic import so the web bundle doesn't try to pull in native plugins.
  const { App } = await import("@capacitor/app");
  const { Browser } = await import("@capacitor/browser");

  const handle = async (rawUrl: string) => {
    try {
      if (!rawUrl || !rawUrl.startsWith("com.familymatters.party://")) return;
      // Fragment is the OAuth payload: #access_token=…&refresh_token=…
      const hashIdx = rawUrl.indexOf("#");
      const queryIdx = rawUrl.indexOf("?");
      const frag = hashIdx >= 0 ? rawUrl.slice(hashIdx + 1) : "";
      const query = queryIdx >= 0 && (hashIdx < 0 || queryIdx < hashIdx) ? rawUrl.slice(queryIdx + 1, hashIdx >= 0 ? hashIdx : undefined) : "";
      const params = new URLSearchParams(frag || query);
      const access_token = params.get("access_token") || "";
      const refresh_token = params.get("refresh_token") || "";
      const code = params.get("code") || "";
      const sb = getSupabase();
      if (access_token && refresh_token) {
        await sb.auth.setSession({ access_token, refresh_token });
      } else if (code) {
        await sb.auth.exchangeCodeForSession(rawUrl);
      }
    } finally {
      try { await Browser.close(); } catch {}
    }
  };

  // Deep link arriving while app is already running
  App.addListener("appUrlOpen", (event) => { handle(event.url); });

  // Cold-start deep link — app was launched via the URL directly
  const launch = await App.getLaunchUrl();
  if (launch?.url) handle(launch.url);
}
