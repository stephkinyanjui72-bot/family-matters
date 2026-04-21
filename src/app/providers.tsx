"use client";
import { StoreProvider } from "@/lib/store";
import { ReconnectOverlay } from "@/components/ReconnectOverlay";
import { PartyBg } from "@/components/PartyBg";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <PartyBg />
      {children}
      <ReconnectOverlay />
    </StoreProvider>
  );
}
