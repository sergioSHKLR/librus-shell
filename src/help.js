/**
 * Help modal — static 4-pane guide (opens from bar ? / info).
 * Device viewports keep card sizes; overlay dims out-of-viewport columns
 * (header+body); folded pane icons park on column 2 (left / right by side).
 */
import { hydrateIcons } from "./icons.js";

const CHIP_ICONS = {
  1: "toc",
  2: "layers",
  3: "search-slash",
  4: "sticky-note",
};

const MAP = {
  desktop: [1, 2, 3, 4],
  laptop: [2, 3, 4],
  tablet: [2, 3],
  phone: [2],
};

const TITLE_KEYS = {
  1: "help.tab.find",
  2: "help.tab.read",
  3: "help.tab.consult",
  4: "help.tab.annotate",
};

/** @type {(key: string) => string} */
let t = (k) => k;

/** @param {{ t?: (key: string) => string }} deps */
export function bindHelp(deps = {}) {
  if (typeof deps.t === "function") t = deps.t;
}

function clearChips(root) {
  root.querySelectorAll(".help-fold-chips").forEach((host) => {
    host.innerHTML = "";
  });
}

function makeChip(n) {
  const chip = document.createElement("span");
  chip.className = "help-fold-chip";
  chip.dataset.card = String(n);
  chip.title = t(TITLE_KEYS[n] || "");
  chip.setAttribute("aria-hidden", "true");
  const i = document.createElement("i");
  i.setAttribute("data-icon", CHIP_ICONS[n] || "toc");
  i.setAttribute("aria-hidden", "true");
  chip.appendChild(i);
  hydrateIcons(chip);
  return chip;
}

function placeChips(root, folded) {
  clearChips(root);
  if (!folded.length) return;
  const col2 = root.querySelector('.help-col[data-card="2"]');
  const col3 = root.querySelector('.help-col[data-card="3"]');
  const start2 = col2?.querySelector(".help-fold-chips-start");
  const end2 = col2?.querySelector(".help-fold-chips-end");
  const end3 = col3?.querySelector(".help-fold-chips-end");
  const vp = root.dataset.vp;
  folded
    .slice()
    .sort((a, b) => a - b)
    .forEach((n) => {
      if (n < 2) {
        start2?.appendChild(makeChip(n));
      } else if (n > 2) {
        /* Phone: Consulte is gone — no green chip on Leia. */
        if (vp === "phone" && n === 3) return;
        /* Tablet: Anote parks on Consulte (card 3), not on Leia. */
        if (vp === "tablet" && n === 4 && end3) end3.appendChild(makeChip(n));
        else end2?.appendChild(makeChip(n));
      }
    });
}

/**
 * Dim Help feature rows that are size-handicapped at the previewed device.
 * Desktop / laptop / tablet: all Consulte lookups (tablet slides the strip).
 * Phone: no Consulte (column muted); lookups all struck.
 */
function syncHelpSizeHints(root, vp) {
  const help = root?.closest("#help") || document.getElementById("help");
  if (!help) return;
  const tier = vp || "";
  help.querySelectorAll("[data-help-size]").forEach((li) => {
    const kind = li.getAttribute("data-help-size");
    let restricted = false;
    if (kind === "links") restricted = tier === "phone";
    else if (
      kind === "luz" ||
      kind === "encyc" ||
      kind === "dict" ||
      kind === "bible" ||
      kind === "kardec" ||
      kind === "map" ||
      kind === "pdf" ||
      kind === "jaas"
    )
      restricted = tier === "phone";
    li.classList.toggle("is-size-restricted", restricted);
  });
  help.querySelectorAll("[data-help-note]").forEach((el) => {
    const kind = el.getAttribute("data-help-note");
    let show = false;
    if (kind === "fold-find")
      show = tier === "laptop" || tier === "tablet" || tier === "phone";
    else if (kind === "fold-notes") show = tier === "tablet";
    else if (kind === "fold-notes-phone") show = tier === "phone";
    else if (kind === "consult-gone") show = tier === "phone";
    else if (kind === "pdf")
      show =
        document.documentElement.dataset.featPdf === "1" &&
        (tier === "desktop" || tier === "laptop");
    else if (kind === "jaas")
      show =
        document.documentElement.dataset.flavorJaas === "1" &&
        (tier === "desktop" || tier === "laptop" || tier === "tablet");
    el.hidden = !show;
  });
}

/** Phone portrait uses the same 1×4 map — no rotate gate. */
export function syncHelpPortraitGate() {}

function setVp(root, buttons, vp) {
  const cols = [...root.querySelectorAll(".help-col")];
  if (!vp) {
    delete root.dataset.vp;
    cols.forEach((c) => c.classList.remove("is-out", "is-in"));
    clearChips(root);
    buttons.forEach((b) => b.setAttribute("aria-pressed", "false"));
    syncHelpSizeHints(root, "");
    return;
  }
  const keep = new Set(MAP[vp] || []);
  const folded = [];
  root.dataset.vp = vp;
  cols.forEach((c) => {
    const n = Number(c.dataset.card);
    const on = keep.has(n);
    c.classList.toggle("is-in", on);
    c.classList.toggle("is-out", !on);
    if (!on) folded.push(n);
  });
  placeChips(root, folded);
  buttons.forEach((b) =>
    b.setAttribute("aria-pressed", b.dataset.vp === vp ? "true" : "false"),
  );
  syncHelpSizeHints(root, vp);
}

