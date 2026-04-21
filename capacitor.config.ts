import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor wraps the web app in a native WebView. Because our Next.js app has
// server-side API routes, we can't ship it as static HTML — instead the app
// points at the live Vercel deployment. Content/code updates roll out via web
// deploys, no re-APK needed.

const config: CapacitorConfig = {
  appId: "com.familymatters.party",  // kept stable — changing would orphan existing installs
  appName: "Party Mate",
  webDir: "public",
  server: {
    url: "https://family-matters-taupe.vercel.app",  // kept stable — changes would break live QR codes
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
