/**
 * librus-shell — lean multi-flavor reader
 * Minimal restore to unstick loading splash
 */
import "./styles.css";
import { registerSW } from "virtual:pwa-register";
import { hydrateIcons } from "./icons.js";
import { loadFlavor, getFlavor, applyFlavorBrand } from "./flavor.js";

const APP_VERSION = "0.9.14";

async function boot() {
  hydrateIcons(document);
  try {
    await loadFlavor();
    applyFlavorBrand();
  } catch (e) {
    console.error("flavor", e);
  }
  const splash = document.getElementById("boot-splash");
  if (splash) splash.remove();
  try {
    registerSW({ immediate: true });
  } catch (_) {}
}

boot().catch((err) => console.error("[POC] boot failed", err));
