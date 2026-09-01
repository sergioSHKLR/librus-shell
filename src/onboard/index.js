/**
 * First-visit onboard (Device + How-to).
 * Bound from main via bindOnboard(deps) to avoid circular imports.
 */
import { hydrateIcons } from "../icons.js";

/** First-visit onboard; persist only when “don’t show again” is checked. */
const ONBOARD_DISMISS_KEY = "librus-onboard-dismiss";

/** @type {{
 *   t: (key: string) => string,
 *   getLang: () => string,
 *   applyI18n: () => void,
 *   isStudyConstrained: () => boolean,
 *   closeOrientGate: (el?: HTMLElement|null) => void,
 *   openOrientGate: (el: HTMLElement) => void,
 *   updateOrientLock: () => void,
 *   modalIds: () => string[],
 * }} */
let deps = {
  t: (k) => k,
  getLang: () => "pt",
  applyI18n: () => {},
  isStudyConstrained: () => false,
  closeOrientGate: () => {},
  openOrientGate: () => {},
  updateOrientLock: () => {},
  modalIds: () => ["help", "settings"],
};

/** @param {typeof deps} next */
export function bindOnboard(next) {
  deps = { ...deps, ...next };
}

function t(key) {
  return deps.t(key);
}

function __onboardGetLang() {
  return deps.getLang();
}

function __onboardApplyI18n() {
  deps.applyI18n();
}

function __onboardModalIds() {
  return deps.modalIds();
}

function isStudyConstrained() {
  return deps.isStudyConstrained();
}

function closeOrientGate(el) {
  return deps.closeOrientGate(el);
}

function openOrientGate(el) {
  return deps.openOrientGate(el);
}

function updateOrientLock() {
  return deps.updateOrientLock();
}

/* ── Onboard: Device viewport animation ──────────── */

const VIEWPORT_STEPS = [
  { key: "desktop", cards: [1, 2, 3, 4], blocked: false },
  { key: "laptop", cards: [2, 3, 4], blocked: false },
  /* Narrow / tablet+phone: outline what would fit, but greyed — real gate blocks study */
  { key: "tablet", cards: [2, 3], blocked: true },
  { key: "mobile", cards: [2], blocked: true },
];
const VIEWPORT_HOLD_MS = 2400;
let viewportStep = 0;
let viewportTimer = null;
let viewportRunning = false;
/** When true, viewport interval is frozen (play/pause). */
let viewportPaused = false;

/** Cards use the same aspect ratio as the browser window. */
function syncViewportRatio() {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  const ratio = Math.max(0.45, Math.min(3.2, w / h));
  document.documentElement.style.setProperty("--vp-ratio", String(ratio));
  document.documentElement.dataset.vpOrient = w >= h ? "landscape" : "portrait";
}

/**
 * @param {number[]} cardNums
 * @param {{ snap?: boolean, blocked?: boolean }} [opts]
 */
function layoutViewportFrame(cardNums, opts = {}) {
  const stage = document.getElementById("cards-stage");
  const frame = document.getElementById("viewport-frame");
  const deviceLabel = document.getElementById("viewport-label-device");
  const cardsRoot = document.getElementById("cards");
  const onboard = document.getElementById("onboard");
  if (!stage || !frame || !cardsRoot) return false;

  const blocked = !!opts.blocked;
  const articles = [...cardsRoot.querySelectorAll("[data-card]")];
  const active = articles.filter((el) =>
    cardNums.includes(Number(el.dataset.card)),
  );
  if (!active.length || active.length !== cardNums.length) return false;

  const stageBox = stage.getBoundingClientRect();
  /* Onboard not visible / zero layout yet */
  if (stageBox.width < 4 || stageBox.height < 4) {
    frame.classList.remove("is-on", "is-blocked");
    return false;
  }

  if (onboard) onboard.dataset.viewport = blocked ? "blocked" : "fit";

  let minL = Infinity;
  let minT = Infinity;
  let maxR = -Infinity;
  let maxB = -Infinity;
  /* Every requested card must have a real box — a partial union (e.g. only
   * card 1 while 2–4 are still 0×0) is what made Desktop look like a hung
   * left-only outline for the whole first hold. */
  for (const el of active) {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) {
      frame.classList.remove("is-on");
      return false;
    }
    minL = Math.min(minL, r.left);
    minT = Math.min(minT, r.top);
    maxR = Math.max(maxR, r.right);
    maxB = Math.max(maxB, r.bottom);
  }

  if (!isFinite(minL) || maxR - minL < 4 || maxB - minT < 4) {
    frame.classList.remove("is-on");
    return false;
  }

  const pad = 8;
  const snap = !!opts.snap;
  if (snap) frame.classList.add("no-motion");
  frame.style.left = minL - stageBox.left - pad + "px";
  frame.style.top = minT - stageBox.top - pad + "px";
  frame.style.width = maxR - minL + pad * 2 + "px";
  frame.style.height = maxB - minT + pad * 2 + "px";
  frame.classList.add("is-on");
  frame.classList.toggle("is-blocked", blocked);
  if (snap) {
    /* Force reflow so later steps still animate */
    void frame.offsetWidth;
    frame.classList.remove("no-motion");
  }

  /*
   * Outside the outline: always greyed.
   * Inside the outline: greyed too when this viewport is blocked (tablet/mobile).
   */
  articles.forEach((el) => {
    const n = Number(el.dataset.card);
    const inViewport = cardNums.includes(n);
    el.classList.toggle("out", blocked || !inViewport);
  });

  if (deviceLabel) {
    const step = VIEWPORT_STEPS.find((s) => s.cards.join() === cardNums.join());
    let key = "onboard.desktop";
    if (step) {
      key =
        step.blocked && (step.key === "tablet" || step.key === "mobile")
          ? "onboard." + step.key + "Blocked"
          : "onboard." + step.key;
    }
    deviceLabel.setAttribute("data-i18n", key);
    deviceLabel.textContent = t(key);
  }
  return true;
}

