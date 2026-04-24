"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/context";

// The APK lives on GitHub Releases. /releases/latest/download/<filename>
// redirects to whichever release is newest — re-upload with the same
// filename and every /download visitor gets the new APK, no code change.
// Repo must be PUBLIC for these URLs to work without login.
const GITHUB_OWNER = "stephkinyanjui72-bot";
const GITHUB_REPO = "family-matters";
const APK_FILENAME = "app-debug.apk";
const APK_DOWNLOAD = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest/download/${APK_FILENAME}`;
const RELEASES_LATEST = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

type Platform = "android" | "ios" | "desktop" | "unknown";

function detectPlatform(ua: string): Platform {
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/windows|macintosh|linux/i.test(ua)) return "desktop";
  return "unknown";
}

export default function DownloadPage() {
  const t = useT();
  const [platform, setPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    if (typeof navigator !== "undefined") setPlatform(detectPlatform(navigator.userAgent));
  }, []);

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 py-5 sm:p-6 flex flex-col gap-4 sm:gap-6">
      <header className="flex items-center justify-between pop-in">
        <Link href="/" className="text-white/60 text-sm hover:text-white">← {t("common.back")}</Link>
        <span className="chip border-white/15 text-white/60">{t("download.chip")}</span>
      </header>

      <div className="text-center pop-in">
        <div className="text-5xl sm:text-6xl mb-2 float-slow">📲</div>
        <h1 className="title text-3xl sm:text-4xl font-black holo-text">{t("download.title")}</h1>
        <p className="text-white/60 mt-2 text-xs sm:text-sm leading-snug px-2">{t("download.subtitle")}</p>
      </div>

      {platform === "android" && <AndroidInstall />}
      {platform === "ios" && <IOSInstall />}
      {platform === "desktop" && <DesktopInstall />}
      {platform === "unknown" && (
        <>
          <AndroidInstall />
          <IOSInstall />
        </>
      )}

      <section className="card !p-4 sm:!p-6">
        <h3 className="font-bold mb-2 text-sm sm:text-base">{t("download.whyNoPlayStore")}</h3>
        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
          {t("download.playStoreBody")}
        </p>
      </section>

      <footer className="text-center text-white/40 text-[10px] sm:text-xs uppercase tracking-widest mt-auto pt-4 sm:pt-6">
        <Link href="/" className="hover:text-white">party-mate</Link>
      </footer>
    </main>
  );
}

function AndroidInstall() {
  const t = useT();
  return (
    <section className="card-glow !p-4 sm:!p-6 flex flex-col gap-3 sm:gap-4 pop-in">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-flame font-bold">{t("download.androidKicker")}</div>
        <h2 className="title text-xl sm:text-2xl font-black leading-tight">{t("download.androidTitle")}</h2>
      </div>
      <a
        href={APK_DOWNLOAD}
        className="btn-primary text-base sm:text-xl h-14 sm:h-16 text-center"
      >
        {t("download.downloadApk")}
      </a>

      <ol className="flex flex-col gap-3 text-xs sm:text-sm text-white/80">
        <Step n={1} title={t("download.step1Title")}>{t("download.step1Body")}</Step>
        <Step n={2} title={t("download.step2Title")}>{t("download.step2Body")}</Step>
        <Step n={3} title={t("download.step3Title")}>{t("download.step3Body")}</Step>
        <Step n={4} title={t("download.step4Title")}>{t("download.step4Body")}</Step>
      </ol>

      <p className="text-[11px] sm:text-xs text-white/40">
        {t("download.releasesHint").split("GitHub Releases")[0]}
        <a className="underline hover:text-white" href={RELEASES_LATEST} target="_blank" rel="noopener noreferrer">GitHub Releases</a>
        {t("download.releasesHint").split("GitHub Releases")[1] || ""}
      </p>
    </section>
  );
}

function IOSInstall() {
  const t = useT();
  return (
    <section className="card-glow !p-4 sm:!p-6 flex flex-col gap-3 sm:gap-4 pop-in">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-cyber font-bold">{t("download.iosKicker")}</div>
        <h2 className="title text-xl sm:text-2xl font-black leading-tight">{t("download.iosTitle")}</h2>
      </div>
      <p className="text-xs sm:text-sm text-white/80 leading-snug">
        {t("download.iosIntro")}
      </p>
      <ol className="flex flex-col gap-3 text-xs sm:text-sm text-white/80">
        <Step n={1} title={t("download.iosStep1Title")}>
          {t("download.iosStep1Body")} <code className="text-flame break-all">family-matters-taupe.vercel.app</code>
        </Step>
        <Step n={2} title={t("download.iosStep2Title")}>{t("download.iosStep2Body")}</Step>
        <Step n={3} title={t("download.iosStep3Title")}>{t("download.iosStep3Body")}</Step>
        <Step n={4} title={t("download.iosStep4Title")}>{t("download.iosStep4Body")}</Step>
      </ol>
    </section>
  );
}

function DesktopInstall() {
  const t = useT();
  return (
    <section className="card-glow !p-4 sm:!p-6 flex flex-col gap-3 sm:gap-4 pop-in">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-neon font-bold">{t("download.desktopKicker")}</div>
        <h2 className="title text-xl sm:text-2xl font-black leading-tight">{t("download.desktopTitle")}</h2>
      </div>
      <p className="text-xs sm:text-sm text-white/80 leading-snug">
        {t("download.desktopBody")}
      </p>
      <Link href="/" className="btn-primary text-base sm:text-lg h-14 text-center">{t("download.startParty")}</Link>
      <p className="text-[11px] sm:text-xs text-white/50 leading-snug">
        {t("download.desktopHint")}
      </p>
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 sm:gap-3">
      <span className="shrink-0 rounded-full w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-flame to-ember flex items-center justify-center text-xs sm:text-sm font-black">{n}</span>
      <div className="min-w-0">
        <div className="font-bold text-white text-sm sm:text-base leading-tight">{title}</div>
        <div className="text-white/70 mt-1 leading-snug">{children}</div>
      </div>
    </li>
  );
}
