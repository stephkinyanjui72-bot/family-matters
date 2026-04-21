/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Bake deploy metadata into the client bundle so users can see which
  // version they're running. Vercel sets VERCEL_GIT_COMMIT_SHA automatically.
  env: {
    NEXT_PUBLIC_BUILD_SHA: (process.env.VERCEL_GIT_COMMIT_SHA || "dev").slice(0, 7),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  // Match Vercel defaults on HTML freshness — each app-launch revalidates
  // so existing APK installs pick up the newest web code immediately.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};
