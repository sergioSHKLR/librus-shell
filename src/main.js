/**
 * librus-shell — lean multi-flavor reader
 * Views · i18n · light/dark · 4 panes → 1 · typo · providers · Hypothesis
 * Optional: PDF / JaaS via FEAT flags
 */
import "./styles.css";
import { registerSW } from "virtual:pwa-register";
import { FEAT, applyFeatureDom } from "./features.js";
import { hydrateIcons } from "./icons.js";
import {
  loadFlavor,
  getFlavor,
  getFlavorId,
  filterCatalog,
  findPairedEdition,
  applyFlavorBrand,
  flavorFavicon,
} from "./flavor.js";

const THEME_KEY = "librus-theme";
const GUIDE_KEY = "librus-color-guide";
/** @type {'full'|'soft'|'min'} */
let colorGuide = "full";
const LANG_KEY = "librus-lang";
const ORIENT_DISMISS_KEY = "librus-orient-dismiss";
const APP_VERSION = "0.9.0-poc";

const I18N = {
  pt: {
    "pane.find": "1. Ache",
    "pane.read": "2. Leia",
    "pane.consult": "3. Consulte",
    "pane.annotate": "4. Anote",
    "library.title": "LIBRUS",
    "library.cta": "Ache · Leia · Consulte · Anote",
    "library.heading": "Biblioteca",
    "tab.toc": "Sumário",
    "tab.search": "Busca",
    "tab.book": "Páginas",
    "tab.typo": "Tipo",
    "tab.context": "Contexto",
    "tab.pdf": "PDF",
    "tab.video": "Vídeo",
    "tab.notes": "Notas",
    "btn.prev": "Ant.",
    "btn.next": "Próx.",
    "btn.back": "Voltar",
    "btn.reload": "Recarregar",
    "btn.zoomIn": "Mais",
    "btn.zoomOut": "Menos",
    "btn.joinVideo": "Vídeo",
    "btn.joinVoice": "Voz",
    "btn.leave": "Sair",
    "ph.filter": "Filtrar…",
    "ph.search": "Buscar…",
    "typo.size": "Texto",
    "typo.line": "Linhas",
    "typo.measure": "Coluna",
    "typo.narrow": "Estreita",
    "typo.medium": "Média",
    "typo.wide": "Larga",
    "typo.alignStart": "Alinhar",
    "typo.alignJustify": "Justificar",
    "typo.sans": "Sans",
    "typo.serif": "Serif",
    "tip.typo.size": "Tamanho do texto",
    "tip.typo.line": "Altura da linha",
    "tip.typo.measure": "Largura da coluna",
    "tip.typo.align": "Alinhamento",
    "tip.typo.font": "Fonte",
    "tip.page.prev": "Página anterior",
    "tip.page.next": "Próxima página",
    "tip.ctx.back": "Voltar na consulta",
    "tip.ctx.reload": "Recarregar página de consulta",
    "tip.close": "Fechar",
    "tip.home": "Biblioteca",
    "tip.orient.dismiss": "Continuar em retrato",
    "prov.luz": "Luz Espírita",
    "prov.encyc": "Enciclopédia",
    "prov.dict": "Dicionário",
    "prov.map": "Mapas",
    "prov.bible": "Bíblia",
    "prov.kardec": "Kardecpedia",
    "notes.hypo": "Anotações",
    "notes.hint":
      "Notas abrem na barra lateral do Hypothesis (ícone no canto).",
    "notes.off": "Hypothesis desligado neste build.",
    "set.title": "Ajustes",
    "set.hint": "Idioma e tema: botões na barra inferior.",
    "set.guide": "Guia de cor",
    "set.guideHint":
      "Cores do chrome do leitor (abas e barras). O tema claro/escuro fica na barra inferior.",
    "set.guideFull": "Completo",
    "set.guideSoft": "Suave",
    "set.guideMin": "Mínimo",
    "set.theme": "Tema",
    "set.system": "Sistema",
    "set.light": "Claro",
    "set.dark": "Escuro",
    "set.lang": "Idioma",
    "bar.lang": "Idioma",
    "bar.theme": "Tema",
    "bar.help": "Ajuda",
    "bar.settings": "Ajustes",
    "help.title": "Ajuda",
    "help.heading": "Começar",
    "help.s1": "Abra um livro na biblioteca.",
    "help.s2": "Leia no centro; anote com o Hypothesis.",
    "help.s3": "Em tela larga, consulte fontes à direita.",
    "help.s4":
      "Sumário e busca no painel esquerdo (ou abas dobradas na faixa principal).",
    "help.tagline": "annotate to assimilate",
    "help.pwa": "PWA · Hypothesis · Vite",
    "orient.title": "Gire o dispositivo",
    "orient.body":
      "A experiência em modo retrato é limitada. Gire o aparelho para paisagem (sentido anti-horário).",
    "orient.dismiss": "Continuar mesmo assim",
    "set.jitsi": "Videoconferência (JaaS)",
    "set.jitsiAppId": "App ID (8x8 JaaS)",
    "set.jitsiRoom": "Sala",
    "set.jitsiName": "Nome de exibição",
    "pdf.upload": "Upload",
    "pdf.unload": "Unload",
    "pdf.uploadTitle": "Envie um PDF pela barra acima.",
    "pdf.mockTitle": "Documento de exemplo",
    "pdf.mockPage": "Página {n} de {total}",
    "pdf.mockHint": "Mock PDF — use a barra para navegar e ampliar.",
    "pdf.mockLoaded": "PDF mock carregado",
    "pdf.mockCleared": "PDF mock removido",
    "toc.empty": "Nenhum item no sumário.",
    "search.empty": "Digite para buscar no livro…",
    "search.none": "Nenhum resultado.",
    "search.hits": "{n} resultados",
    "meet.hint": "Configure o App ID JaaS em Ajustes.",
    "meet.needAppId": "Informe o App ID JaaS em Ajustes.",
    "meet.connecting": "A conectar…",
    "meet.loadError": "Não foi possível carregar o JaaS.",
    "meet.inVideo": "Em vídeo · {room}",
    "meet.inVoice": "Em voz · {room}",
    "meet.mockIdle": "Sala de vídeo (mock)",
    "meet.mockHint": "Vídeo / voz simulados — JaaS real sob flag de build.",
    "meet.mockVideo": "Em vídeo (mock) · librus-estudo",
    "meet.mockVoice": "Em voz (mock) · librus-estudo",
    "meet.mockLeft": "Sala de vídeo (mock)",
  },
  en: {
    "pane.find": "1. Find",
    "pane.read": "2. Read",
    "pane.consult": "3. Consult",
    "pane.annotate": "4. Annotate",
    "library.title": "LIBRUS",
    "library.cta": "Find · Read · Consult · Annotate",
    "library.heading": "Library",
    "tab.toc": "TOC",
    "tab.search": "Search",
    "tab.book": "Pages",
    "tab.typo": "Type",
    "tab.context": "Context",
    "tab.pdf": "PDF",
    "tab.video": "Video",
    "tab.notes": "Notes",
    "btn.prev": "Prev",
    "btn.next": "Next",
    "btn.back": "Back",
    "btn.reload": "Reload",
    "btn.zoomIn": "In",
    "btn.zoomOut": "Out",
    "btn.joinVideo": "Video",
    "btn.joinVoice": "Voice",
    "btn.leave": "Leave",
    "ph.filter": "Filter…",
    "ph.search": "Search…",
    "typo.size": "Size",
    "typo.line": "Lines",
    "typo.measure": "Column",
    "typo.narrow": "Narrow",
    "typo.medium": "Medium",
    "typo.wide": "Wide",
    "typo.alignStart": "Start",
    "typo.alignJustify": "Justify",
    "typo.sans": "Sans",
    "typo.serif": "Serif",
    "tip.typo.size": "Text size",
    "tip.typo.line": "Line height",
    "tip.typo.measure": "Column width",
    "tip.typo.align": "Alignment",
    "tip.typo.font": "Font family",
    "tip.page.prev": "Previous page",
    "tip.page.next": "Next page",
    "tip.ctx.back": "Go back in context",
    "tip.ctx.reload": "Reload context page",
    "tip.close": "Close",
    "tip.home": "Library",
    "tip.orient.dismiss": "Continue in portrait",
    "prov.luz": "Luz",
    "prov.encyc": "Encyc",
    "prov.dict": "Dict",
    "prov.map": "Maps",
    "prov.bible": "Bible",
    "prov.kardec": "Kardec",
    "notes.hypo": "Hypothesis",
    "notes.hint": "Notes open in the Hypothesis sidebar (corner control).",
    "notes.off": "Hypothesis disabled in this build.",
    "set.title": "Settings",
    "set.hint": "Language and theme: use the bottom bar buttons.",
    "set.guide": "Color guide",
    "set.guideHint":
      "Reader chrome colors (tabs and toolbars). Light/dark theme stays on the bottom bar.",
    "set.guideFull": "Full",
    "set.guideSoft": "Soft",
    "set.guideMin": "Minimal",
    "set.theme": "Theme",
    "set.system": "System",
    "set.light": "Light",
    "set.dark": "Dark",
    "set.lang": "Language",
    "bar.lang": "Language",
    "bar.theme": "Theme",
    "bar.help": "Help",
    "bar.settings": "Settings",
    "help.title": "Help",
    "help.heading": "Get started",
    "help.s1": "Open a book from the library.",
    "help.s2": "Read in the center; annotate with Hypothesis.",
    "help.s3": "On wide screens, consult sources on the right.",
    "help.s4":
      "TOC and search live in the left pane (or folded tabs on the main strip).",
    "help.tagline": "annotate to assimilate",
    "help.pwa": "PWA · Hypothesis · Vite",
    "orient.title": "Rotate your device",
    "orient.body":
      "Portrait mode is limited. Rotate the device to landscape (counter-clockwise).",
    "orient.dismiss": "Continue anyway",
    "set.jitsi": "Video conference (JaaS)",
    "set.jitsiAppId": "App ID (8x8 JaaS)",
    "set.jitsiRoom": "Room",
    "set.jitsiName": "Display name",
    "pdf.upload": "Upload",
    "pdf.unload": "Unload",
    "pdf.uploadTitle": "Upload a PDF from the toolbar above.",
    "pdf.mockTitle": "Sample document",
    "pdf.mockPage": "Page {n} of {total}",
    "pdf.mockHint": "Mock PDF — use the toolbar to page and zoom.",
    "pdf.mockLoaded": "Mock PDF loaded",
    "pdf.mockCleared": "Mock PDF cleared",
    "toc.empty": "No TOC items.",
    "search.empty": "Type to search this book…",
    "search.none": "No results.",
    "search.hits": "{n} results",
    "meet.hint": "Set JaaS App ID in Settings.",
    "meet.needAppId": "Enter JaaS App ID in Settings.",
    "meet.connecting": "Connecting…",
    "meet.loadError": "Could not load JaaS.",
    "meet.inVideo": "In video · {room}",
    "meet.inVoice": "In voice · {room}",
    "meet.mockIdle": "Video room (mock)",
    "meet.mockHint": "Simulated video / voice — real JaaS behind build flag.",
    "meet.mockVideo": "In video (mock) · librus-estudo",
    "meet.mockVoice": "In voice (mock) · librus-estudo",
    "meet.mockLeft": "Video room (mock)",
  },
};