/** Sync caption under the cards (Device / How-to narration). */
function setOnboardCaption(key) {
  const el = document.getElementById("onboard-caption");
  if (!el || !key) return;
  el.setAttribute("data-i18n", key);
  el.textContent = t(key);
}

/**
 * How-to column outline (does not toggle .out — blank/lit owns emphasis).
 * Walks with CSS size/position tween when already visible; snaps on first show;
 * hides with opacity only (no collapse-to-0×0 “zoom out”).
 * @param {number|number[]|null} cardNum 1..4, list of cards, or null to hide
 */
function setHowOutline(cardNum) {
  const stage = document.getElementById("cards-stage");
  const frame = document.getElementById("viewport-frame");
  if (!stage || !frame) return;

  if (cardNum == null) {
    /* Fade out in place — keep geometry so it doesn’t shrink to 0×0 */
    frame.classList.add("no-motion");
    frame.classList.remove("is-on", "is-blocked");
    void frame.offsetWidth;
    frame.classList.remove("is-how-outline", "no-motion");
    frame.style.left = "";
    frame.style.top = "";
    frame.style.width = "";
    frame.style.height = "";
    return;
  }

  const nums = (Array.isArray(cardNum) ? cardNum : [cardNum])
    .map((n) => Number(n))
    .filter((n) => n >= 1 && n <= 4);
  if (!nums.length) {
    setHowOutline(null);
    return;
  }

  const stageBox = stage.getBoundingClientRect();
  if (stageBox.width < 4 || stageBox.height < 4) {
    setHowOutline(null);
    return;
  }

  let minL = Infinity;
  let minT = Infinity;
  let maxR = -Infinity;
  let maxB = -Infinity;
  for (const n of nums) {
    const el = document.querySelector(`#cards [data-card="${n}"]`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    minL = Math.min(minL, r.left);
    minT = Math.min(minT, r.top);
    maxR = Math.max(maxR, r.right);
    maxB = Math.max(maxB, r.bottom);
  }
  if (!isFinite(minL) || maxR - minL < 4 || maxB - minT < 4) {
    setHowOutline(null);
    return;
  }

  const pad = 8;
  const firstShow = !frame.classList.contains("is-how-outline");
  frame.classList.add("is-how-outline");
  frame.classList.remove("is-blocked");
  /* Snap only when appearing; otherwise walk via CSS transition */
  if (firstShow) frame.classList.add("no-motion");
  frame.style.left = minL - stageBox.left - pad + "px";
  frame.style.top = minT - stageBox.top - pad + "px";
  frame.style.width = maxR - minL + pad * 2 + "px";
  frame.style.height = maxB - minT + pad * 2 + "px";
  frame.classList.add("is-on");
  if (firstShow) {
    void frame.offsetWidth;
    frame.classList.remove("no-motion");
  }
}

/* ── Onboard caption TTS (PT; mute default; times How-to holds) ─ */

let onboardSpeechToken = 0;
/** Caption speech off until user unmutes. */
let onboardSpeechMuted = true;

function cancelOnboardSpeech() {
  onboardSpeechToken += 1;
  try {
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  } catch (_) {
    /* ignore */
  }
}

function setOnboardSpeechMuted(muted) {
  onboardSpeechMuted = !!muted;
  if (onboardSpeechMuted) cancelOnboardSpeech();
  syncOnboardMuteButton();
}

function syncOnboardMuteButton() {
  const btn = document.getElementById("onboard-mute");
  if (!btn) return;
  btn.classList.toggle("is-muted", onboardSpeechMuted);
  btn.classList.toggle("is-unmuted", !onboardSpeechMuted);
  btn.setAttribute("aria-pressed", onboardSpeechMuted ? "true" : "false");
  const ariaKey = onboardSpeechMuted ? "onboard.unmute" : "onboard.mute";
  btn.setAttribute("data-i18n-aria", ariaKey);
  btn.setAttribute("aria-label", t(ariaKey));
}

function toggleOnboardMute() {
  setOnboardSpeechMuted(!onboardSpeechMuted);
}

function pickPtVoice() {
  try {
    const voices = speechSynthesis.getVoices?.() || [];
    return (
      voices.find((v) => /^pt-BR/i.test(v.lang)) ||
      voices.find((v) => /^pt/i.test(v.lang)) ||
      voices.find((v) => /brazil|portug/i.test(v.name || "")) ||
      null
    );
  } catch (_) {
    return null;
  }
}

/**
 * Speak caption text (pt only). Resolves when utterance ends or is cancelled.
 * @param {string} text
 * @returns {Promise<void>}
 */
function speakOnboardCaption(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed || __onboardGetLang() !== "pt" || onboardSpeechMuted)
    return Promise.resolve();
  if (
    typeof speechSynthesis === "undefined" ||
    typeof SpeechSynthesisUtterance === "undefined"
  )
    return Promise.resolve();

  cancelOnboardSpeech();
  const token = onboardSpeechToken;

  return new Promise((resolve) => {
    const finish = () => resolve();
    const speakNow = () => {
      if (token !== onboardSpeechToken) {
        finish();
        return;
      }
      const u = new SpeechSynthesisUtterance(trimmed);
      u.lang = "pt-BR";
      u.rate = 1.05;
      const voice = pickPtVoice();
      if (voice) u.voice = voice;
      u.onend = finish;
      u.onerror = finish;
      try {
        speechSynthesis.speak(u);
      } catch (_) {
        finish();
      }
    };

    /* Chrome often loads voices asynchronously */
    const voices = speechSynthesis.getVoices?.() || [];
    if (!voices.length) {
      const once = () => {
        speechSynthesis.removeEventListener("voiceschanged", once);
        speakNow();
      };
      speechSynthesis.addEventListener("voiceschanged", once);
      /* Fallback if event never fires */
      setTimeout(() => {
        speechSynthesis.removeEventListener("voiceschanged", once);
        speakNow();
      }, 400);
    } else {
      speakNow();
    }
  });
}

