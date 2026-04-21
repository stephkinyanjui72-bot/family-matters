// Detect whether we're running inside the Capacitor-wrapped native app
// versus a regular browser (mobile or desktop). Capacitor injects
// `window.Capacitor` into its WebView at runtime.
//
// Safe to call from SSR — returns false on the server, and client components
// should wait until after mount to trust the value (see useIsNativeApp).

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (!cap) return false;
  if (typeof cap.isNativePlatform === "function") return cap.isNativePlatform();
  return true;
}