const PROVIDERS = {
  luz: {
    home: "https://www.luzespirita.org.br/",
    search:
      "https://www.luzespirita.org.br/index.php?lisPage=enciclopedia&item={query}",
  },
  encyc: {
    home: "https://{lang}.wikipedia.org/",
    search: "https://{lang}.wikipedia.org/wiki/{query}",
  },
  dict: {
    home: "https://{lang}.wiktionary.org/",
    search: "https://{lang}.wiktionary.org/wiki/{query}",
  },
  map: {
    /* full site blocks iframes (X-Frame-Options); embed URL used via mapEmbedUrl() */
    home: "https://www.openstreetmap.org/export/embed.html?bbox=-20%2C-40%2C60%2C70&layer=mapnik",
    search: "https://www.openstreetmap.org/search?query={query}",
    external: "https://www.openstreetmap.org/search?query={query}",
  },
  bible: {
    home: "https://www.bible.com/pt/bible/212",
    search: "https://www.bible.com/search/bible?q={query}",
  },
  kardec: {
    home: "https://www.kardecpedia.com/",
    search: "https://www.kardecpedia.com/pt/busca?q={query}",
  },
};

const MEASURES = ["narrow", "medium", "wide"];
const FONT_SIZES = [0.85, 0.95, 1, 1.1, 1.25, 1.4, 1.5];
const LINE_HEIGHTS = [1.35, 1.5, 1.65, 1.85, 2.1];
const ALIGNS = ["start", "justify"];
/* Reading faces only — order: default first (serif ≈ printed book) */
const FONTS = ["serif", "sans"];
const BOOK_CACHE = {};
/** Full shelf from disk (all flavors) */
let CATALOG_ALL = [];
/** Filtered shelf for active flavor */
let CATALOG = [];
let currentLang = "pt";
/** User preference: system | light | dark */
let themePref = "system";
/** Resolved paint: light | dark */
let currentTheme = "light";
let currentBook = null;
let currentSlug = "";
let pageIndex = 0;
let fontSize = 1;
let lineHeight = 1.65;
let measure = "medium";
let textAlign = "start";
let fontFamily = "serif";
let searchQuery = "";
let hypoTimer = null;
let lastCtxUrl = "";
/** Simple iframe history for Context back button */
const ctxHistory = [];
/** Mock PDF state (used when FEAT.pdf is off) */
let mockPdfPage = 1;
const MOCK_PDF_TOTAL = 12;
let mockPdfZoom = 1;
let mockPdfLoaded = true;
/** Mock video: '' | 'video' | 'voice' */
let mockMeetMode = "";

const bookEl = () => document.getElementById("book");
const tocEl = () => document.getElementById("toc");
const hitsEl = () => document.getElementById("hits");
const ctxEl = () => document.getElementById("ctx");

function t(key) {
  const pack = I18N[currentLang] || I18N.pt;
  return pack[key] || I18N.en[key] || key;
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
  });
  document.documentElement.lang = currentLang === "en" ? "en" : "pt-BR";
  document.body.dataset.lang = currentLang;
  if (typeof syncTypoButtons === "function") syncTypoButtons();
  if (typeof syncChromeBar === "function") syncChromeBar();
  if (typeof syncTooltips === "function") syncTooltips();
  if (
    import.meta.env.VITE_FEAT_PDF !== "1" &&
    typeof renderMockPdf === "function"
  ) {
    renderMockPdf();
  }
  if (import.meta.env.VITE_FEAT_JAAS !== "1" && !mockMeetMode) {
    const el = document.getElementById("meet-status");
    if (el) el.textContent = t("meet.mockIdle");
  }
}

/**
 * Native title + aria-label for every interactive control.
 * Prefer visible i18n label; fall back to tip.* keys / attribute maps.
 */
