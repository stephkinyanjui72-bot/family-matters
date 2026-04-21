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

      // Route the user by URL path AFTER the session is established.
      // recovery → password-reset form. Otherwise → home.
      const isRecovery = type === "recovery" || rawUrl.includes("/auth/reset/confirm");
      const targetPath = isRecovery ? "/auth/reset/confirm" : "/";

      if (errDesc) {
        console.error("[nativeAuth] oauth error:", errDesc);
        window.dispatchEvent(new CustomEvent("native-auth-error", { detail: errDesc }));
        return;
      }

      const sb = getSupabase();
      let sessionOk = false;

      if (access_token && refresh_token) {
        console.log("[nativeAuth] setSession from implicit tokens", { type });
        const { error } = await sb.auth.setSession({ access_token, refresh_token });
        if (error) {
          console.error("[nativeAuth] setSession error:", error.message);
          window.dispatchEvent(new CustomEvent("native-auth-error", { detail: error.message }));
        } else {
          sessionOk = true;
          window.dispatchEvent(new CustomEvent("native-auth-ok"));
        }
      } else if (code) {
        console.log("[nativeAuth] exchangeCodeForSession(code)", { type });
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[nativeAuth] exchange error:", error.message);
          window.dispatchEvent(new CustomEvent("native-auth-error", { detail: error.message }));
        } else {
          sessionOk = true;
          window.dispatchEvent(new CustomEvent("native-auth-ok"));
        }
      } else {
        console.warn("[nativeAuth] callback had no code or tokens");
      }

      // Close the in-app browser overlay before navigating so the user
      // lands fully inside the WebView.
      try { await Browser.close(); } catch {}

      if (sessionOk && isRecovery) {
        // For a password-reset deep link, drop the user on the change-password
        // form regardless of where they were.
        try { window.location.replace(targetPath); } catch {}
      }
    } catch (e) {
      console.error("[nativeAuth] handler threw:", e);
      try { await Browser.close(); } catch {}
    }
  };

  App.addListener("appUrlOpen", (event) => { handle(event.url); });

  const launch = await App.getLaunchUrl();
  if (launch?.url) handle(launch.url);
}
