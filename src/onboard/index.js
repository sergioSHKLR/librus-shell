/* Archived: real module in src/onboard.archive — first-visit How-to retired in favor of Help modal. */

export function bindOnboard() {}
export function initOnboard() {}
export function openOnboard() {}
export function closeOnboard() {}
export function dismissOnboard() {}
export function isOnboardOpen() {
  return false;
}
export function shouldOfferOnboard() {
  return false;
}
export function stopViewportAnim() {}
export function syncViewportRatio() {}
export function applyViewportStep() {}
export function isLibraryView() {
  return document.body?.dataset?.view === "library";
}