function tipForButton(btn) {
  if (!(btn instanceof Element)) return "";

  const mode = btn.getAttribute("data-mode");
  if (mode) {
    const map = {
      "find:toc": "tab.toc",
      "find:search": "tab.search",
      "read:book": "tab.book",
      "read:typo": "tab.typo",
      "consult:web": "tab.context",
      "consult:pdf": "tab.pdf",
      "consult:video": "tab.video",
      "annotate:notes": "tab.notes",
    };
    if (map[mode]) return t(map[mode]);
  }

  const typo = btn.getAttribute("data-typo");
  if (typo) return t("tip.typo." + typo);

  const page = btn.getAttribute("data-page");
  if (page === "prev") return t("tip.page.prev");
  if (page === "next") return t("tip.page.next");

  const ctx = btn.getAttribute("data-ctx");
  if (ctx === "back") return t("tip.ctx.back");
  if (ctx === "reload") return t("tip.ctx.reload");

  const prov = btn.getAttribute("data-provider");
  if (prov) return t("prov." + prov);

  const pdf = btn.getAttribute("data-pdf");
  if (pdf === "upload") return t("pdf.upload");
  if (pdf === "unload") return t("pdf.unload");
  if (pdf === "prev") return t("tip.page.prev");
  if (pdf === "next") return t("tip.page.next");
  if (pdf === "in") return t("btn.zoomIn");
  if (pdf === "out") return t("btn.zoomOut");

  const jitsi = btn.getAttribute("data-jitsi");
  if (jitsi === "join-video") return t("btn.joinVideo");
  if (jitsi === "join-voice") return t("btn.joinVoice");
  if (jitsi === "leave") return t("btn.leave");

  if (
    btn.getAttribute("data-go") === "library" ||
    btn.getAttribute("data-go") === "home"
  )
    return t("tip.home");
  if (btn.getAttribute("data-cycle") === "lang") return t("bar.lang");
  if (btn.getAttribute("data-cycle") === "theme") return t("bar.theme");
  if (btn.getAttribute("data-open") === "help") return t("bar.help");
  if (btn.getAttribute("data-open") === "settings") return t("bar.settings");
  if (btn.hasAttribute("data-close")) return t("tip.close");
  if (btn.id === "orient-dismiss") return t("tip.orient.dismiss");

  /* Visible text / i18n span */
  const i18n = btn.querySelector("[data-i18n]");
  if (i18n) {
    const key = i18n.getAttribute("data-i18n");
    if (key) return t(key);
  }
  const labelEl = btn.querySelector(
    "[data-typo-label], span:not([aria-hidden])",
  );
  const text = (labelEl?.textContent || btn.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

function setTip(el, text) {
  if (!el || !text) return;
  el.setAttribute("title", text);
  /* Don't clobber richer aria if already set to something longer */
  const existing = el.getAttribute("aria-label");
  if (
    !existing ||
    existing === el.getAttribute("title") ||
    existing.length < 2
  ) {
    el.setAttribute("aria-label", text);
  }
}

function syncTooltips(root = document) {
  root.querySelectorAll("button").forEach((btn) => {
    const tip = tipForButton(btn);
    if (tip) setTip(btn, tip);
  });
  /* Inputs that act as controls */
  const pageN = root.querySelector("#page-n");
  if (pageN) {
    const tip = currentLang === "en" ? "Page number" : "Número da página";
    pageN.setAttribute("title", tip);
    pageN.setAttribute("aria-label", tip);
  }
  const pdfPage = root.querySelector("#pdf-page-input");
  if (pdfPage) {
    const tip = currentLang === "en" ? "PDF page number" : "Página do PDF";
    pdfPage.setAttribute("title", tip);
    pdfPage.setAttribute("aria-label", tip);
  }
  const tocQ = root.querySelector("#toc-q");
  if (tocQ) {
    const tip = t("ph.filter");
    tocQ.setAttribute("title", tip);
  }
  const searchQ = root.querySelector("#search-q");
  if (searchQ) {
    const tip = t("ph.search");
    searchQ.setAttribute("title", tip);
  }
}

/** Update bottom-bar cycler labels (lang + theme). */
function syncChromeBar() {
  /* Lang: path glyphs (lang-pt / lang-en) — same stroke as other bar icons */
  const langIconName = currentLang === "en" ? "lang-en" : "lang-pt";
  const langHost = document.getElementById("bar-lang-icon");
  if (langHost) {
    langHost.setAttribute("data-icon", langIconName);
    langHost.innerHTML = "";
    hydrateIcons(langHost.parentElement || langHost);
  }
  const langBtn = document.getElementById("bar-lang");
  if (langBtn) {
    const langName = currentLang === "en" ? "English" : "Português";
    langBtn.title = t("bar.lang") + " · " + langName;
    langBtn.setAttribute("aria-label", t("bar.lang") + " · " + langName);
  }

  /* Theme: monitor (system) · sun (light) · moon (dark) */
  const themeIcon =
    themePref === "light" ? "sun" : themePref === "dark" ? "moon" : "monitor";
  const themeHost = document.getElementById("bar-theme-icon");
  if (themeHost) {
    themeHost.setAttribute("data-icon", themeIcon);
    themeHost.innerHTML = "";
    hydrateIcons(themeHost.parentElement || themeHost);
  }
  const themeBtn = document.getElementById("bar-theme");
  if (themeBtn) {
    const themeName =
      themePref === "light"
        ? t("set.light")
        : themePref === "dark"
          ? t("set.dark")
          : t("set.system");
    themeBtn.title = t("bar.theme") + " · " + themeName;
    themeBtn.setAttribute("aria-label", t("bar.theme") + " · " + themeName);
  }

  const helpBtn = document.querySelector('#bar [data-open="help"]');
  if (helpBtn) {
    helpBtn.title = t("bar.help");
    helpBtn.setAttribute("aria-label", t("bar.help"));
  }
  const setBtn = document.querySelector('#bar [data-open="settings"]');
  if (setBtn) {
    setBtn.title = t("bar.settings");
    setBtn.setAttribute("aria-label", t("bar.settings"));
  }
}

function cycleLang() {
  setLang(currentLang === "en" ? "pt" : "en");
}

const THEME_CYCLE = ["system", "light", "dark"];

function cycleTheme() {
  const i = THEME_CYCLE.indexOf(themePref);
  const next = THEME_CYCLE[(i < 0 ? 0 : i + 1) % THEME_CYCLE.length];
  setTheme(/** @type {'system'|'light'|'dark'} */ (next));
}

/** Default OS/PWA title-bar greys (not pure white/black, not brand). */
const CHROME_GREY_LIGHT = "#e8eaed";
const CHROME_GREY_DARK = "#202124";

/**
 * Top browser / installed-PWA chrome only — neutral chrome grey.
 * Brand colors stay in-app (mark, accents); never paint the OS status/title bar.
 * @param {'light'|'dark'} resolved
 * @param {'system'|'light'|'dark'} [pref]
 */
function syncBrowserChrome(resolved, pref = themePref) {
  const light = CHROME_GREY_LIGHT;
  const dark = CHROME_GREY_DARK;
  const paint = resolved === "dark" ? dark : light;
  const meta = document.getElementById("meta-theme-color");
  if (meta) meta.content = paint;
  /* media-tagged metas: when user locks light/dark, both match lock */
  const metaL = document.getElementById("meta-theme-color-light");
  const metaD = document.getElementById("meta-theme-color-dark");
  if (pref === "light") {
    if (metaL) metaL.content = light;
    if (metaD) metaD.content = light;
  } else if (pref === "dark") {
    if (metaL) metaL.content = dark;
    if (metaD) metaD.content = dark;
  } else {
    if (metaL) metaL.content = light;
    if (metaD) metaD.content = dark;
  }
}

/**
 * Color guide: full soft chrome · soft diluted · min flat + tab top accent only.
 * Independent of theme (light/system/dark).
 * @param {'full'|'soft'|'min'} mode
 * @param {{ persist?: boolean }} [opts]
 */
function setColorGuide(mode, { persist = true } = {}) {
  if (mode !== "full" && mode !== "soft" && mode !== "min") mode = "full";
  colorGuide = mode;
  document.documentElement.dataset.guide = mode;
  if (persist) {
    try {
      localStorage.setItem(GUIDE_KEY, mode);
    } catch (_) {
      /* ignore */
    }
  }
  document.querySelectorAll('input[name="color-guide"]').forEach((el) => {
    if (el instanceof HTMLInputElement) {
      el.checked = el.value === mode;
    }
  });
}

function syncColorGuideInputs() {
  document.querySelectorAll('input[name="color-guide"]').forEach((el) => {
    if (el instanceof HTMLInputElement) {
      el.checked = el.value === colorGuide;
    }
  });
}

function setLang(lang, { persist = true } = {}) {
  currentLang = lang === "en" ? "en" : "pt";
  if (persist) {
    try {
      localStorage.setItem(LANG_KEY, currentLang);
    } catch (_) {
      /* ignore */
    }
  }
  applyI18n();
  try {
    applyFlavorBrand(getFlavor(), currentLang, currentTheme);
    hydrateIcons(document.getElementById("library"));
  } catch (_) {
    /* ignore */
  }
  /* Rebuild shelf for this language (EN/PT Holmes editions, etc.) */
  CATALOG = filterCatalog(CATALOG_ALL, undefined, currentLang);
  renderLibrary();

  /* If a book is open, swap to the paired edition when available */
  if (currentBook || currentSlug) {
    const cur =
      CATALOG_ALL.find((e) => e && e.id === currentSlug) ||
      currentBook ||
      null;
    const pair = findPairedEdition(CATALOG_ALL, cur, currentLang);
    if (pair && pair.id && pair.id !== currentSlug) {
      const keepPage = pageIndex;
      openBook(pair.id)
        .then(() => {
          if (keepPage > 0) goToPage(keepPage);
        })
        .catch((err) => console.warn("[POC] lang book swap", err));
      return;
    }
    renderToc();
    renderPage();
  }
}

function systemIsDark() {
  try {
    return !!(
      window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches
    );
  } catch (_) {
    return false;
  }
}

function resolveTheme(pref) {
  if (pref === "dark" || pref === "light") return pref;
  return systemIsDark() ? "dark" : "light";
}

/**
 * @param {'system'|'light'|'dark'} pref
 */
function setTheme(pref, { persist = true, reloadHypo = true } = {}) {
  if (pref !== "light" && pref !== "dark" && pref !== "system") pref = "system";
  themePref = pref;
  const resolved = resolveTheme(pref);
  const changed = resolved !== currentTheme;
  currentTheme = resolved;
  document.documentElement.dataset.themePref = themePref;
  document.documentElement.dataset.theme = currentTheme;
  document.documentElement.style.colorScheme = currentTheme;
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, themePref);
    } catch (_) {
      /* ignore */
    }
  }
  syncBrowserChrome(currentTheme, themePref);
  const fav = document.getElementById("favicon");
  if (fav) fav.href = flavorFavicon(currentTheme);
  try {
    applyFlavorBrand(getFlavor(), currentLang, currentTheme);
  } catch (_) {
    /* ignore */
  }
  syncChromeBar();
  /* Soft Hypo theme hook only — full destroy blanks the reader */
  if (
    reloadHypo &&
    changed &&
    import.meta.env.VITE_FEAT_HYPO === "1" &&
    document.body.dataset.view === "reader"
  ) {
    import("./features/hypo.js")
      .then((m) => m.reloadHypothesisForTheme())
      .catch(() => {});
  }
  /* Ensure book chrome still painted after theme paint */
  if (document.body.dataset.view === "reader" && currentBook) {
    try {
      renderPage();
    } catch (_) {
      /* ignore */
    }
  }
}

function watchSystemTheme() {
  if (!window.matchMedia) return;
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (themePref === "system") setTheme("system", { persist: false });
  };
  if (typeof mq.addEventListener === "function")
    mq.addEventListener("change", onChange);
  else if (typeof mq.addListener === "function") mq.addListener(onChange);
}

/* ── Onboard viewport animation ──────────────────── */

const VIEWPORT_STEPS = [
  { key: "desktop", cards: [1, 2, 3, 4] },
  { key: "laptop", cards: [2, 3, 4] },
  { key: "tablet", cards: [2, 3] },
  { key: "mobile", cards: [2] },
];
const VIEWPORT_HOLD_MS = 1600;
let viewportStep = 0;
let viewportTimer = null;
let viewportRunning = false;

/** Cards use the same aspect ratio as the browser window. */
function syncViewportRatio() {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  const ratio = Math.max(0.45, Math.min(3.2, w / h));
  document.documentElement.style.setProperty("--vp-ratio", String(ratio));
  document.documentElement.dataset.vpOrient = w >= h ? "landscape" : "portrait";
}

function layoutViewportFrame(cardNums) {
  const stage = document.getElementById("cards-stage");
  const frame = document.getElementById("viewport-frame");
  const label = document.getElementById("viewport-label");
  const cardsRoot = document.getElementById("cards");
  if (!stage || !frame || !cardsRoot) return;

  const articles = [...cardsRoot.querySelectorAll("[data-card]")];
  const active = articles.filter((el) =>
    cardNums.includes(Number(el.dataset.card)),
  );
  if (!active.length) return;

  const stageBox = stage.getBoundingClientRect();
  /* Onboard not visible / zero layout yet */
  if (stageBox.width < 4 || stageBox.height < 4) {
    frame.classList.remove("is-on");
    return false;
  }

  let minL = Infinity;
  let minT = Infinity;
  let maxR = -Infinity;
  let maxB = -Infinity;
  active.forEach((el) => {
    const r = el.getBoundingClientRect();
    minL = Math.min(minL, r.left);
    minT = Math.min(minT, r.top);
    maxR = Math.max(maxR, r.right);
    maxB = Math.max(maxB, r.bottom);
  });

  if (!isFinite(minL) || maxR - minL < 4) {
    frame.classList.remove("is-on");
    return false;
  }

  const pad = 8;
  frame.style.left = minL - stageBox.left - pad + "px";
  frame.style.top = minT - stageBox.top - pad + "px";
  frame.style.width = maxR - minL + pad * 2 + "px";
  frame.style.height = maxB - minT + pad * 2 + "px";
  frame.classList.add("is-on");

  articles.forEach((el) => {
    const n = Number(el.dataset.card);
    el.classList.toggle("out", !cardNums.includes(n));
  });

  if (label) {
    const step = VIEWPORT_STEPS.find((s) => s.cards.join() === cardNums.join());
    const key = step ? "onboard." + step.key : "onboard.desktop";
    label.setAttribute("data-i18n", key);
    label.textContent = t(key);
  }
  return true;
}

function applyViewportStep(index) {
  viewportStep =
    ((index % VIEWPORT_STEPS.length) + VIEWPORT_STEPS.length) %
    VIEWPORT_STEPS.length;
  const step = VIEWPORT_STEPS[viewportStep];
  layoutViewportFrame(step.cards);
}