/** Gate How-to loop while paused. */
async function howPauseGate(gen) {
  while (howPaused && gen === howRevealGen) {
    await new Promise((resolve) => {
      howPauseWaiters.push(resolve);
    });
  }
  return gen === howRevealGen;
}

/** Exact ms hold (no ×1.25); respects pause + gen cancel. */
async function howWaitExact(gen, ms) {
  let left = Math.max(0, Math.round(ms));
  while (left > 0) {
    if (gen !== howRevealGen) return false;
    while (howPaused) {
      await new Promise((resolve) => {
        howPauseWaiters.push(resolve);
      });
      if (gen !== howRevealGen) return false;
    }
    const slice = Math.min(left, 80);
    const ok = await new Promise((resolve) => {
      clearHowRevealTimer();
      howRevealTimer = setTimeout(() => {
        howRevealTimer = null;
        resolve(gen === howRevealGen);
      }, slice);
    });
    if (!ok) return false;
    left -= slice;
  }
  return gen === howRevealGen;
}

/**
 * Update caption; if unmuted PT, speak it; then exactly 1.5s before the next beat.
 * Muted: no length-based hold — only the 1.5s gap (avoids stacking).
 * @param {number} gen
 * @param {string} key
 */
async function narrateOnboardCaption(gen, key) {
  setOnboardCaption(key);
  if (gen !== howRevealGen) return false;
  const line = t(key);
  if (!(onboardSpeechMuted || __onboardGetLang() !== "pt")) {
    await speakOnboardCaption(line);
    if (gen !== howRevealGen) return false;
  }
  if (!(await howWaitExact(gen, 1500))) return false;
  return howPauseGate(gen);
}

function applyViewportStep(index, opts = {}) {
  viewportStep =
    ((index % VIEWPORT_STEPS.length) + VIEWPORT_STEPS.length) %
    VIEWPORT_STEPS.length;
  const step = VIEWPORT_STEPS[viewportStep];
  const ok = layoutViewportFrame(step.cards, {
    ...opts,
    blocked: !!step.blocked,
  });
  if (ok) {
    const capKey = step.blocked
      ? "onboard.cap." + step.key + "Blocked"
      : "onboard.cap." + step.key;
    setOnboardCaption(capKey);
  }
  return ok;
}

function inviteHowToPill() {
  document.getElementById("onboard-mode-how")?.classList.add("is-invite");
  setOnboardCaption("onboard.cap.deviceDone");
}

function clearHowToInvite() {
  document.getElementById("onboard-mode-how")?.classList.remove("is-invite");
}

/** Re-snap Desktop while the onboard modal is still settling its size. */
let viewportDesktopRo = null;

function clearViewportDesktopRo() {
  if (viewportDesktopRo) {
    viewportDesktopRo.disconnect();
    viewportDesktopRo = null;
  }
}

