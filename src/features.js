/**
 * Build-time feature flags (Vite).
 * Override via env: VITE_FEAT_PDF=1, VITE_FEAT_JAAS=1, VITE_FEAT_HYPO=0, …
 * Defaults: hypo/typo/providers on; pdf/jaas/profiles off.
 */
function on(key, defaultOn) {
  const v = import.meta.env[key];
  if (v === undefined || v === '') return defaultOn;
  return v === '1' || v === 'true' || v === true;
}

export const FEAT = {
  hypo: on('VITE_FEAT_HYPO', true),
  typo: on('VITE_FEAT_TYPO', true),
  providers: on('VITE_FEAT_PROVIDERS', true),
  pdf: on('VITE_FEAT_PDF', false),
  jaas: on('VITE_FEAT_JAAS', false),
  profiles: on('VITE_FEAT_PROFILES', false)
};

/** Hide/show [data-feat="name"] nodes to match the active build. */
export function applyFeatureDom() {
  document.querySelectorAll('[data-feat]').forEach((el) => {
    const name = el.getAttribute('data-feat');
    const enabled = !!FEAT[name];
    // data-feat-invert: shown only when the feature is OFF
    if (el.hasAttribute('data-feat-invert')) {
      el.hidden = enabled;
    } else {
      el.hidden = !enabled;
    }
  });
  document.documentElement.dataset.featHypo = FEAT.hypo ? '1' : '0';
  document.documentElement.dataset.featPdf = FEAT.pdf ? '1' : '0';
  document.documentElement.dataset.featJaas = FEAT.jaas ? '1' : '0';
  document.documentElement.dataset.featTypo = FEAT.typo ? '1' : '0';
}