function startViewportAnim() {
  stopViewportAnim();
  viewportRunning = true;
  syncViewportRatio();
  const kick = () => {
    if (!viewportRunning) return;
    applyViewportStep(viewportStep || 0);
    const frame = document.getElementById("viewport-frame");
    /* If cards not laid out yet, frame stays 0×0 — retry shortly */
    if (frame && parseFloat(frame.style.width || "0") < 8) {
      setTimeout(() => {
        if (viewportRunning) applyViewportStep(viewportStep || 0);
      }, 80);
    }
  };
  // Wait for onboard to become visible + reflow after unhiding
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      kick();
      viewportTimer = setInterval(() => {
        if (!viewportRunning) return;
        applyViewportStep(viewportStep + 1);
      }, VIEWPORT_HOLD_MS);
    });
  });
}

function stopViewportAnim() {
  viewportRunning = false;
  if (viewportTimer) {
    clearInterval(viewportTimer);
    viewportTimer = null;
  }
}

function setView(name) {
  /* Only library + reader remain as full screens */
  if (name !== "library" && name !== "reader") name = "library";
  document.body.dataset.view = name;
  document.querySelectorAll("[data-screen]").forEach((el) => {
    const on = el.id === name;
    el.hidden = !on;
  });
  const bar = document.getElementById("bar");
  if (bar) {
    bar.hidden = false;
    bar.style.display = "flex";
  }
  try {
    hydrateIcons(document.getElementById("bar"));
  } catch (_) {
    /* ignore */
  }
  if (name === "reader") {
    scheduleHypothesis();
    try {
      hydrateIcons(document.getElementById("reader"));
    } catch (_) {
      /* ignore */
    }
  } else if (hypoTimer) {
    clearTimeout(hypoTimer);
    hypoTimer = null;
  }
  stopViewportAnim();
  syncChromeBar();
}

function parsePath(pathname) {
  let p = pathname || "/";
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  /* Splash/onboard routes redirect to library */
  if (
    p === "" ||
    p === "/" ||
    p === "/index.html" ||
    p === "/library" ||
    p === "/onboard" ||
    p === "/splash"
  ) {
    return { view: "library" };
  }
  const m = p.match(/\/books\/([^/]+)(?:\/(\d+))?$/);
  if (m) {
    return {
      view: "reader",
      slug: decodeURIComponent(m[1]),
      page: m[2] ? Math.max(0, parseInt(m[2], 10) - 1) : 0,
    };
  }
  return { view: "library" };
}

function pathFor(view, opts = {}) {
  if (view === "reader") {
    const slug = opts.slug || currentSlug || "study-scarlet";
    const page = opts.page != null ? opts.page : pageIndex;
    return page > 0
      ? "/books/" + encodeURIComponent(slug) + "/" + (page + 1)
      : "/books/" + encodeURIComponent(slug);
  }
  return "/library";
}

function navigate(path, { replace = false, skip = false } = {}) {
  const url = path.startsWith("/") ? path : "/" + path;
  if (replace) history.replaceState({ path: url }, "", url);
  else if (location.pathname !== url) history.pushState({ path: url }, "", url);
  if (!skip) applyRoute();
}

async function applyRoute() {
  const route = parsePath(location.pathname);
  setView(route.view);
  if (route.view === "reader" && route.slug) {
    try {
      await enterReader(route.slug, route.page || 0);
    } catch (err) {
      console.warn("[POC] book load", err);
      navigate("/library", { replace: true });
    }
  }
  if (route.view === "library") {
    try {
      if (!CATALOG.length) await loadCatalog();
      else renderLibrary();
    } catch (_) {
      /* ignore */
    }
  }
  handleTabFolding();
}

/** Load book, paint TOC + page, set reader chrome — single path for open + route */
async function enterReader(slug, page = 0) {
  await loadBook(slug);
  pageIndex = Math.max(0, Math.min((currentBook.pages?.length || 1) - 1, page));
  setView("reader");
  setMode("find", "toc");
  setMode("read", "typo");
  setMode("consult", "web");
  setMode("annotate", "notes");
  applyTypography();
  renderPage();
  renderToc();
  lastFoldKey = ""; /* force fold rebuild on enter reader */
  handleTabFolding(true);
  applyI18n();
  try {
    hydrateIcons(document.getElementById("reader"));
  } catch (_) {
    /* ignore */
  }
  syncMainStripActive();
}

function scheduleHypothesis() {
  if (import.meta.env.VITE_FEAT_HYPO !== "1") return;
  if (hypoTimer) clearTimeout(hypoTimer);
  hypoTimer = setTimeout(() => {
    hypoTimer = null;
    if (document.body.dataset.view !== "reader") return;
    import("./features/hypo.js")
      .then((m) => {
        m.installHypothesisConfig();
        return m.ensureHypothesis();
      })
      .catch((e) => console.warn("[POC] Hypothesis", e));
  }, 400);
}

/* ── Modes / panes ───────────────────────────────── */

/**
 * Strip highlight while folded: only this mode is lit on #main-tabs.
 * lastReadMode restored when find/consult overlays close (so Tipo/Páginas stay blue).
 */
let focusMode = "read:typo";
let lastReadMode = "read:typo";
/** Last fold flags — skip DOM rebuild when only width jittered */
let lastFoldKey = "";

/**
 * Close p1/p3 overlays without flashing the white tab strip mid-slide.
 * Keep .overlay-single / .is-closing until transform finishes.
 */
function closeFoldOverlays({ restoreRead = true } = {}) {
  const panels = ["p1", "p3"]
    .map((id) => document.getElementById(id))
    .filter((el) => el && el.classList.contains("overlay"));

  const wasOpen = panels.length > 0;

  panels.forEach((el) => {
    /* Keep single-tool chrome while sliding out */
    el.classList.add("is-closing", "overlay-single");
    el.classList.remove("overlay");
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener("transitionend", onEnd);
      el.classList.remove("is-closing", "overlay-single");
    };
    const onEnd = (ev) => {
      if (ev.target === el && ev.propertyName === "transform") finish();
    };
    el.addEventListener("transitionend", onEnd);
    setTimeout(finish, 320);
  });

  if (wasOpen && restoreRead) {
    focusMode = lastReadMode || "read:typo";
    const [g, p] = focusMode.split(":");
    if (g === "read" && p) {
      document.querySelectorAll('[data-mode^="read:"]').forEach((btn) => {
        btn.classList.toggle("on", btn.getAttribute("data-mode") === focusMode);
      });
      document.querySelectorAll('[data-tool^="read:"]').forEach((tb) => {
        const match = tb.getAttribute("data-tool") === focusMode;
        tb.classList.toggle("on", match);
        tb.hidden = !match;
      });
    }
  }
  syncMainStripActive();
}

/** Paint .on on #main-tabs from focusMode (folded) or per-group tools (wide). */
function syncMainStripActive() {
  const strip = document.getElementById("main-tabs");
  if (!strip) return;
  const w = window.innerWidth;
  const foldFind = w <= 1650;
  const foldConsult = w <= 920;

  if (foldFind || foldConsult) {
    strip.querySelectorAll("button[data-mode]").forEach((btn) => {
      btn.classList.toggle("on", btn.getAttribute("data-mode") === focusMode);
    });
  } else {
    const activeModes = new Set();
    document.querySelectorAll("#reader [data-tool].on").forEach((tb) => {
      const m = tb.getAttribute("data-tool");
      if (m) activeModes.add(m);
    });
    strip.querySelectorAll("button[data-mode]").forEach((btn) => {
      const mode = btn.getAttribute("data-mode") || "";
      btn.classList.toggle("on", mode ? activeModes.has(mode) : false);
    });
  }
}

/**
 * Option 2 fold overlays:
 * - Individual tools stay on #main-tabs.
 * - Opening find/consult slides p1/p3; drawer shows only that tool.
 */
function applyOverlaySingleTool() {
  const w = window.innerWidth;
  const foldFind = w <= 1650;
  const foldConsult = w <= 920;
  const p1 = document.getElementById("p1");
  const p3 = document.getElementById("p3");

  if (p1) {
    p1.classList.toggle(
      "overlay-single",
      p1.classList.contains("overlay") && foldFind,
    );
  }
  if (p3) {
    p3.classList.toggle(
      "overlay-single",
      p3.classList.contains("overlay") && foldConsult,
    );
  }

  syncMainStripActive();
}

function setMode(group, panel) {
  const mode = group + ":" + panel;
  focusMode = mode;
  if (group === "read") lastReadMode = mode;

  document.querySelectorAll('[data-mode^="' + group + ':"]').forEach((btn) => {
    btn.classList.toggle("on", btn.getAttribute("data-mode") === mode);
  });
  document.querySelectorAll('[data-tool^="' + group + ':"]').forEach((tb) => {
    const match = tb.getAttribute("data-tool") === mode;
    tb.classList.toggle("on", match);
    tb.hidden = !match;
  });
  document.querySelectorAll('[data-panel^="' + group + ':"]').forEach((p) => {
    const match = p.getAttribute("data-panel") === mode;
    p.classList.toggle("on", match);
    p.hidden = !match;
  });

  const w = window.innerWidth;
  if (group === "find" && w <= 1650) {
    /* Slide-close p3 if open (no tab-bar flash) */
    const p3 = document.getElementById("p3");
    if (p3?.classList.contains("overlay")) {
      p3.classList.add("is-closing", "overlay-single");
      p3.classList.remove("overlay");
      setTimeout(
        () => p3.classList.remove("is-closing", "overlay-single"),
        320,
      );
    }
    const p1 = document.getElementById("p1");
    if (p1) {
      p1.classList.add("overlay", "overlay-single");
      p1.classList.remove("is-closing");
    }
    try {
      hydrateIcons(p1);
    } catch (_) {
      /* ignore */
    }
  } else if (group === "consult" && w <= 920) {
    const p1 = document.getElementById("p1");
    if (p1?.classList.contains("overlay")) {
      p1.classList.add("is-closing", "overlay-single");
      p1.classList.remove("overlay");
      setTimeout(
        () => p1.classList.remove("is-closing", "overlay-single"),
        320,
      );
    }
    const p3 = document.getElementById("p3");
    if (p3) {
      p3.classList.add("overlay", "overlay-single");
      p3.classList.remove("is-closing");
    }
    try {
      hydrateIcons(
        document.querySelector('#p3 [data-tool="consult:web"]') || p3,
      );
    } catch (_) {
      /* ignore */
    }
  } else if (group === "read") {
    closeFoldOverlays({ restoreRead: false });
    focusMode = mode;
    lastReadMode = mode;
  }

  applyOverlaySingleTool();
}