function startViewportAnim() {
  stopViewportAnim();
  viewportRunning = true;
  viewportPaused = false;
  viewportStep = 0;
  syncViewportRatio();

  const placeDesktop = () => {
    if (!viewportRunning) return false;
    /* Snap: no CSS tween from 0×0 into the first Desktop outline */
    return applyViewportStep(0, { snap: true }) === true;
  };

  const armInterval = () => {
    if (!viewportRunning) return;
    if (viewportTimer) {
      clearInterval(viewportTimer);
      viewportTimer = null;
    }
    viewportTimer = setInterval(() => {
      if (!viewportRunning || viewportPaused) return;
      /* One cycle only: stop on last step (Mobile blocked), then invite How to */
      if (viewportStep >= VIEWPORT_STEPS.length - 1) {
        setViewportPaused(true);
        inviteHowToPill();
        return;
      }
      /* Leaving Desktop — stop settle watcher */
      if (viewportStep === 0) clearViewportDesktopRo();
      applyViewportStep(viewportStep + 1);
    }, VIEWPORT_HOLD_MS);
  };

  const watchDesktopSettle = () => {
    clearViewportDesktopRo();
    const stage = document.getElementById("cards-stage");
    if (!stage || typeof ResizeObserver !== "function") {
      /* Fallback: timed re-snaps while modal scale/size settles */
      [80, 160, 280, 450].forEach((ms) => {
        setTimeout(() => {
          if (viewportRunning && viewportStep === 0 && !viewportPaused)
            placeDesktop();
        }, ms);
      });
      return;
    }
    let lastKey = "";
    viewportDesktopRo = new ResizeObserver(() => {
      if (!viewportRunning || viewportStep !== 0 || viewportPaused) {
        clearViewportDesktopRo();
        return;
      }
      const box = stage.getBoundingClientRect();
      const key = `${Math.round(box.width)}x${Math.round(box.height)}`;
      if (key === lastKey) return;
      lastKey = key;
      placeDesktop();
    });
    viewportDesktopRo.observe(stage);
    /* Also catch transform scale-in (no ResizeObserver) via timed snaps */
    [80, 200, 350].forEach((ms) => {
      setTimeout(() => {
        if (viewportRunning && viewportStep === 0 && !viewportPaused)
          placeDesktop();
      }, ms);
    });
  };

  /*
   * Wait until onboard is open + ALL Desktop cards have real boxes, then
   * snap the outline (no 0×0 tween) and only then start the hold timer.
   */
  let tries = 0;
  const tryStart = () => {
    if (!viewportRunning) return;
    const onboard = document.getElementById("onboard");
    const ready =
      onboard &&
      !onboard.hidden &&
      onboard.classList.contains("is-open") &&
      placeDesktop();
    if (ready) {
      watchDesktopSettle();
      armInterval();
      return;
    }
    tries += 1;
    if (tries < 60) requestAnimationFrame(tryStart);
    else {
      placeDesktop();
      watchDesktopSettle();
      armInterval();
    }
  };

  requestAnimationFrame(() => requestAnimationFrame(tryStart));
  syncOnboardTransport();
}

function stopViewportAnim() {
  viewportRunning = false;
  viewportPaused = false;
  clearViewportDesktopRo();
  if (viewportTimer) {
    clearInterval(viewportTimer);
    viewportTimer = null;
  }
  syncOnboardTransport();
}

function setViewportPaused(paused) {
  viewportPaused = !!paused;
  if (!viewportPaused && viewportRunning && !viewportTimer) {
    viewportTimer = setInterval(() => {
      if (!viewportRunning || viewportPaused) return;
      applyViewportStep(viewportStep + 1);
    }, VIEWPORT_HOLD_MS);
  }
  syncOnboardTransport();
}


/* ── Onboard: open / close / Device|How to chrome ─ */

/** Closed this session (skip/X/done) — may still reappear next visit. */
let onboardSessionDone = false;

function isOnboardDismissed() {
  try {
    return localStorage.getItem(ONBOARD_DISMISS_KEY) === "1";
  } catch (_) {
    return false;
  }
}

function setOnboardDismissed() {
  try {
    localStorage.setItem(ONBOARD_DISMISS_KEY, "1");
  } catch (_) {
    /* private mode */
  }
}

function shouldOfferOnboard() {
  return !isOnboardDismissed() && !onboardSessionDone;
}

function isLibraryView() {
  return (document.body.dataset.view || "library") === "library";
}

function isOnboardOpen() {
  const el = document.getElementById("onboard");
  return !!(el && el.classList.contains("is-open") && !el.hidden);
}

function onboardPersistChecked() {
  return !!document.getElementById("onboard-persist")?.checked;
}

/* ── Onboard: How to reveal + cursor ─────────────── */

let howRevealTimer = null;
let howRevealGen = 0;
let howPaused = false;
/** False until user hits play — open idle, no auto-start. */
let howStarted = false;
/** @type {Array<() => void>} */
let howPauseWaiters = [];

function clearHowRevealTimer() {
  if (howRevealTimer) {
    clearTimeout(howRevealTimer);
    howRevealTimer = null;
  }
}

function setHowPaused(paused) {
  howPaused = !!paused;
  if (howPaused) cancelOnboardSpeech();
  if (!howPaused) {
    const waiters = howPauseWaiters.splice(0, howPauseWaiters.length);
    waiters.forEach((fn) => fn());
  }
  syncOnboardTransport();
}

function clearHowCardClasses() {
  clearHowHitChrome();
  document.querySelectorAll("#cards [data-card]").forEach((card) => {
    card.classList.remove("is-blank", "is-lit", "is-click", "out");
  });
}

function stopHowRevealAnim() {
  howRevealGen += 1;
  clearHowRevealTimer();
  cancelOnboardSpeech();
  howPaused = false;
  howStarted = false;
  const waiters = howPauseWaiters.splice(0, howPauseWaiters.length);
  waiters.forEach((fn) => fn());
  const cursor = document.getElementById("how-cursor");
  if (cursor) {
    cursor.hidden = true;
    cursor.classList.remove("is-press");
    cursor.dataset.mode = "pointer";
  }
  setHowOutline(null);
  /* Leave cards in a clean state for Viewport mode */
  clearHowCardClasses();
}

