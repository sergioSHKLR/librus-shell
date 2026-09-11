/**
 * Hypothesis embed — lazy load on reader, branding for light/dark.
 */
const EMBED = 'https://hypothes.is/embed.js';
let loadPromise = null;

const NOTES_FOLD_PX = 1400;

function notesColumnOpen() {
  return (window.innerWidth || 0) > NOTES_FOLD_PX;
}

function branding(theme) {
  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const dark = theme === 'dark';
  /* Match pane body paper (--surface), not the old grey aux */
  const bg = dark ? '#0a0a0a' : '#ffffff';
  /*
   * Hypothesis TopBar is hardcoded `bg-white`. `accentColor` is applied as
   * `color` on Sign up / Log in (and more/less) sitting on that white chrome
   * and on white cards — never invert it with the shell theme.
   */
  const accentOnWhite = '#111111';
  /* Post / CTA: dark fill + light label on the white cards in both themes */
  const ctaBg = '#111111';
  const ctaFg = '#ffffff';
  return {
    appBackgroundColor: bg,
    accentColor: accentOnWhite,
    ctaBackgroundColor: ctaBg,
    ctaTextColor: ctaFg,
    selectionFontFamily: font,
    annotationFontFamily: font
  };
}

export function installHypothesisConfig() {
  window.hypothesisConfig = function () {
    const t = document.documentElement.dataset.theme || 'light';
    const inPane = notesColumnOpen();
    const cfg = {
      openSidebar: inPane,
      theme: 'classic',
      branding: branding(t),
      sideBySide: {
        mode: 'manual',
        isActive: function () {
          return (
            notesColumnOpen() && document.body?.dataset?.view === 'reader'
          );
        },
      },
    };
    if (inPane) cfg.externalContainerSelector = '#hypo-slot';
    return cfg;
  };
}

export function ensureHypothesis() {
  installHypothesisConfig();
  if (loadPromise) return loadPromise;
  if (document.querySelector('script[data-librus-hypothesis]')) {
    loadPromise = Promise.resolve();
    return loadPromise;
  }
  loadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = EMBED;
    s.async = true;
    s.dataset.librusHypothesis = '1';
    s.onload = () => resolve();
    s.onerror = () => {
      loadPromise = null;
      reject(new Error('Hypothesis load failed'));
    };
    document.body.appendChild(s);
  });
  return loadPromise;
}

export function destroyHypothesisUi() {
  document
    .querySelectorAll('script[data-librus-hypothesis]')
    .forEach((el) => el.remove());
  /* Only known Hypo hosts — never [class*="hypothesis"] (wipes app chrome / blanks page) */
  document
    .querySelectorAll(
      'hypothesis-sidebar, hypothesis-adder, hypothesis-notebook, hypothesis-profile, .annotator-frame, .annotator-outer, iframe.hypothesis-sidebar, iframe[src*="hypothes.is"]',
    )
    .forEach((el) => {
      try {
        el.remove();
      } catch (_) {
        /* ignore */
      }
    });
  loadPromise = null;
}

/**
 * Theme swap: update config only. Full destroy+reload blanks the reader
 * (Hypo re-inject + aggressive DOM wipe). User can hard-refresh if sidebar
 * branding must match immediately.
 */
export async function reloadHypothesisForTheme() {
  installHypothesisConfig();
  /* Soft path — do not destroy the page */
}

/**
 * When Hypo used externalContainerSelector, the iframe lives in #hypo-slot.
 * Watch for it and hide the fallback hint. Do not position:fixed the host.
 */
let dockRaf = 0;
let dockWatching = false;

export function syncHypothesisDock() {
  const root = document.documentElement;
  const slot = document.getElementById("hypo-slot");
  const inReader = document.body?.dataset?.view === "reader";
  const inSlot = !!(
    slot &&
    (slot.querySelector("hypothesis-sidebar, .annotator-frame, iframe") ||
      slot.querySelector("iframe"))
  );
  root.classList.toggle("hypo-in-pane", !!(inReader && inSlot));
  root.classList.remove("hypo-docked");
}

export function startHypothesisDockWatch() {
  if (dockWatching) {
    syncHypothesisDock();
    return;
  }
  dockWatching = true;
  const schedule = () => {
    if (!dockRaf) dockRaf = requestAnimationFrame(() => {
      dockRaf = 0;
      syncHypothesisDock();
    });
  };
  window.addEventListener("resize", schedule);
  if (typeof ResizeObserver !== "undefined") {
    const p4 = document.getElementById("p4");
    if (p4) {
      const ro = new ResizeObserver(schedule);
      ro.observe(p4);
      const slot = p4.querySelector("[data-body]");
      if (slot) ro.observe(slot);
    }
  }
  if (document.body) {
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true });
  }
  const slot = document.getElementById("hypo-slot");
  if (slot) {
    const moSlot = new MutationObserver(schedule);
    moSlot.observe(slot, { childList: true, subtree: true });
  }
  schedule();
}
