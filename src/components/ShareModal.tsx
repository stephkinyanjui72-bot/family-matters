"use client";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/context";

// Modal that surfaces platform-specific share actions. WhatsApp uses the
// universal wa.me URL (prefills the message in the app). Instagram + TikTok
// don't expose a public share URL for arbitrary links, so we copy the text
// and open the app's deeplink — the user then pastes into a DM or story.
// "Copy link" just writes the URL to the clipboard.
export function ShareModal({
  open,
  onClose,
  url,
  text,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  text: string;
}) {
  const t = useT();
  const [copiedFor, setCopiedFor] = useState<string | null>(null);
  const composed = `${text} ${url}`;

  // Reset the toast whenever the modal reopens.
  useEffect(() => {
    if (!open) setCopiedFor(null);
  }, [open]);

  if (!open) return null;

  const flash = (label: string) => {
    setCopiedFor(label);
    window.setTimeout(() => setCopiedFor(null), 3000);
  };

  const openWhatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(composed)}`, "_blank", "noopener,noreferrer");
    onClose();
  };

  const copyAndOpen = async (app: string, deeplink: string, fallback: string) => {
    try { await navigator.clipboard.writeText(composed); } catch {}
    flash(app);
    const start = Date.now();
    window.location.href = deeplink;
    window.setTimeout(() => {
      if (Date.now() - start < 2000 && !document.hidden) {
        window.open(fallback, "_blank", "noopener,noreferrer");
      }
    }, 1500);
  };

  const copyLinkOnly = async () => {
    try { await navigator.clipboard.writeText(url); } catch {}
    flash(t("share.linkCopied"));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="card-glow w-full max-w-sm flex flex-col gap-4 pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="title text-lg font-black">{t("share.title")}</h3>
          <button
            className="text-white/50 hover:text-white text-xl leading-none"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            className="share-tile text-white"
            style={{ backgroundColor: "#25D366" }}
            onClick={openWhatsapp}
          >
            <WhatsAppIcon />
            <span>WhatsApp</span>
          </button>

          <button
            className="share-tile text-white"
            style={{ background: "linear-gradient(135deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%)" }}
            onClick={() => copyAndOpen("Instagram", "instagram://library", "https://www.instagram.com/")}
          >
            <InstagramIcon />
            <span>Instagram</span>
          </button>

          <button
            className="share-tile text-white border border-white/15"
            style={{ backgroundColor: "#010101" }}
            onClick={() => copyAndOpen("TikTok", "snssdk1233://", "https://www.tiktok.com/")}
          >
            <TikTokIcon />
            <span>TikTok</span>
          </button>

          <button
            className="share-tile bg-white/10 border border-white/15 text-white hover:bg-white/15"
            onClick={copyLinkOnly}
          >
            <LinkIcon />
            <span>{t("share.copyLink")}</span>
          </button>
        </div>

        {copiedFor && (
          <p className="text-center text-[11px] text-emerald-300">
            {copiedFor === t("share.linkCopied")
              ? copiedFor
              : t("share.copyToast", { app: copiedFor })}
          </p>
        )}
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.8 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.84-.1z"/>
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}
