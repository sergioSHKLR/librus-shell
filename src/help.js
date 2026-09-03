/**
 * Help modal — static 4-pane guide (opens from bar ? / info).
 * Device viewports keep card sizes; overlay dims out-of-viewport columns
 * (header+body); folded pane icons park on column 2 (left / right by side).
 */

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
  const tpl = document.getElementById("help-ico-" + n);
  if (tpl) chip.appendChild(tpl.content.cloneNode(true));
  return chip;
}

function placeChips(root, folded) {
  clearChips(root);
  if (!folded.length) return;
  const hostCol = root.querySelector('.help-col[data-card="2"]');
  const start = hostCol?.querySelector(".help-fold-chips-start");
  const end = hostCol?.querySelector(".help-fold-chips-end");
  if (!start || !end) return;
  folded
    .slice()
    .sort((a, b) => a - b)
    .forEach((n) => {
      if (n < 2) start.appendChild(makeChip(n));
      else if (n > 2) end.appendChild(makeChip(n));
    });
}

function applyVp(root, buttons, vp) {
  const same = root.dataset.vp === vp;
  const cols = [...root.querySelectorAll(".help-col")];
  if (!vp || same) {
    delete root.dataset.vp;
    cols.forEach((c) => c.classList.remove("is-out", "is-in"));
    clearChips(root);
    buttons.forEach((b) => b.setAttribute("aria-pressed", "false"));
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
}

/** Refresh chip titles after language change. */
export function syncHelpI18n() {
  const root = document.getElementById("help-cols");
  if (!root?.dataset.vp) return;
  const buttons = [
    ...document.querySelectorAll("#help .help-dev[data-vp]"),
  ];
  applyVp(root, buttons, root.dataset.vp);
}

export function initHelp() {
  const root = document.getElementById("help-cols");
  if (!root) return;
  const buttons = [
    ...document.querySelectorAll("#help .help-dev[data-vp]"),
  ];
  buttons.forEach((b) => {
    b.addEventListener("click", () => applyVp(root, buttons, b.dataset.vp));
  });
}