/** Idle How-to frame: caption only, play to start (no auto-run). */
function prepareHowRevealIdle() {
  howRevealGen += 1;
  clearHowRevealTimer();
  cancelOnboardSpeech();
  howPaused = true;
  howStarted = false;
  const waiters = howPauseWaiters.splice(0, howPauseWaiters.length);
  waiters.forEach((fn) => fn());
  blankAllHowCards();
  setHowOutline(null);
  /* Caption 0 — replaced by howStart as soon as play runs */
  setOnboardCaption("onboard.cap.howControls");
  const cursor = document.getElementById("how-cursor");
  if (cursor) {
    cursor.hidden = true;
    cursor.classList.remove("is-press");
    setHowCursorMode("pointer");
  }
  syncOnboardTransport();
  syncOnboardMuteButton();
}

/**
 * Resolve the mock hit element inside a card (not the panel itself).
 * @param {number} n 1..4
 * @param {'center'|'header'|'toc'|'link'|'select'|'article'|'note'|'body'} [aim]
 * @returns {Element|null}
 */
function howHitEl(n, aim = "center") {
  const card = document.querySelector(`#cards [data-card="${n}"]`);
  if (!card) return null;
  if (aim === "header") return card.querySelector(".onboard-card-head");
  if (aim === "toc") return card.querySelector('[data-how-hit="toc"]');
  if (aim === "link") return card.querySelector('[data-how-hit="link"]');
  if (aim === "select" || aim === "select-search" || aim === "body")
    return (
      card.querySelector('[data-how-hit="select-search"]') ||
      card.querySelector('[data-how-hit="select"]')
    );
  if (aim === "select-annotate")
    return card.querySelector('[data-how-hit="select-annotate"]');
  if (aim === "provider")
    return card.querySelector('[data-how-hit="provider"]');
  if (aim === "article")
    return (
      card.querySelector(".how-consult-result:not([hidden])") ||
      card.querySelector('[data-how-hit="article"]')
    );
  if (aim === "note") return card.querySelector('[data-how-hit="note"]');
  return card.querySelector("[data-how-hit]") || card;
}

/**
 * @param {number} n 1..4
 * @param {'center'|'header'|'toc'|'link'|'select'|'select-search'|'select-annotate'|'provider'|'article'|'note'|'body'} [aim]
 */
function howCardPoint(n, aim = "center") {
  const stage = document.getElementById("cards-stage");
  const target = howHitEl(n, aim);
  if (!stage || !target) return { x: 0, y: 0 };
  const sr = stage.getBoundingClientRect();
  const box = target.getBoundingClientRect();
  const x = box.left - sr.left + box.width * 0.5;
  const y = box.top - sr.top + box.height * 0.5;
  return { x, y };
}

function clearHowHitChrome() {
  document.querySelectorAll(".onboard-mock-hit").forEach((el) => {
    el.classList.remove("is-click", "is-selected");
  });
}

/** Consulte mock: show search («termo») or link («ipsum») result card. */
function setHowConsultResult(kind) {
  const card = document.querySelector('#cards [data-card="3"]');
  if (!card) return;
  card.querySelectorAll("[data-how-result]").forEach((el) => {
    const on = el.getAttribute("data-how-result") === kind;
    el.hidden = !on;
  });
}

function clearHowConsultResult() {
  document.querySelectorAll("#cards [data-how-result]").forEach((el) => {
    el.hidden = true;
  });
}

function placeHowCursor(x, y) {
  const cursor = document.getElementById("how-cursor");
  if (!cursor) return;
  cursor.style.left = `${x}px`;
  cursor.style.top = `${y}px`;
}

function setHowCursorMode(mode) {
  const cursor = document.getElementById("how-cursor");
  if (!cursor) return;
  cursor.dataset.mode = mode;
  cursor.querySelectorAll(".how-cursor-glyph").forEach((g) => {
    g.hidden = true;
  });
  const map = {
    pointer: ".how-cursor-pointer",
    link: ".how-cursor-link",
    text: ".how-cursor-text",
  };
  const sel = map[mode] || map.pointer;
  const glyph = cursor.querySelector(sel);
  if (glyph) glyph.hidden = false;
}

function lightHowCard(n) {
  const card = document.querySelector(
    `#cards [data-card="${n}"]`,
  );
  if (!card) return;
  card.classList.remove("is-blank");
  card.classList.add("is-lit");
}

function blankAllHowCards() {
  clearHowHitChrome();
  clearHowConsultResult();
  document.querySelectorAll("#cards [data-card]").forEach((card) => {
    card.classList.add("is-blank");
    card.classList.remove("is-lit", "is-click", "out");
  });
}

/**
 * @param {number} gen
 * @param {number} ms base duration — scaled 25% slower for readability
 */
async function howWait(gen, ms) {
  let left = Math.round(ms * 1.25);
  while (left > 0) {
    if (gen !== howRevealGen) return false;
    while (howPaused) {
      await new Promise((resolve) => {
        howPauseWaiters.push(resolve);
      });
      if (gen !== howRevealGen) return false;
    }
    const slice = Math.min(left, 80);
    const ok = await new Promise((resolve) => {
      clearHowRevealTimer();
      howRevealTimer = setTimeout(() => {
        howRevealTimer = null;
        resolve(gen === howRevealGen);
      }, slice);
    });
    if (!ok) return false;
    left -= slice;
  }
  return gen === howRevealGen;
}

