"use client";
// Hardware back-button handler for the Android app. Default Capacitor
// behavior is to exit the app on back-press; we instead honour browser
// history inside the WebView and only close the app when there's nothing
// left to pop. No-op on web.

import { isNativeApp } from "./platform";

let installed = false;

export async function installBackButtonHandler() {
  if (installed || !isNativeApp()) return;
  installed = true;

  const { App } = await import("@capacitor/app");

  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });
}
