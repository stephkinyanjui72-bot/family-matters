"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [platform, setPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    if (typeof navigator !== "undefined") setPlatform(detectPlatform(navigator.userAgent));
  }, []);

  return (
    <main className="min-h-screen max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <header className="flex items-center justify-between pop-in">
        <Link href="/" className="text-white/60 text-sm hover:text-white">← Back</Link>
        <span className="chip border-white/15 text-white/60">Install</span>
      </header>

      <div className="text-center pop-in">
        <div className="text-6xl mb-2 float-slow">📲</div>
        <h1 className="title text-4xl font-black holo-text">Get the App</h1>
        <p className="text-white/60 mt-2 text-sm">One tap install · works offline once loaded · no account needed to join</p>
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

      <section className="card">
        <h3 className="font-bold mb-2">Why no Play Store?</h3>
        <p className="text-sm text-white/70 leading-relaxed">
          Family Matters has adult content in the Chaos tier, and Google Play doesn't allow that. Sideloading the APK keeps the full game intact — no watered-down version.
        </p>
      </section>

      <footer className="text-center text-white/40 text-xs uppercase tracking-widest mt-auto pt-6">
        <Link href="/" className="hover:text-white">family-matters</Link>
      </footer>
    </main>
  );
}

function AndroidInstall() {
  return (
    <section className="card-glow flex flex-col gap-4 pop-in">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-flame font-bold">Android</div>
        <h2 className="title text-2xl font-black">Install on your phone</h2>
      </div>
      <a
        href={APK_DOWNLOAD}
        className="btn-primary text-xl h-16 text-center"
      >
        ⬇ Download APK
      </a>

      <ol className="flex flex-col gap-3 text-sm text-white/80">
        <Step n={1} title="Tap Download APK above">
          Your browser downloads <code className="text-flame">family-matters.apk</code>.
          If a warning asks "Keep anyway?" — tap <b>Keep</b>.
        </Step>
        <Step n={2} title="Open the downloaded file">
          Pull down your notification shade and tap the download, or open your Files app and tap <code className="text-flame">family-matters.apk</code>.
        </Step>
        <Step n={3} title="Allow install from this source">
          Android blocks installs from outside the Play Store by default.
          On the popup, tap <b>Settings</b> → toggle <b>Allow from this source</b> <b>ON</b> → tap the back arrow.
        </Step>
        <Step n={4} title="Install">
          Tap <b>Install</b>. When it says "App installed", tap <b>Open</b>.
        </Step>
      </ol>

      <p className="text-xs text-white/40">
        Don't see a download button? Check our <a className="underline hover:text-white" href={RELEASES_LATEST} target="_blank" rel="noopener noreferrer">GitHub Releases</a> page.
      </p>
    </section>
  );
}

function IOSInstall() {
  return (
    <section className="card-glow flex flex-col gap-4 pop-in">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-cyber font-bold">iPhone / iPad</div>
        <h2 className="title text-2xl font-black">Add to Home Screen</h2>
      </div>
      <p className="text-sm text-white/80">
        iOS doesn't allow APKs. Use the web app — it works just like a native app when added to your home screen.
      </p>
      <ol className="flex flex-col gap-3 text-sm text-white/80">
        <Step n={1} title="Open the site in Safari">
          <b>Must be Safari</b>, not Chrome. Visit <code className="text-flame">family-matters-taupe.vercel.app</code>.
        </Step>
        <Step n={2} title="Tap the Share icon">
          The square with an up-arrow, at the bottom-center of Safari.
        </Step>
        <Step n={3} title="Add to Home Screen">
          Scroll the share sheet. Tap <b>Add to Home Screen</b> → <b>Add</b>.
        </Step>
        <Step n={4} title="Launch from home screen">
          The icon opens the app fullscreen — no browser bars.
        </Step>
      </ol>
    </section>
  );
}

function DesktopInstall() {
  return (
    <section className="card-glow flex flex-col gap-4 pop-in">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-neon font-bold">Desktop</div>
        <h2 className="title text-2xl font-black">Play in your browser</h2>
      </div>
      <p className="text-sm text-white/80">
        Desktop doesn't need an install — just host a room and let your friends scan the QR.
      </p>
      <Link href="/" className="btn-primary text-lg h-14 text-center">🎉 Start a Party</Link>
      <p className="text-xs text-white/50">
        On Chrome / Edge, an <b>Install</b> icon in the address bar turns it into a desktop app window.
      </p>
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 rounded-full w-7 h-7 bg-gradient-to-br from-flame to-ember flex items-center justify-center text-sm font-black">{n}</span>
      <div>
        <div className="font-bold text-white">{title}</div>
        <div className="text-white/70 mt-0.5">{children}</div>
      </div>
    </li>
  );
}