function openMode(mode) {
  /* Flavor may disable video (librus / doutrina); ignore open */
  if (mode === "consult:video") {
    const f = typeof getFlavor === "function" ? getFlavor() : null;
    if (!f?.features || f.features.jaas !== true) {
      mode = "consult:web";
    }
  }
  const [group, panel] = mode.split(":");
  if (group && panel) setMode(group, panel);
}

/**
 * Fold find/consult tabs into the main (read) strip — Option 2.
 * Rebuilds clones only when foldFind / foldConsult actually change (stops flicker).
 */
function handleTabFolding(force = false) {
  const strip = document.getElementById("main-tabs");
  if (!strip) return;
  const w = window.innerWidth;
  const foldFind = w <= 1650;
  const foldConsult = w <= 920;
  /* Labels: icon-only when strip is crowded (fold find) or consult is dense */
  const compact = foldFind || w <= 1800;
  const foldKey = (foldFind ? "1" : "0") + (foldConsult ? "1" : "0");

  document.body.dataset.compact = compact ? "1" : "0";
  document.body.dataset.foldFind = foldFind ? "1" : "0";
  document.body.dataset.foldConsult = foldConsult ? "1" : "0";
  /* Consult toolbar: icon-only before labels crowd (~2400) */
  document.body.dataset.compactConsult = w <= 2500 ? "1" : "0";

  if (!force && foldKey === lastFoldKey) {
    applyOverlaySingleTool();
    return;
  }
  lastFoldKey = foldKey;

  strip.querySelectorAll("[data-fold]").forEach((el) => el.remove());

  const paneTitle = strip.querySelector('[data-i18n="pane.read"]');
  const firstReadBtn = strip.querySelector(
    ':scope > button[data-mode^="read:"]',
  );

  function cloneTab(orig, fold) {
    if (!orig || orig.hidden || orig.closest("[data-feat][hidden]"))
      return null;
    if (orig.classList.contains("is-off")) return null;
    const clone = orig.cloneNode(true);
    clone.classList.remove("on");
    clone.setAttribute("data-fold", fold);
    const label =
      clone.querySelector("[data-i18n]")?.textContent?.trim() ||
      clone.getAttribute("title") ||
      clone.getAttribute("data-mode") ||
      "";
    if (label) {
      clone.setAttribute("title", label);
      clone.setAttribute("aria-label", label);
    } else {
      const tip = tipForButton(clone);
      if (tip) {
        clone.setAttribute("title", tip);
        clone.setAttribute("aria-label", tip);
      }
    }
    clone.addEventListener("click", (e) => {
      e.stopPropagation();
      openMode(clone.getAttribute("data-mode"));
    });
    return clone;
  }

  if (foldFind) {
    const findBtns = document.querySelectorAll(
      "#p1 [data-tabs] > button[data-mode]",
    );
    const anchor = firstReadBtn;
    findBtns.forEach((orig) => {
      const clone = cloneTab(orig, "1");
      if (!clone) return;
      if (anchor) strip.insertBefore(clone, anchor);
      else if (paneTitle) strip.insertBefore(clone, paneTitle);
      else strip.appendChild(clone);
    });
  } else {
    const p1 = document.getElementById("p1");
    if (p1) p1.classList.remove("overlay", "overlay-single");
  }

  if (foldConsult) {
    const consultBtns = document.querySelectorAll(
      "#p3 [data-tabs] > button[data-mode]",
    );
    consultBtns.forEach((orig) => {
      const clone = cloneTab(orig, "3");
      if (!clone) return;
      if (paneTitle) strip.insertBefore(clone, paneTitle);
      else strip.appendChild(clone);
    });
  } else {
    const p3 = document.getElementById("p3");
    if (p3) p3.classList.remove("overlay", "overlay-single");
  }

  applyOverlaySingleTool();
  hydrateIcons(strip);
  syncTooltips(strip);
}

let foldResizeTimer = null;
function onFoldResize() {
  if (foldResizeTimer) clearTimeout(foldResizeTimer);
  foldResizeTimer = setTimeout(() => {
    foldResizeTimer = null;
    handleTabFolding(false);
  }, 80);
}

/* ── Typography (cyclic controls) ────────────────── */

function cycle(list, current) {
  const i = list.indexOf(current);
  return list[(i < 0 ? 0 : i + 1) % list.length];
}

function nearest(list, value) {
  let best = list[0];
  let bestD = Math.abs(list[0] - value);
  for (let i = 1; i < list.length; i++) {
    const d = Math.abs(list[i] - value);
    if (d < bestD) {
      best = list[i];
      bestD = d;
    }
  }
  return best;
}

function applyTypography() {
  const el = bookEl();
  if (!el) return;
  el.style.setProperty("--book-size", fontSize + "rem");
  el.style.setProperty("--book-lh", String(lineHeight));
  /* Explicit attribute so CSS [data-font="sans"|"serif"] always matches */
  el.setAttribute("data-font", fontFamily === "serif" ? "serif" : "sans");
  el.dataset.measure = measure;
  el.dataset.align = textAlign;
  el.style.setProperty(
    "--book-align",
    textAlign === "justify" ? "justify" : "start",
  );
  syncTypoButtons();
}

/** Update cyclic typo button labels + icons to match current state. */
function syncTypoButtons() {
  const root = document.querySelector('[data-tool="read:typo"]');
  if (!root) return;

  const setLabel = (key, text, i18nKey) => {
    const btn = root.querySelector('[data-typo="' + key + '"]');
    if (!btn) return;
    const span = btn.querySelector("[data-typo-label]");
    if (span) {
      span.textContent = text;
      if (i18nKey) span.setAttribute("data-i18n", i18nKey);
      else span.removeAttribute("data-i18n");
    }
  };

  const setIcon = (key, iconName) => {
    const btn = root.querySelector('[data-typo="' + key + '"]');
    const host = btn?.querySelector("[data-icon]");
    if (!host) return;
    host.setAttribute("data-icon", iconName);
    host.innerHTML = "";
    hydrateIcons(btn);
  };

  const pct = Math.round(fontSize * 100) + "%";
  setLabel("size", pct);
  setLabel("line", String(lineHeight));
  setLabel("measure", t("typo." + measure), "typo." + measure);
  setLabel(
    "align",
    textAlign === "justify" ? t("typo.alignJustify") : t("typo.alignStart"),
    textAlign === "justify" ? "typo.alignJustify" : "typo.alignStart",
  );
  setLabel(
    "font",
    fontFamily === "serif" ? t("typo.serif") : t("typo.sans"),
    fontFamily === "serif" ? "typo.serif" : "typo.sans",
  );
  /* Titles for icon-only compact chrome */
  /* Tooltip = tip key + current value (icon-only chrome still discoverable) */
  const tipVal = {
    size: t("tip.typo.size") + " · " + pct,
    line: t("tip.typo.line") + " · " + String(lineHeight),
    measure: t("tip.typo.measure") + " · " + t("typo." + measure),
    align:
      t("tip.typo.align") +
      " · " +
      (textAlign === "justify" ? t("typo.alignJustify") : t("typo.alignStart")),
    font:
      t("tip.typo.font") +
      " · " +
      (fontFamily === "serif" ? t("typo.serif") : t("typo.sans")),
  };
  Object.keys(tipVal).forEach((key) => {
    const btn = root.querySelector('[data-typo="' + key + '"]');
    if (btn) {
      btn.title = tipVal[key];
      btn.setAttribute("aria-label", tipVal[key]);
    }
  });
  setIcon("align", textAlign === "justify" ? "align-justify" : "align-left");
  /* Label = current face; icons: AA ≈ sans UI, type ≈ body/serif */
  setIcon("font", fontFamily === "sans" ? "case-upper" : "type");
  setIcon(
    "size",
    fontSize >= 1.2
      ? "a-arrow-up"
      : fontSize <= 0.95
        ? "a-arrow-down"
        : "a-arrow-up",
  );
}

/* ── Catalog / books ─────────────────────────────── */

let catalogLoadPromise = null;

async function loadCatalog() {
  if (catalogLoadPromise) return catalogLoadPromise;
  catalogLoadPromise = (async () => {
    const flavor = getFlavor();
    const path = (flavor && flavor.catalog) || "/books/catalog.json";
    try {
      const res = await fetch(path, { cache: "no-cache" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      CATALOG_ALL = Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("[POC] catalog", err);
      CATALOG_ALL = [];
    }
    CATALOG = filterCatalog(CATALOG_ALL, undefined, currentLang);
    renderLibrary();
    return CATALOG;
  })().finally(() => {
    catalogLoadPromise = null;
  });
  return catalogLoadPromise;
}

function renderLibrary() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  grid.innerHTML = "";
  if (!CATALOG.length) {
    const empty = document.createElement("li");
    empty.style.gridColumn = "1 / -1";
    empty.style.opacity = "0.7";
    empty.textContent =
      currentLang === "en"
        ? "No books in catalog."
        : "Nenhum livro no catálogo.";
    grid.appendChild(empty);
    return;
  }
  CATALOG.forEach((entry) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    if (entry.color) {
      btn.style.setProperty("--card-accent", entry.color);
      btn.style.borderBottomColor = entry.color;
    }
    if (entry.emoji) {
      const b = document.createElement("b");
      b.setAttribute("aria-hidden", "true");
      b.textContent = entry.emoji;
      btn.appendChild(b);
    }
    const strong = document.createElement("strong");
    strong.textContent =
      currentLang === "pt" && entry.titlePt
        ? entry.titlePt
        : entry.title || entry.id;
    const small = document.createElement("small");
    const meta =
      currentLang === "pt" && entry.metaPt ? entry.metaPt : entry.meta || "";
    small.textContent = [entry.author, meta].filter(Boolean).join(" · ");
    btn.appendChild(strong);
    btn.appendChild(small);
    btn.addEventListener("click", () => openBook(entry.id));
    li.appendChild(btn);
    grid.appendChild(li);
  });
}

