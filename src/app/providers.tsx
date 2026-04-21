"use client";
import { useEffect, useState } from "react";
import { StoreProvider } from "@/lib/store";
import { ReconnectOverlay } from "@/components/ReconnectOverlay";
import { installDeepLinkHandler } from "@/lib/nativeAuth";

export function Providers({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // One-time: install the native-app deep-link listener. No-op on web.
  useEffect(() => {
    installDeepLinkHandler();
    const onOk = () => {
      setToast({ kind: "ok", text: "Signed in with Google" });
      setTimeout(() => setToast(null), 3000);
    };
    const onErr = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setToast({ kind: "err", text: typeof detail === "string" ? detail : "Sign-in failed" });
      setTimeout(() => setToast(null), 6000);
    };
    window.addEventListener("native-auth-ok", onOk);
    window.addEventListener("native-auth-error", onErr as EventListener);
    return () => {
      window.removeEventListener("native-auth-ok", onOk);
      window.removeEventListener("native-auth-error", onErr as EventListener);
    };
  }, []);

  return (
    <StoreProvider>
      {children}
      <ReconnectOverlay />
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full px-4 py-2 text-sm font-bold shadow-xl pop-in ${
          toast.kind === "ok"
            ? "bg-emerald-500 text-white"
            : "bg-rose-600 text-white"
        }`}>
          {toast.kind === "ok" ? "✓ " : "✕ "}{toast.text}
        </div>
      )}
    </StoreProvider>
  );
}