function applyVp(root, buttons, vp) {
  if (root.dataset.vp === vp) {
    setVp(root, buttons, "");
    return;
  }
  setVp(root, buttons, vp);
}

/** Force the Help device preview to this viewport (no toggle-off). */
export function syncHelpViewport(vp) {
  const root = document.getElementById("help-cols");
  if (!root) return;
  const buttons = [
    ...document.querySelectorAll("#help .help-dev[data-vp]"),
  ];
  setVp(root, buttons, vp || "");
}

/** Refresh chip titles after language change. */
export function syncHelpI18n() {
  const root = document.getElementById("help-cols");
  if (root?.dataset.vp) {
    const buttons = [
      ...document.querySelectorAll("#help .help-dev[data-vp]"),
    ];
    setVp(root, buttons, root.dataset.vp);
  }
  syncHelpMapPager();
}

export function initHelp() {
  const root = document.getElementById("help-cols");
  if (root) {
    hydrateIcons(document.getElementById("help"));
    const buttons = [
      ...document.querySelectorAll("#help .help-dev[data-vp]"),
    ];
    buttons.forEach((b) => {
      b.addEventListener("click", () => applyVp(root, buttons, b.dataset.vp));
    });
  }
  initHelpMap();
}

export function syncHelpPaneFeatures() {}

export function finishHelpPaneIntro() {
  document.getElementById("reader")?.classList.remove("is-help-spotlight");
}

/** Retired — Consulte empty body stays blank (provider banners later). */
export function startHelpPaneIntro() {
  finishHelpPaneIntro();
}

const HELP_MAP_STEPS = 5;
let helpMapBound = false;

export function resetHelpMap() {
  setHelpMapStep(1);
}

function setHelpMapStep(n) {
  const stage = document.getElementById("help-map");
  if (!stage) return;
  const step = Math.min(HELP_MAP_STEPS, Math.max(1, n));
  stage.dataset.step = String(step);
  syncHelpMapPager();
}

function syncHelpMapPager() {
  const stage = document.getElementById("help-map");
  const nav = document.getElementById("help-map-pager");
  if (!stage || !nav) return;
  const step = Number(stage.dataset.step) || 1;
  nav.setAttribute("aria-label", t("help.map.pager"));
  nav.querySelectorAll("[data-help-step]").forEach((btn) => {
    const n = Number(btn.getAttribute("data-help-step"));
    btn.setAttribute("aria-label", `${t("help.map.step")} ${n}`);
    if (n === step) btn.setAttribute("aria-current", "step");
    else btn.removeAttribute("aria-current");
  });
  const prev = nav.querySelector('[data-help-dir="-1"]');
  const next = nav.querySelector('[data-help-dir="1"]');
  if (prev instanceof HTMLButtonElement) prev.disabled = step <= 1;
  if (next instanceof HTMLButtonElement) next.disabled = step >= HELP_MAP_STEPS;
}

function initHelpMap() {
  const help = document.getElementById("help");
  const stage = document.getElementById("help-map");
  const nav = document.getElementById("help-map-pager");
  if (!help || !stage || helpMapBound) return;
  helpMapBound = true;
  hydrateIcons(help);
  syncHelpMapPager();
  stage.addEventListener("click", (ev) => {
    const t = ev.target;
    if (!(t instanceof Element)) return;
    if (t.closest(".help-map-head, .help-map-head-actions, [data-close], .help-persist, .help-map-pager")) return;
    const cur = Number(stage.dataset.step) || 1;
    if (cur < HELP_MAP_STEPS) setHelpMapStep(cur + 1);
  });
  nav?.addEventListener("click", (ev) => {
    const t = ev.target;
    if (!(t instanceof Element)) return;
    const dirBtn = t.closest("[data-help-dir]");
    if (dirBtn) {
      ev.preventDefault();
      const cur = Number(stage.dataset.step) || 1;
      setHelpMapStep(cur + Number(dirBtn.getAttribute("data-help-dir")));
      return;
    }
    const stepBtn = t.closest("[data-help-step]");
    if (stepBtn) {
      ev.preventDefault();
      setHelpMapStep(Number(stepBtn.getAttribute("data-help-step")));
    }
  });
  document.addEventListener("keydown", (ev) => {
    if (help.hidden || !help.classList.contains("is-open")) return;
    const typing =
      ev.target instanceof Element &&
      ev.target.closest("button, input, textarea, select, a");
    if (ev.key === "ArrowRight" || (ev.key === " " && !typing)) {
      ev.preventDefault();
      const cur = Number(stage.dataset.step) || 1;
      if (cur < HELP_MAP_STEPS) setHelpMapStep(cur + 1);
    } else if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      const cur = Number(stage.dataset.step) || 1;
      if (cur > 1) setHelpMapStep(cur - 1);
    }
  });
}