async function loadBook(slug) {
  let id = slug || currentSlug;
  if (!id) throw new Error("no book id");
  /* Prefer edition matching UI language when a pair exists */
  const fromAll = CATALOG_ALL.find((b) => b && b.id === id);
  if (fromAll) {
    const prefer = findPairedEdition(CATALOG_ALL, fromAll, currentLang);
    if (prefer && prefer.id) id = prefer.id;
  }
  if (BOOK_CACHE[id]) {
    currentBook = BOOK_CACHE[id];
    currentSlug = id;
    return currentBook;
  }
  const entry =
    CATALOG_ALL.find((b) => b && b.id === id) ||
    CATALOG.find((b) => b && b.id === id);
  const path = (entry && entry.path) || "/books/" + id + "/book.json";
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error("book " + id + " " + res.status);
  const book = await res.json();
  BOOK_CACHE[id] = book;
  currentBook = book;
  currentSlug = id;
  return book;
}

async function openBook(slug) {
  try {
    await enterReader(slug, 0);
  } catch (err) {
    console.warn("[POC] openBook", err);
    return;
  }
  /* Update URL without re-running applyRoute (already painted) */
  navigate(pathFor("reader", { slug: currentSlug, page: 0 }), {
    skip: true,
  });
}

function tocLabel(item) {
  if (!item) return "";
  if (currentLang === "pt" && item.labelPt) return item.labelPt;
  if (currentLang === "en" && item.labelEn) return item.labelEn;
  return item.label || item.id || "";
}

function renderToc() {
  const nav = tocEl();
  if (!nav) return;
  nav.innerHTML = "";
  const q = (document.getElementById("toc-q")?.value || "")
    .trim()
    .toLowerCase();
  const toc = currentBook?.toc || [];
  let n = 0;
  toc.forEach((item) => {
    const label = tocLabel(item);
    if (!label) return;
    if (q && label.toLowerCase().indexOf(q) === -1) return;
    n += 1;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", () => {
      nav.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      const pages = currentBook.pages || [];
      if (pages.length > 1) {
        const idx = pages.findIndex((p) => p.id === item.id);
        if (idx >= 0) {
          goToPage(idx);
          return;
        }
      }
      const target = bookEl()?.querySelector("#" + CSS.escape(item.id));
      target?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    nav.appendChild(btn);
  });
  if (!n) {
    const p = document.createElement("p");
    p.textContent = t("toc.empty");
    nav.appendChild(p);
  }
}

function renderPage() {
  const el = bookEl();
  if (!el) {
    console.warn("[POC] #book missing");
    return;
  }
  if (!currentBook) {
    el.innerHTML =
      "<p class='chrome-hint'>" +
      (currentLang === "en" ? "No book loaded." : "Nenhum livro carregado.") +
      "</p>";
    return;
  }
  const pages = currentBook.pages || [];
  const page = pages[pageIndex] || pages[0];
  const html = page?.html || page?.body || "";
  el.innerHTML =
    html ||
    "<p class='chrome-hint'>" +
      (currentLang === "en" ? "Empty page." : "Página vazia.") +
      "</p>";
  const input = document.getElementById("page-n");
  const total = document.getElementById("page-total");
  if (input) {
    input.value = String(pageIndex + 1);
    input.max = String(Math.max(1, pages.length));
  }
  if (total) total.textContent = "/ " + Math.max(1, pages.length);
  const multi = pages.length > 1;
  document.querySelectorAll("[data-page]").forEach((b) => {
    b.hidden = !multi;
  });
  if (input && input.closest("label")) input.closest("label").hidden = !multi;
  applyTypography();
}

function goToPage(index) {
  const pages = currentBook?.pages || [];
  if (index < 0 || index >= pages.length) return;
  pageIndex = index;
  renderPage();
  navigate(pathFor("reader", { slug: currentSlug, page: pageIndex }), {
    replace: true,
    skip: true,
  });
  bookEl()?.scrollTo(0, 0);
}

function stripHtml(html) {
  const d = document.createElement("div");
  d.innerHTML = html || "";
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}

function runSearch(q) {
  const box = hitsEl();
  if (!box) return;
  searchQuery = q == null ? searchQuery : q;
  const query = (searchQuery || "").trim();
  box.innerHTML = "";
  if (!query) {
    box.innerHTML = "<p>" + t("search.empty") + "</p>";
    return;
  }
  const pages = currentBook?.pages || [];
  const hits = [];
  const lower = query.toLowerCase();
  pages.forEach((page, i) => {
    const text = stripHtml(page.html);
    let from = 0;
    let idx;
    while ((idx = text.toLowerCase().indexOf(lower, from)) !== -1) {
      const start = Math.max(0, idx - 40);
      const snip = text.slice(start, idx + query.length + 40);
      hits.push({ page: i, snip, at: idx });
      from = idx + query.length;
      if (hits.length >= 80) break;
    }
  });
  if (!hits.length) {
    box.innerHTML = "<p>" + t("search.none") + "</p>";
    return;
  }
  const head = document.createElement("p");
  head.textContent = t("search.hits").replace("{n}", String(hits.length));
  box.appendChild(head);
  hits.forEach((hit, hi) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "p." + (hit.page + 1) + " · …" + hit.snip + "…";
    btn.addEventListener("click", () => {
      goToPage(hit.page);
      highlightInPage(query, hi);
    });
    box.appendChild(btn);
  });
}