/**
 * Move cursor to a card (optional mode). Does not click.
 * @param {number} gen
 * @param {number} card
 * @param {'pointer'|'link'|'text'} [mode]
 * @param {'center'|'header'|'toc'|'body'|'article'|'note'} [aim]
 */
async function howCursorMoveTo(gen, card, mode = "pointer", aim = "center") {
  const cursor = document.getElementById("how-cursor");
  if (!cursor) return false;
  cursor.hidden = false;
  setHowCursorMode(mode === "text" ? "pointer" : mode);
  const pt = howCardPoint(card, aim);
  placeHowCursor(pt.x, pt.y);
  if (!(await howWait(gen, 580))) return false;
  if (mode === "text" || mode === "link") {
    setHowCursorMode(mode);
    if (!(await howWait(gen, 280))) return false;
  }
  return true;
}

/**
 * Press on a mock hit inside clickCard; optionally light lightCard.
 * @param {number} gen
 * @param {number} clickCard
 * @param {number|null} lightCard
 * @param {'link'|'text'|'pointer'} mode
 * @param {'toc'|'link'|'select'|'article'|'note'} aim
 */
async function howCursorPress(gen, clickCard, lightCard, mode, aim) {
  const cursor = document.getElementById("how-cursor");
  const hit = howHitEl(clickCard, aim);
  if (!cursor || !hit) return false;

  setHowCursorMode(mode);
  if (!(await howWait(gen, 200))) return false;

  cursor.classList.add("is-press");
  hit.classList.add("is-click");
  if (mode === "text") hit.classList.add("is-selected");
  if (!(await howWait(gen, 180))) return false;

  cursor.classList.remove("is-press");
  hit.classList.remove("is-click");
  /* keep is-selected on the phrase after text-select click */
  if (lightCard != null) lightHowCard(lightCard);
  if (!(await howWait(gen, 420))) return false;
  return true;
}

/**
 * Move onto mock hit, switch mode, press; light lightCard.
 * @param {number} gen
 * @param {number} clickCard
 * @param {number|null} lightCard
 * @param {'link'|'text'} mode
 * @param {'toc'|'link'|'select'|'article'|'note'} aim
 */
async function howCursorClickReveal(gen, clickCard, lightCard, mode, aim) {
  if (!(await howCursorMoveTo(gen, clickCard, mode, aim))) return false;
  return howCursorPress(gen, clickCard, lightCard, mode, aim);
}

/* How-to beat list + trim notes: .grok/rules/onboarding-bloat.md */
async function runHowRevealLoop(gen) {
  const cursor = document.getElementById("how-cursor");
  const stage = document.getElementById("cards-stage");
  if (!cursor || !stage) return;

  blankAllHowCards();
  cursor.hidden = true;
  cursor.classList.remove("is-press");
  setHowCursorMode("pointer");

  /*
   * Outline map (caption # → card): 1 none, 2→1, 3→1, 4→2, 5→3, 6→3,
   * 7→2, 8→2, 9→4, 10→[1–4]. Walks between beats; see onboarding-bloat.md
   */
  lightHowCard(1);
  setHowOutline(null);
  if (!(await narrateOnboardCaption(gen, "onboard.cap.howStart"))) return;

  setHowOutline(1);
  if (!(await narrateOnboardCaption(gen, "onboard.cap.howCol1"))) return;

  /* 1 click TOC → light #2 */
  setHowOutline(1);
  if (!(await narrateOnboardCaption(gen, "onboard.cap.howToc"))) return;
  if (!(await howCursorClickReveal(gen, 1, 2, "link", "toc"))) return;

  /* 2 select term (select-to-search) */
  setHowOutline(2);
  if (!(await narrateOnboardCaption(gen, "onboard.cap.howSelectSearch")))
    return;
  if (!(await howCursorClickReveal(gen, 2, null, "text", "select-search")))
    return;

  /* 3 click provider → Consulte lights + «termo» article (any provider) */
  lightHowCard(3);
  setHowOutline(3);
  if (!(await narrateOnboardCaption(gen, "onboard.cap.howProvider"))) return;
  if (!(await howCursorClickReveal(gen, 3, null, "pointer", "provider")))
    return;
  setHowConsultResult("termo");
  setHowOutline(3);
  if (!(await narrateOnboardCaption(gen, "onboard.cap.howResults"))) return;

  /* 2 link → consult via existing link; article becomes «ipsum» */
  clearHowHitChrome();
  setHowOutline(2);
  if (!(await narrateOnboardCaption(gen, "onboard.cap.howLink"))) return;
  if (!(await howCursorClickReveal(gen, 2, null, "link", "link"))) return;
  setHowConsultResult("ipsum");

  /* Brief focus on ipsum article (outline stays on #2 per map beat 7–8) */
  if (!(await howCursorMoveTo(gen, 3, "pointer", "article"))) return;
  if (!(await howWaitExact(gen, 400))) return;

  /* 2 select-to-annotate → light #4 */
  clearHowHitChrome();
  setHowOutline(2);
  if (!(await narrateOnboardCaption(gen, "onboard.cap.howSelectAnnotate")))
    return;
  if (!(await howCursorClickReveal(gen, 2, 4, "text", "select-annotate")))
    return;

  /* 4 note */
  setHowOutline(4);
  if (!(await narrateOnboardCaption(gen, "onboard.cap.howNote"))) return;
  if (!(await howCursorMoveTo(gen, 4, "pointer", "note"))) return;

  /* Closer — brief outline of all four columns (walk expand, not collapse) */
  if (gen !== howRevealGen) return;
  setHowOutline([1, 2, 3, 4]);
  if (!(await narrateOnboardCaption(gen, "onboard.cap.howDone"))) return;
  setHowPaused(true);
}

