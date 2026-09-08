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

/** Phone portrait: hide the 4-pane guide and ask to rotate. */
export function syncHelpPortraitGate() {
  const help = document.getElementById("help");
  if (!help) return;
  const w = window.innerWidth || 0;
  const h = window.innerHeight || 0;
  const phonePort = w > 0 && w <= 920 && w <= h;
  help.classList.toggle("is-phone-portrait", phonePort);
  const rot = document.getElementById("help-rotate");
  if (rot) rot.hidden = !phonePort;
}

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
  if (!root?.dataset.vp) return;
  const buttons = [
    ...document.querySelectorAll("#help .help-dev[data-vp]"),
  ];
  setVp(root, buttons, root.dataset.vp);
}

export function initHelp() {
  const root = document.getElementById("help-cols");
  if (!root) return;
  hydrateIcons(document.getElementById("help"));
  const buttons = [
    ...document.querySelectorAll("#help .help-dev[data-vp]"),
  ];
  buttons.forEach((b) => {
    b.addEventListener("click", () => applyVp(root, buttons, b.dataset.vp));
  });
}