function highlightInPage(query, focusIndex) {
  const el = bookEl();
  if (!el || !query) return;
  el.querySelectorAll("mark").forEach((m) => {
    const p = m.parentNode;
    p?.replaceChild(document.createTextNode(m.textContent || ""), m);
    p?.normalize();
  });
  const re = new RegExp(
    "(" + query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")",
    "ig",
  );
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let n;
  while ((n = walk.nextNode())) {
    if (n.nodeValue && n.nodeValue.toLowerCase().includes(query.toLowerCase()))
      nodes.push(n);
  }
  nodes.forEach((textNode) => {
    const parent = textNode.parentNode;
    if (!parent || parent.closest("mark")) return;
    const frag = document.createDocumentFragment();
    textNode.nodeValue.split(re).forEach((part, i) => {
      if (i % 2 === 1) {
        const mark = document.createElement("mark");
        mark.textContent = part;
        frag.appendChild(mark);
      } else if (part) frag.appendChild(document.createTextNode(part));
    });
    parent.replaceChild(frag, textNode);
  });
  const marks = el.querySelectorAll("mark");
  const target = marks[Math.min(focusIndex || 0, marks.length - 1)] || marks[0];
  marks.forEach((m) => m.classList.remove("focus"));
  if (target) {
    target.classList.add("focus");
    target.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

/* ── Context / providers ─────────────────────────── */

function wikiLang() {
  return currentLang === "en" ? "en" : "pt";
}

function applyWikiTheme(url) {
  if (!/(?:wikipedia|wiktionary)\.org/i.test(url)) return url;
  try {
    const u = new URL(url);
    if (currentTheme === "dark") {
      u.searchParams.set("vectornightmode", "1");
      u.searchParams.set("minervanightmode", "1");
    } else {
      u.searchParams.delete("vectornightmode");
      u.searchParams.delete("minervanightmode");
    }
    return u.toString();
  } catch (_) {
    return url;
  }
}

/** Link-injection short codes → PROVIDERS keys */
const LINK_PROVIDER_KEY = {
  m: "map",
  map: "map",
  w: "encyc",
  encyc: "encyc",
  d: "dict",
  dict: "dict",
  l: "luz",
  luz: "luz",
  bible: "bible",
  kardec: "kardec",
};

function providerUrl(key, term) {
  const meta = PROVIDERS[key];
  if (!meta) return "";
  const tpl = term ? meta.search || meta.home : meta.home;
  let url = tpl
    .replace(/\{lang\}/g, wikiLang())
    .replace(/\{query\}/gi, encodeURIComponent(term || ""));
  return applyWikiTheme(url);
}

/**
 * OSM main site refuses iframes; use export/embed when possible.
 * @param {string} [query]
 * @returns {Promise<string>}
 */
async function mapEmbedUrl(query) {
  const q = String(query || "").trim();
  if (!q) return PROVIDERS.map.home;
  try {
    const res = await fetch(
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
        encodeURIComponent(q),
      {
        headers: {
          Accept: "application/json",
          /* Nominatim usage policy: identify the app */
          "Accept-Language": currentLang === "en" ? "en" : "pt",
        },
      },
    );
    if (res.ok) {
      const data = await res.json();
      const hit = data && data[0];
      if (hit && hit.boundingbox) {
        const [south, north, west, east] = hit.boundingbox;
        const lat = hit.lat;
        const lon = hit.lon;
        return (
          "https://www.openstreetmap.org/export/embed.html?bbox=" +
          encodeURIComponent(west + "," + south + "," + east + "," + north) +
          "&layer=mapnik&marker=" +
          encodeURIComponent(lat + "," + lon)
        );
      }
    }
  } catch (_) {
    /* fall through */
  }
  /* Last resort: external search page (also used if embed fails) */
  return (
    PROVIDERS.map.external?.replace(
      /\{query\}/gi,
      encodeURIComponent(q),
    ) || PROVIDERS.map.search.replace(/\{query\}/gi, encodeURIComponent(q))
  );
}

function isMapUrl(url) {
  return /openstreetmap\.org/i.test(String(url || ""));
}

function isEmbeddableMapUrl(url) {
  return /openstreetmap\.org\/export\/embed/i.test(String(url || ""));
}

/**
 * Resolve provider URL (async for maps).
 * @param {string} key
 * @param {string} term
 * @returns {Promise<string>}
 */
async function resolveProviderUrl(key, term) {
  if (key === "map") return mapEmbedUrl(term);
  return providerUrl(key, term);
}

function loadCtx(url, { push = true } = {}) {
  const frame = ctxEl();
  if (!frame || !url) return;

  /* OSM search UI cannot run in iframe — open externally + show embed if we have one */
  if (isMapUrl(url) && !isEmbeddableMapUrl(url)) {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (_) {
      /* ignore */
    }
    /* Prefer showing a working map pane rather than a blank frame */
    url = PROVIDERS.map.home;
  }

  if (push && lastCtxUrl && lastCtxUrl !== url) {
    ctxHistory.push(lastCtxUrl);
    if (ctxHistory.length > 40) ctxHistory.shift();
  }
  lastCtxUrl = url;
  frame.src = url;
  setMode("consult", "web");
  /* Ensure back/reload icons paint when consult chrome first appears */
  try {
    hydrateIcons(document.querySelector('#p3 [data-tool="consult:web"]'));
  } catch (_) {
    /* ignore */
  }
  syncCtxBackBtn();
}

/** Open a provider from toolbar (selection = query for search). */
async function openProvider(key) {
  const term = selectionTerm();
  const url = await resolveProviderUrl(key, term);
  if (url) loadCtx(url);
}

/**
 * Book body links: keep in consult pane when possible.
 * @param {string} href
 * @param {HTMLAnchorElement | null} anchor
 */
async function openBookLink(href, anchor) {
  if (!href) return;
  const code = (anchor?.getAttribute("data-link-provider") || "").toLowerCase();
  const key = LINK_PROVIDER_KEY[code] || "";
  const term = String(anchor?.textContent || "")
    .replace(/\s+/g, " ")
    .trim();

  if (key === "map" || isMapUrl(href)) {
    let q = term;
    try {
      const u = new URL(href, location.href);
      q = u.searchParams.get("query") || u.searchParams.get("q") || term;
    } catch (_) {
      /* ignore */
    }
    const embed = await mapEmbedUrl(q);
    if (embed && isEmbeddableMapUrl(embed)) {
      loadCtx(embed);
      return;
    }
    loadCtx(href);
    return;
  }

  if (key) {
    const url = await resolveProviderUrl(key, term);
    if (url) {
      loadCtx(url);
      return;
    }
  }

  /* Other absolute links → consult iframe (wiki etc.) */
  if (/^https?:\/\//i.test(href)) {
    loadCtx(href);
  }
}

function ctxGoBack() {
  const prev = ctxHistory.pop();
  if (prev) {
    loadCtx(prev, { push: false });
    return;
  }
  /* No history: reload provider home for current lang wiki */
  const home = providerUrl("encyc", "");
  if (home) loadCtx(home, { push: false });
}

function syncCtxBackBtn() {
  const btn = document.querySelector('[data-ctx="back"]');
  if (!btn) return;
  const can = ctxHistory.length > 0;
  btn.disabled = !can;
  btn.setAttribute("aria-disabled", can ? "false" : "true");
  btn.style.opacity = can ? "1" : "0.45";
}

function selectionTerm() {
  const sel = window.getSelection();
  return sel
    ? String(sel.toString() || "")
        .replace(/\s+/g, " ")
        .trim()
    : "";
}

/* ── Mock PDF / Video (pane 3) ───────────────────── */

function renderMockPdf() {
  const pageEl = document.getElementById("pdf-mock-page");
  const sheet = document.getElementById("pdf-sheet");
  const input = document.getElementById("pdf-page-input");
  const total = document.getElementById("pdf-page-total");
  const mock = document.getElementById("pdf-mock");
  if (!mockPdfLoaded) {
    if (mock) mock.dataset.empty = "1";
    if (pageEl) pageEl.textContent = t("pdf.mockCleared");
    if (input) input.value = "1";
    if (total) total.textContent = "/ 0";
    return;
  }
  if (mock) mock.dataset.empty = "0";
  if (pageEl) {
    pageEl.textContent = t("pdf.mockPage")
      .replace("{n}", String(mockPdfPage))
      .replace("{total}", String(MOCK_PDF_TOTAL));
  }
  if (sheet) sheet.style.transform = "scale(" + mockPdfZoom + ")";
  if (input) {
    input.value = String(mockPdfPage);
    input.max = String(MOCK_PDF_TOTAL);
  }
  if (total) total.textContent = "/ " + MOCK_PDF_TOTAL;

  const lines = document.getElementById("pdf-lines");
  if (lines && !lines.childElementCount) {
    for (let i = 0; i < 14; i++) {
      const bar = document.createElement("span");
      bar.style.width = 55 + ((i * 17) % 40) + "%";
      lines.appendChild(bar);
    }
  }
}

function wireMockPdf() {
  document.querySelectorAll("[data-pdf]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const a = btn.getAttribute("data-pdf");
      if (a === "upload") {
        mockPdfLoaded = true;
        mockPdfPage = 1;
        mockPdfZoom = 1;
      }
      if (a === "unload") {
        mockPdfLoaded = false;
      }
      if (a === "prev" && mockPdfLoaded)
        mockPdfPage = Math.max(1, mockPdfPage - 1);
      if (a === "next" && mockPdfLoaded)
        mockPdfPage = Math.min(MOCK_PDF_TOTAL, mockPdfPage + 1);
      if (a === "in" && mockPdfLoaded)
        mockPdfZoom = Math.min(1.6, Math.round((mockPdfZoom + 0.1) * 10) / 10);
      if (a === "out" && mockPdfLoaded)
        mockPdfZoom = Math.max(0.7, Math.round((mockPdfZoom - 0.1) * 10) / 10);
      renderMockPdf();
    });
  });
  document
    .getElementById("pdf-page-input")
    ?.addEventListener("change", function () {
      if (!mockPdfLoaded) {
        this.value = "1";
        return;
      }
      const n = parseInt(this.value, 10);
      if (n >= 1 && n <= MOCK_PDF_TOTAL) mockPdfPage = n;
      renderMockPdf();
    });
  renderMockPdf();
}

function wireMockVideo() {
  const status = () => document.getElementById("meet-status");
  const stage = document.getElementById("video-stage");
  document.querySelectorAll("[data-jitsi]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const a = btn.getAttribute("data-jitsi");
      if (a === "join-video") mockMeetMode = "video";
      if (a === "join-voice") mockMeetMode = "voice";
      if (a === "leave") mockMeetMode = "";
      const el = status();
      if (el) {
        if (mockMeetMode === "video") el.textContent = t("meet.mockVideo");
        else if (mockMeetMode === "voice") el.textContent = t("meet.mockVoice");
        else el.textContent = t("meet.mockIdle");
      }
      if (stage) stage.dataset.live = mockMeetMode ? "1" : "0";
    });
  });
}

/* ── Wire UI ─────────────────────────────────────── */

function wire() {
  try {
    applyFeatureDom();
    hydrateIcons();
    syncTooltips();
  } catch (err) {
    console.warn("[POC] chrome init", err);
  }

  const build = document.getElementById("build");
  if (build) {
    const flags = Object.entries(FEAT)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join("+");
    build.textContent = "v" + APP_VERSION + " · " + (flags || "core");
  }
  const ver = document.getElementById("info-version");
  if (ver) ver.textContent = "LIBRUS " + APP_VERSION;

  /* Color guide radios (settings) */
  document.querySelectorAll('input[name="color-guide"]').forEach((el) => {
    el.addEventListener("change", () => {
      if (el instanceof HTMLInputElement && el.checked) {
        setColorGuide(/** @type {'full'|'soft'|'min'} */ (el.value));
      }
    });
  });
  syncColorGuideInputs();

  /* Single delegated click owner for chrome navigation */
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    const cycleBtn = t.closest("[data-cycle]");
    if (cycleBtn) {
      e.preventDefault();
      const kind = cycleBtn.getAttribute("data-cycle");
      if (kind === "lang") cycleLang();
      else if (kind === "theme") cycleTheme();
      return;
    }

    const goBtn = t.closest("[data-go]");
    if (goBtn) {
      e.preventDefault();
      closeAllDrawers();
      let dest = goBtn.getAttribute("data-go");
      if (dest === "home" || dest === "splash" || dest === "onboard") {
        dest = "library";
      }
      navigate(pathFor(dest === "reader" ? "reader" : "library"));
      return;
    }

    const openBtn = t.closest("[data-open]");
    if (openBtn) {
      e.preventDefault();
      openDrawer(openBtn.getAttribute("data-open"));
      return;
    }

    const closeBtn = t.closest("[data-close]");
    if (closeBtn) {
      e.preventDefault();
      closeAllDrawers();
      return;
    }

    if (t.id === "scrim" || t.closest("#scrim")) {
      e.preventDefault();
      closeAllDrawers();
      return;
    }

    /* Click outside folded overlays → close + restore read tab color */
    const p1 = document.getElementById("p1");
    const p3 = document.getElementById("p3");
    const hitOverlay =
      (p1?.classList.contains("overlay") && !p1.contains(t)) ||
      (p3?.classList.contains("overlay") && !p3.contains(t));
    if (
      hitOverlay &&
      !t.closest("[data-fold]") &&
      !t.closest("#main-tabs") &&
      !t.closest("#bar")
    ) {
      closeFoldOverlays({ restoreRead: true });
    }
  });

  document.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () =>
      openMode(btn.getAttribute("data-mode")),
    );
  });

  document.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.getAttribute("data-page") === "prev") goToPage(pageIndex - 1);
      if (btn.getAttribute("data-page") === "next") goToPage(pageIndex + 1);
    });
  });

  document.getElementById("page-n")?.addEventListener("change", function () {
    const n = parseInt(this.value, 10);
    if (n >= 1) goToPage(n - 1);
  });

  document
    .getElementById("toc-q")
    ?.addEventListener("input", () => renderToc());
  document.getElementById("search-q")?.addEventListener("input", function () {
    runSearch(this.value);
  });

  if (FEAT.typo) {
    document.querySelectorAll("[data-typo]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const a = btn.getAttribute("data-typo");
        if (a === "size")
          fontSize = cycle(FONT_SIZES, nearest(FONT_SIZES, fontSize));
        if (a === "line")
          lineHeight = cycle(LINE_HEIGHTS, nearest(LINE_HEIGHTS, lineHeight));
        if (a === "measure") measure = cycle(MEASURES, measure);
        if (a === "align") textAlign = cycle(ALIGNS, textAlign);
        if (a === "font") fontFamily = cycle(FONTS, fontFamily);
        applyTypography();
      });
    });
    syncTypoButtons();
  }

  if (FEAT.providers) {
    document.querySelectorAll("[data-provider]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-provider");
        if (key) openProvider(key);
      });
    });
    document.querySelectorAll('[data-ctx="back"]').forEach((btn) => {
      btn.addEventListener("click", () => ctxGoBack());
    });
    document.querySelectorAll('[data-ctx="reload"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        if (lastCtxUrl) loadCtx(lastCtxUrl, { push: false });
      });
    });
    /* In-book links (incl. map / data-link-provider) → consult pane */
    document.addEventListener(
      "click",
      (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        const book = bookEl();
        if (!book) return;
        const a = t.closest("a[href]");
        if (!a || !book.contains(a)) return;
        const href = a.getAttribute("href") || "";
        if (!href || href.startsWith("#")) return;
        /* Internal page anchors in the book */
        if (href.startsWith("#") || (href.startsWith("/") && !href.startsWith("//"))) {
          return;
        }
        if (
          /^https?:\/\//i.test(href) ||
          a.hasAttribute("data-link-provider") ||
          a.hasAttribute("data-doutrina-link")
        ) {
          e.preventDefault();
          openBookLink(href, a instanceof HTMLAnchorElement ? a : null);
        }
      },
      true,
    );
    syncCtxBackBtn();
    try {
      hydrateIcons(document.querySelector('#p3 [data-tool="consult:web"]'));
    } catch (_) {
      /* ignore */
    }
  }

  window.addEventListener("resize", () => {
    syncViewportRatio();
    onFoldResize();
  });

  window.addEventListener("popstate", () => applyRoute());

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeFoldOverlays({ restoreRead: true });
    closeAllDrawers();
  });

  // PDF / Video: real modules when flagged, otherwise interactive mocks
  if (import.meta.env.VITE_FEAT_PDF === "1") {
    import("./features/pdf.js")
      .then((m) => m.wirePdfUi(openMode))
      .catch((e) => console.warn(e));
  } else {
    wireMockPdf();
  }
  if (import.meta.env.VITE_FEAT_JAAS === "1") {
    import("./features/jaas.js")
      .then((m) => m.wireJaasUi(t))
      .catch((e) => console.warn(e));
  } else {
    wireMockVideo();
  }
}

