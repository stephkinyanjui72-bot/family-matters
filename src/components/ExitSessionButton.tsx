"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n/context";

// Floating bottom-right "Exit" button with a confirm dialog. Always visible
// once the user is in a room — works in the lobby and during gameplay.
export function ExitSessionButton() {
  const router = useRouter();
  const t = useT();
  const { room, leaveRoom } = useStore();
  const [confirming, setConfirming] = useState(false);

  if (!room) return null;

  return (
    <>
      <button
        aria-label={t("room.exitSession")}
        onClick={() => setConfirming(true)}
        className="fixed bottom-5 right-5 z-30 btn-ghost !px-4 !py-3 !text-sm flex items-center gap-2 shadow-xl shadow-black/50"
      >
        🚪 <span className="font-bold">{t("room.leave")}</span>
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md"
          onClick={() => setConfirming(false)}
        >
          <div
            className="card-glow max-w-sm w-full flex flex-col gap-4 pop-in border-rose-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">🚪</div>
              <h3 className="title text-2xl font-black">{t("room.exitConfirm")}</h3>
              <p className="text-white/60 text-sm mt-2 font-mono">{room.code}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn-ghost"
                onClick={() => setConfirming(false)}
              >
                {t("common.cancel")}
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  leaveRoom();
                  router.replace("/");
                }}
              >
                {t("room.leave")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