function startHowRevealAnim() {
  /* Cancel any prior loop, reset cards, then run */
  howRevealGen += 1;
  clearHowRevealTimer();
  cancelOnboardSpeech();
  howPaused = false;
  howStarted = true;
  const waiters = howPauseWaiters.splice(0, howPauseWaiters.length);
  waiters.forEach((fn) => fn());
  const myGen = howRevealGen;
  blankAllHowCards();
  setHowOutline(null);
  setOnboardCaption("onboard.cap.howStart");
  const cursor = document.getElementById("how-cursor");
  if (cursor) {
    cursor.hidden = true;
    cursor.classList.remove("is-press");
    setHowCursorMode("pointer");
  }
  hydrateIcons(document.getElementById("cards-stage"));
  syncOnboardTransport();
  syncOnboardMuteButton();
  /* Warm voices list (Chrome) before the first utterance */
  try {
    speechSynthesis.getVoices?.();
  } catch (_) {
    /* ignore */
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (myGen !== howRevealGen) return;
      runHowRevealLoop(myGen);
    });
  });
}

function setOnboardStep(step) {
  const el = document.getElementById("onboard");
  if (!el) return;
  const next = step === "how" ? "how" : "where";
  if (el.dataset.step === next && el.classList.contains("is-open")) {
    /* Re-tapping active pill: restart that mode’s animation */
    if (next === "where") {
      clearHowToInvite();
      stopHowRevealAnim();
      syncViewportRatio();
      startViewportAnim();
    } else {
      clearHowToInvite();
      stopViewportAnim();
      startHowRevealAnim();
    }
    syncOnboardTransport();
    return;
  }
  el.dataset.step = next;
  if (next === "how") clearHowToInvite();

  const title = document.getElementById("onboard-title");
  if (title) {
    const key = next === "how" ? "onboard.titleHow" : "onboard.title";
    title.setAttribute("data-i18n", key);
    title.textContent = t(key);
  }

  if (next === "where") {
    stopHowRevealAnim();
    syncViewportRatio();
    startViewportAnim();
  } else {
    stopViewportAnim();
    const frame = document.getElementById("viewport-frame");
    if (frame) frame.classList.remove("is-on", "is-blocked");
    delete el.dataset.viewport;
    /* Idle until user hits play — no auto-start */
    prepareHowRevealIdle();
  }
  syncOnboardTransport();
}

/** Sync play/pause glyphs, and Viewport | How to pill. */
function isViewportCycleDone() {
  return (
    viewportPaused &&
    viewportRunning &&
    viewportStep >= VIEWPORT_STEPS.length - 1
  );
}

function isHowCycleDone() {
  if (!howStarted || !howPaused) return false;
  const lit = document.querySelectorAll("#cards [data-card].is-lit").length;
  return lit >= 4;
}

function syncOnboardTransport() {
  const el = document.getElementById("onboard");
  const play = document.getElementById("onboard-play");
  if (!el || !play) return;

  const step = el.dataset.step === "how" ? "how" : "where";
  const paused =
    step === "where" ? viewportPaused : !howStarted || howPaused;
  const done = step === "where" ? isViewportCycleDone() : isHowCycleDone();

  /* Pause while running · Play while idle/mid-pause · Reload after a finished cycle */
  play.classList.toggle("is-playing", howStarted && !paused && !done);
  play.classList.toggle("is-paused", (!howStarted || paused) && !done);
  play.classList.toggle("is-reload", done);
  const ariaKey = done
    ? "onboard.reload"
    : !howStarted || paused
      ? "onboard.play"
      : "onboard.pause";
  play.setAttribute("data-i18n-aria", ariaKey);
  play.setAttribute("aria-label", t(ariaKey));

  el.querySelectorAll("[data-onboard-mode]").forEach((btn) => {
    const on = btn.getAttribute("data-onboard-mode") === step;
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  syncOnboardMuteButton();
}

function onboardTransportTogglePause() {
  const el = document.getElementById("onboard");
  if (!el) return;
  if (el.dataset.step === "how") {
    /* Idle or finished → start / reload How to */
    if (!howStarted || isHowCycleDone()) {
      startHowRevealAnim();
      return;
    }
    setHowPaused(!howPaused);
  } else {
    /* Dead anim or finished cycle → reload Device */
    if (!viewportRunning || isViewportCycleDone()) {
      clearHowToInvite();
      startViewportAnim();
      return;
    }
    setViewportPaused(!viewportPaused);
  }
}

function onboardEnter() {
  dismissOnboard({ persistIfChecked: true });
}

function openOnboard() {
  const el = document.getElementById("onboard");
  if (!el || !shouldOfferOnboard()) return;
  /* Library only — never overlay the reader */
  if (!isLibraryView()) return;
  /* Small-screen block takes priority — onboard waits until viewport is wide */
  if (isStudyConstrained()) return;

  /* Close help/settings; orient should already be clear on a wide screen */
  __onboardModalIds().forEach((id) => {
    const o = document.getElementById(id);
    if (o) {
      o.classList.remove("is-open", "is-closing");
      o.hidden = true;
    }
  });
  const orient = document.getElementById("orient");
  if (orient) closeOrientGate(orient);

  const scrim = document.getElementById("scrim");
  el.hidden = false;
  el.classList.remove("is-closing");
  if (scrim) {
    scrim.hidden = false;
    scrim.classList.remove("is-closing");
  }
  /* How to only — Device cycle hid half-blocked story from first visit */
  setOnboardStep("how");
  hydrateIcons(el);
  __onboardApplyI18n();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add("is-open");
      if (scrim) scrim.classList.add("is-open");
    });
  });
}