const MODAL_IDS = ["help", "settings"];

function openDrawer(id) {
  MODAL_IDS.forEach((other) => {
    if (other === id) return;
    const o = document.getElementById(other);
    if (o) {
      o.classList.remove("is-open", "is-closing");
      o.hidden = true;
    }
  });
  const el = document.getElementById(id);
  const scrim = document.getElementById("scrim");
  if (!el) return;
  el.hidden = false;
  el.classList.remove("is-closing");
  if (scrim) {
    scrim.hidden = false;
    scrim.classList.remove("is-closing");
  }
  hydrateIcons(el);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add("is-open");
      if (scrim) scrim.classList.add("is-open");
    });
  });
}

function closeDrawerAnimated(el, onDone) {
  if (!el || el.hidden) {
    onDone?.();
    return;
  }
  if (!el.classList.contains("is-open")) {
    el.classList.remove("is-closing");
    el.hidden = true;
    onDone?.();
    return;
  }
  let done = false;
  const end = () => {
    if (done) return;
    done = true;
    el.removeEventListener("transitionend", onEnd);
    el.classList.remove("is-open", "is-closing");
    el.hidden = true;
    onDone?.();
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
  el.addEventListener("transitionend", onEnd);
  setTimeout(end, 280);
}

function closeAllDrawers() {
  MODAL_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) closeDrawerAnimated(el);
  });
  const scrim = document.getElementById("scrim");
  if (scrim && !scrim.hidden) {
    let scrimDone = false;
    const scrimEnd = () => {
      if (scrimDone) return;
      scrimDone = true;
      scrim.removeEventListener("transitionend", onScrimEnd);
      scrim.classList.remove("is-closing");
      scrim.hidden = true;
    };
    const onScrimEnd = (ev) => {
      if (ev.target === scrim && ev.propertyName === "opacity") scrimEnd();
    };
    scrim.classList.remove("is-open");
    scrim.classList.add("is-closing");
    scrim.addEventListener("transitionend", onScrimEnd);
    setTimeout(scrimEnd, 280);
  }
}

/* ── Portrait lock ───────────────────────────────── */

function isPortraitViewport() {
  const w = window.innerWidth || 0;
  const h = window.innerHeight || 0;
  if (w > 0 && h > 0 && h > w) return true;
  try {
    if (window.matchMedia("(orientation: portrait)").matches) return true;
    if (window.matchMedia("(max-aspect-ratio: 13/10)").matches && h >= w)
      return true;
  } catch (_) {
    /* ignore */
  }
  return false;
}

function isOrientDismissed() {
  try {
    return sessionStorage.getItem(ORIENT_DISMISS_KEY) === "1";
  } catch (_) {
    return false;
  }
}

function setOrientDismissed() {
  try {
    sessionStorage.setItem(ORIENT_DISMISS_KEY, "1");
  } catch (_) {
    /* private mode */
  }
  const el = document.getElementById("orient");
  if (el) el.dataset.dismissed = "1";
}

function updateOrientLock() {
  const el = document.getElementById("orient");
  if (!el) return;
  const portrait = isPortraitViewport();
  const show = portrait && !isOrientDismissed();

  if (show) {
    el.hidden = false;
    el.classList.add("on");
    el.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("is-portrait-blocked");
    document.body.classList.add("is-portrait-blocked");
  } else {
    /* Always fully hide when landscape or dismissed — never block splash clicks */
    el.hidden = true;
    el.classList.remove("on");
    el.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("is-portrait-blocked");
    document.body.classList.remove("is-portrait-blocked");
  }

  if (isOrientDismissed()) el.dataset.dismissed = "1";
  else delete el.dataset.dismissed;
}

function initOrientLock() {
  if (isOrientDismissed()) {
    const el = document.getElementById("orient");
    if (el) el.dataset.dismissed = "1";
  }
  updateOrientLock();

  document.getElementById("orient-dismiss")?.addEventListener("click", () => {
    setOrientDismissed();
    updateOrientLock();
  });

  window.addEventListener("resize", updateOrientLock);
  window.addEventListener("orientationchange", () => {
    setTimeout(updateOrientLock, 50);
    setTimeout(updateOrientLock, 250);
  });
  try {
    const mq = window.matchMedia("(orientation: portrait)");
    if (mq.addEventListener) mq.addEventListener("change", updateOrientLock);
    else if (mq.addListener) mq.addListener(updateOrientLock);
  } catch (_) {
    /* ignore */
  }
  requestAnimationFrame(updateOrientLock);
  setTimeout(updateOrientLock, 100);
}

/* ── Boot ────────────────────────────────────────── */
/**
 * Single owner of app lifecycle. index.html is markup + theme FOUC only.
 * Order: flavor → theme → lang → wire chrome → catalog → route → service worker.
 */
async function boot() {
  try {
    await loadFlavor();
    console.info("[POC] flavor", getFlavorId());
  } catch (err) {
    console.warn("[POC] flavor", err);
  }

  try {
    initOrientLock();
  } catch (err) {
    console.warn("[POC] orient", err);
  }

  try {
    let pref = "system";
    try {
      pref = localStorage.getItem(THEME_KEY) || pref;
    } catch (_) {
      /* ignore */
    }
    if (pref !== "light" && pref !== "dark" && pref !== "system")
      pref = "system";
    setTheme(/** @type {'system'|'light'|'dark'} */ (pref), {
      persist: false,
      reloadHypo: false,
    });
    watchSystemTheme();
  } catch (err) {
    console.warn("[POC] theme", err);
  }

  try {
    let g = "full";
    try {
      g = localStorage.getItem(GUIDE_KEY) || g;
    } catch (_) {
      /* ignore */
    }
    setColorGuide(/** @type {'full'|'soft'|'min'} */ (g), { persist: false });
  } catch (err) {
    console.warn("[POC] color guide", err);
  }

  try {
    const stored = (() => {
      try {
        return localStorage.getItem(LANG_KEY);
      } catch (_) {
        return null;
      }
    })();
    if (stored === "pt" || stored === "en") {
      setLang(stored, { persist: false });
    } else {
      applyI18n();
      try {
        applyFlavorBrand(getFlavor(), currentLang, currentTheme);
      } catch (_) {
        /* ignore */
      }
    }
  } catch (err) {
    console.warn("[POC] lang", err);
  }

  try {
    wire();
  } catch (err) {
    console.warn("[POC] wire", err);
  }

  try {
    applyFlavorBrand(getFlavor(), currentLang, currentTheme);
    hydrateIcons(document.getElementById("library"));
  } catch (_) {
    /* ignore */
  }

  try {
    syncViewportRatio();
  } catch (_) {
    /* ignore */
  }

  try {
    await loadCatalog();
  } catch (err) {
    console.warn("[POC] catalog", err);
  }

  /* Library is home. Normalize bare / and old splash/onboard URLs. */
  const route = parsePath(location.pathname);
  if (route.view === "library" && location.pathname !== "/library") {
    try {
      history.replaceState({ path: "/library" }, "", "/library");
    } catch (_) {
      /* ignore */
    }
  }
  try {
    await applyRoute();
  } catch (err) {
    console.warn("[POC] route", err);
    setView("library");
  }
  syncChromeBar();

  try {
    registerSW({ immediate: true });
  } catch (_) {
    /* dev without SW */
  }
}

boot().catch((err) => console.error("[POC] boot failed", err));
