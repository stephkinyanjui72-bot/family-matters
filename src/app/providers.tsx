"use client";
import { StoreProvider } from "@/lib/store";
import { ReconnectOverlay } from "@/components/ReconnectOverlay";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      {children}
      <ReconnectOverlay />
    </StoreProvider>
  );
}
