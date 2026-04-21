"use client";
import { useEffect } from "react";
import { StoreProvider } from "@/lib/store";
import { ReconnectOverlay } from "@/components/ReconnectOverlay";
import { installDeepLinkHandler } from "@/lib/nativeAuth";

export function Providers({ children }: { children: React.ReactNode }) {
  // One-time: install the native-app deep-link listener. No-op on web.
  useEffect(() => {
    installDeepLinkHandler();
  }, []);

  return (
    <StoreProvider>
      {children}
      <ReconnectOverlay />
    </StoreProvider>
  );
}
