/**
 * Hypothesis embed — lazy load on reader, branding for light/dark.
 */
const EMBED = 'https://hypothes.is/embed.js';
let loadPromise = null;

function branding(theme) {
  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const dark = theme === 'dark';
  /* Light: white sidebar; dark: same as pane body (--surface #1a1a1a) */
  const bg = dark ? '#1a1a1a' : '#ffffff';
  const fg = dark ? '#f0f0f0' : '#111111';
  return {
    appBackgroundColor: bg,
    accentColor: fg,
    ctaBackgroundColor: bg,
    ctaTextColor: fg,
    selectionFontFamily: font,
    annotationFontFamily: font
  };
}

export function installHypothesisConfig() {
  window.hypothesisConfig = function () {
    const t = document.documentElement.dataset.theme || 'light';
    return {
      openSidebar: true,
      theme: 'classic',
      sideBySide: { mode: 'manual' },
      branding: branding(t)
    };
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
