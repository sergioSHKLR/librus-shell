/**
 * librus-shell — safe minimal boot
 * Removes splash and shows library. No awaits that can hang.
 */
import "./styles.css";
import { hydrateIcons } from "./icons.js";

function boot() {
  hydrateIcons(document);
  document.body.dataset.view = "library";
  const splash = document.getElementById("boot-splash");
  if (splash) {
    splash.hidden = true;
    splash.style.display = "none";
  }
  console.log("[boot] safe restore");
}

boot();
