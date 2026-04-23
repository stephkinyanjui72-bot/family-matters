"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n/context";

// Small legal + version footer for the unauthenticated / landing screens.
// Not shown in-room (game UI already owns the bottom with the Exit button).
export function Footer() {
  const t = useT();
  return (
    <footer className="pt-6 text-center text-[10px] uppercase tracking-widest text-white/30">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link href="/terms" className="hover:text-white/60 transition">{t("footer.terms")}</Link>
        <span className="text-white/20">·</span>
        <Link href="/privacy" className="hover:text-white/60 transition">{t("footer.privacy")}</Link>
        <span className="text-white/20">·</span>
        <span className="font-mono text-white/25 normal-case tracking-normal">
          build {process.env.NEXT_PUBLIC_BUILD_SHA}
        </span>
      </div>
    </footer>
  );
}