/**
 * @param {(() => void)|undefined} [onDone]
 * @param {{ skipOrient?: boolean }} [opts] skipOrient: closing to yield to the size gate
 */
function closeOnboard(onDone, opts = {}) {
  const el = document.getElementById("onboard");
  stopViewportAnim();
  stopHowRevealAnim();
  if (!el) {
    onDone?.();
    return;
  }
  const scrim = document.getElementById("scrim");
  const yieldToOrient = !!opts.skipOrient;
  const finish = () => {
    el.classList.remove("is-open", "is-closing");
    el.hidden = true;
    if (scrim && !yieldToOrient) {
      scrim.classList.remove("is-open", "is-closing");
      scrim.hidden = true;
    }
    onDone?.();
    /* After a normal dismiss, size gate may need to appear */
    if (!yieldToOrient) {
      try {
        updateOrientLock();
      } catch (_) {
        /* ignore */
      }
    } else {
      /* Re-assert opaque size gate + scrim (close anim must not steal it) */
      const orient = document.getElementById("orient");
      if (orient && isStudyConstrained()) openOrientGate(orient);
    }
  };
  if (!el.classList.contains("is-open")) {
    finish();
    return;
  }
  let done = false;
  const end = () => {
    if (done) return;
    done = true;
    el.removeEventListener("transitionend", onEnd);
    finish();
  };
  const onEnd = (ev) => {
    if (
      ev.target === el &&
      (ev.propertyName === "opacity" || ev.propertyName === "transform")
    )
      end();
  };
  el.classList.remove("is-open");
  el.classList.add("is-closing");
  /* When yielding to orient, leave scrim open — orient owns the opaque backdrop */
  if (scrim && !yieldToOrient) {
    scrim.classList.remove("is-open");
    scrim.classList.add("is-closing");
  }
  el.addEventListener("transitionend", onEnd);
  setTimeout(end, 280);
}

/**
 * @param {{ persist?: boolean, persistIfChecked?: boolean }} [opts]
 * persist: always write localStorage
 * persistIfChecked: write only if the checkbox is on (default true for skip/X/done)
 */
function dismissOnboard(opts = {}) {
  const checkBox = opts.persistIfChecked !== false;
  if (opts.persist === true || (checkBox && onboardPersistChecked())) {
    setOnboardDismissed();
  }
  onboardSessionDone = true;
  closeOnboard();
}

function initOnboard() {
  const el = document.getElementById("onboard");
  if (!el) return;

  document
    .getElementById("onboard-play")
    ?.addEventListener("click", onboardTransportTogglePause);
  document
    .getElementById("onboard-mute")
    ?.addEventListener("click", toggleOnboardMute);
  document.getElementById("onboard-enter")?.addEventListener("click", onboardEnter);
  syncOnboardMuteButton();

  el.querySelectorAll("[data-onboard-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-onboard-mode");
      setOnboardStep(mode === "how" ? "how" : "where");
    });
  });

  window.addEventListener("resize", () => {
    if (!isOnboardOpen()) return;
    syncViewportRatio();
    if (el.dataset.step === "where") applyViewportStep(viewportStep);
    /* How: re-place cursor if visible after aspect change */
    if (el.dataset.step === "how") {
      const lit = document.querySelectorAll("#cards [data-card].is-lit");
      const last = lit[lit.length - 1];
      const cursor = document.getElementById("how-cursor");
      if (last && cursor && !cursor.hidden) {
        const n = Number(last.getAttribute("data-card"));
        const pt = howCardPoint(n);
        placeHowCursor(pt.x, pt.y);
      }
    }
  });

  if (shouldOfferOnboard()) {
    /* After first paint so library is behind the scrim */
    requestAnimationFrame(() => openOnboard());
  }
}



export {
  initOnboard,
  openOnboard,
  closeOnboard,
  dismissOnboard,
  isOnboardOpen,
  shouldOfferOnboard,
  stopViewportAnim,
  syncViewportRatio,
  applyViewportStep,
  isLibraryView,
};
