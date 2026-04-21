"use client";
// Handles native deep-link OAuth completion. When Supabase redirects
// to our custom scheme (com.familymatters.party://auth/callback) with
// a session code (PKCE) or access+refresh tokens (implicit), Android
// routes that URL to the app; this handler reads the payload and hands
// it to Supabase so the WebView becomes authenticated.

import { isNativeApp } from "./platform";
import { getSupabase } from "./supabaseClient";

export const NATIVE_SCHEME = "com.familymatters.party";
export const NATIVE_CALLBACK = `${NATIVE_SCHEME}://auth/callback`;

let installed = false;

// Pull both ?query and #fragment params into a single URLSearchParams.
function extractParams(rawUrl: string): URLSearchParams {
  // Replace our custom scheme with a dummy https so URL() can parse it.
  const normalized = rawUrl.replace(/^com\.familymatters\.party:\/\//, "https://_native/");
  const u = new URL(normalized);
  const params = new URLSearchParams(u.search);
  if (u.hash) {
    const frag = new URLSearchParams(u.hash.replace(/^#/, ""));
    frag.forEach((v, k) => params.set(k, v));
  }
  return params;
}

export async function installDeepLinkHandler() {
  if (installed || !isNativeApp()) return;
  installed = true;

  const { App } = await import("@capacitor/app");
  const { Browser } = await import("@capacitor/browser");

  const handle = async (rawUrl: string) => {
    // Log so these show up under Chrome's chrome://inspect WebView panel.
    console.log("[nativeAuth] appUrlOpen:", rawUrl);
    if (!rawUrl || !rawUrl.startsWith(`${NATIVE_SCHEME}://`)) return;

    try {
      const params = extractParams(rawUrl);
      const access_token = params.get("access_token") || "";
      const refresh_token = params.get("refresh_token") || "";
      const code = params.get("code") || "";
      const type = params.get("type") || "";
      const errDesc = params.get("error_description") || params.get("error") || "";

      const isRecovery = type === "recovery" || rawUrl.includes("/auth/reset/confirm");

      if (errDesc) {
        console.error("[nativeAuth] oauth error:", errDesc);
        window.dispatchEvent(new CustomEvent("native-auth-error", { detail: errDesc }));
        try { await Browser.close(); } catch {}
        return;
      }

      // RECOVERY flow: don't setSession here — the recovery access-token
      // has a narrow scope and Supabase's updateUser call needs it to be
      // the active session at the moment of the click. Forward the hash
      // to the reset-confirm page which does setSession + updateUser
      // in the same render cycle.
      if (isRecovery) {
        console.log("[nativeAuth] recovery — forwarding hash to reset page");
        try { await Browser.close(); } catch {}
        const hashIdx = rawUrl.indexOf("#");
        const hash = hashIdx >= 0 ? rawUrl.slice(hashIdx) : "";
        try { window.location.replace(`/auth/reset/confirm${hash}`); } catch {}
        return;
      }

      // OAUTH / signup-confirm flow: set the session directly.
      const sb = getSupabase();

      if (access_token && refresh_token) {
        console.log("[nativeAuth] setSession from implicit tokens", { type });
        const { error } = await sb.auth.setSession({ access_token, refresh_token });
        if (error) {
          console.error("[nativeAuth] setSession error:", error.message);
          window.dispatchEvent(new CustomEvent("native-auth-error", { detail: error.message }));
        } else {
          window.dispatchEvent(new CustomEvent("native-auth-ok"));
        }
      } else if (code) {
        console.log("[nativeAuth] exchangeCodeForSession(code)", { type });
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[nativeAuth] exchange error:", error.message);
          window.dispatchEvent(new CustomEvent("native-auth-error", { detail: error.message }));
        } else {
          window.dispatchEvent(new CustomEvent("native-auth-ok"));
        }
      } else {
        console.warn("[nativeAuth] callback had no code or tokens");
      }

      try { await Browser.close(); } catch {}
    } catch (e) {
      console.error("[nativeAuth] handler threw:", e);
      try { await Browser.close(); } catch {}
    }
  };

  App.addListener("appUrlOpen", (event) => { handle(event.url); });

  const launch = await App.getLaunchUrl();
  if (launch?.url) handle(launch.url);
}
