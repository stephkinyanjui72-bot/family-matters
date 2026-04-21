/* eslint-disable */
// One-shot script: convert public/icon.svg and public/icon-foreground.svg
// into all the Android mipmap PNGs the launcher needs.
//
//   node scripts/generate-android-icons.js
//
// Writes to android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/*.png

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const ANDROID_RES = path.join(ROOT, "android", "app", "src", "main", "res");
const FULL_SVG = path.join(ROOT, "public", "icon.svg");
const FOREGROUND_SVG = path.join(ROOT, "public", "icon-foreground.svg");

// Legacy launcher icon sizes (square PNG used on Android < 8).
const LEGACY = [
  { dir: "mipmap-mdpi",    px: 48 },
  { dir: "mipmap-hdpi",    px: 72 },
  { dir: "mipmap-xhdpi",   px: 96 },
  { dir: "mipmap-xxhdpi",  px: 144 },
  { dir: "mipmap-xxxhdpi", px: 192 },
];

// Adaptive icon foreground sizes (108dp canvas) — used on Android 8+.
const FOREGROUND = [
  { dir: "mipmap-mdpi",    px: 108 },
  { dir: "mipmap-hdpi",    px: 162 },
  { dir: "mipmap-xhdpi",   px: 216 },
  { dir: "mipmap-xxhdpi",  px: 324 },
  { dir: "mipmap-xxxhdpi", px: 432 },
];

async function main() {
  for (const { dir, px } of LEGACY) {
    const outFull = path.join(ANDROID_RES, dir, "ic_launcher.png");
    const outRound = path.join(ANDROID_RES, dir, "ic_launcher_round.png");
    const buf = await sharp(FULL_SVG).resize(px, px).png().toBuffer();
    fs.writeFileSync(outFull, buf);
    fs.writeFileSync(outRound, buf);
    console.log(`  wrote ${dir}/ic_launcher.png + _round.png (${px}px)`);
  }
  for (const { dir, px } of FOREGROUND) {
    const out = path.join(ANDROID_RES, dir, "ic_launcher_foreground.png");
    const buf = await sharp(FOREGROUND_SVG).resize(px, px).png().toBuffer();
    fs.writeFileSync(out, buf);
    console.log(`  wrote ${dir}/ic_launcher_foreground.png (${px}px)`);
  }
  console.log("\nDone. Rebuild the APK in Android Studio to pick up the new icon.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
