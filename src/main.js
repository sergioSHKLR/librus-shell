/**
 * librus-shell — lean multi-flavor reader
 * Temporary restore: loads flavor, shows library, removes splash
 */
import "./styles.css";
import { registerSW } from "virtual:pwa-register";
import { hydrateIcons } from "./icons.js";
import { loadFlavor, applyFlavorBrand, getFlavor } from "./flavor.js";

const APP_VERSION = "0.9.14";

async function boot() {
  hydrateIcons(document);
  try {
    await loadFlavor();
    applyFlavorBrand();
  } catch (e) {
    console.error("[boot] flavor", e);
  }

  // Hide splash so the library shell is visible
  const splash = document.getElementById("boot-splash");
  if (splash) {
    splash.style.display = "none";
    splash.remove();
  }

  // Ensure library view is shown
  document.body.dataset.view = "library";
  const library = document.getElementById("library");
  if (library) library.hidden = false;

  try {
    registerSW({ immediate: true });
  } catch (_) {}

  console.log("[boot] minimal restore complete");
}

boot().catch((err) => {
  console.error("[POC] boot failed", err);
  const splash = document.getElementById("boot-splash");
  if (splash) splash.remove();
});
