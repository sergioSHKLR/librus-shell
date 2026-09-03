/**
 * Multi-site flavors from /flavors.json
 *
 * Resolution order (first match wins):
 *   1. ?flavor=librus|doutrina|centro   (dev / QA)
 *   2. VITE_FLAVOR build/dev env         (per-server scripts + deploys)
 *   3. localStorage "librus-flavor"     (optional sticky; only if no env)
 *   4. hostname → hosts map in JSON
 *   5. flavors.default
 *
 * You maintain flavors.json + brand assets + catalog profiles.
 * Engine code should not hard-code product names beyond this module.
 */

const STORAGE_KEY = "librus-flavor";

/** @type {object | null} */
let registry = null;
/** @type {string} */
let currentId = "librus";
/** @type {object | null} */
let currentFlavor = null;

const FALLBACK = {
  default: "librus",
  hosts: {},
  flavors: {
    librus: {
      id: "librus",
      brand: {
        name: "LIBRUS",
        title: "LIBRUS",
        description: "LIBRUS",
        cta: { pt: "Ache · Leia · Consulte · Anote", en: "Find · Read · Consult · Annotate" },
        tagline: { pt: "annotate to assimilate", en: "annotate to assimilate" },
        icon: "columns-4",
        favicon: "/favicon.svg",
        faviconDark: "/favicon-dark.svg",
        accent: "#1a5fb4",
      },
      catalog: "/books/catalog.json",
      profile: "librus",
      features: { providers: ["encyc", "dict", "map"], jaas: false },
    },
  },
};

/**
 * @param {object} reg
 * @returns {string}
 */
export function resolveFlavorId(reg) {
  const flavors = reg?.flavors || {};
  const valid = (id) => (id && flavors[id] ? id : null);

  try {
    const q = new URLSearchParams(location.search).get("flavor");
    const fromQuery = valid(q);
    if (fromQuery) return fromQuery;
  } catch (_) {
    /* ignore */
  }

  /* Dev multi-server (5174/75/76) and single-flavor deploys: env beats sticky LS */
  const fromEnv = valid(import.meta.env.VITE_FLAVOR);
  if (fromEnv) return fromEnv;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const fromStore = valid(stored);
    if (fromStore) return fromStore;
  } catch (_) {
    /* ignore */
  }

  try {
    const host = (location.hostname || "").toLowerCase();
    const map = reg.hosts || {};
    if (map[host] && valid(map[host])) return map[host];
    /* subdomain: foo.doutrina.org → try exact first (already), then leave to default */
  } catch (_) {
    /* ignore */
  }

  return valid(reg.default) || Object.keys(flavors)[0] || "librus";
}

/**
 * Load registry + resolve active flavor. Call once at boot.
 * @returns {Promise<{ id: string, flavor: object, registry: object }>}
 */
export async function loadFlavor() {
  try {
    const res = await fetch("/flavors.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(String(res.status));
    registry = await res.json();
  } catch (err) {
    console.warn("[flavor] flavors.json failed, using fallback", err);
    registry = FALLBACK;
  }
  if (!registry?.flavors) registry = FALLBACK;

  currentId = resolveFlavorId(registry);
  currentFlavor = registry.flavors[currentId] || registry.flavors[registry.default] || FALLBACK.flavors.librus;
  currentId = currentFlavor.id || currentId;
  return { id: currentId, flavor: currentFlavor, registry };
}

export function getFlavorId() {
  return currentId;
}

export function getFlavor() {
  return currentFlavor;
}

/** Sticky override for local testing (or clear with null). */
export function setFlavorOverride(id) {
  try {
    if (!id) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, id);
  } catch (_) {
    /* ignore */
  }
}

/**
 * Filter unified catalog by flavor profile + UI language.
 * Entries without `lang` are shown for every language.
 * @param {Array<object>} all
 * @param {string} [profileId]
 * @param {'pt'|'en'} [lang]
 */
export function filterCatalog(all, profileId, lang) {
  const id = profileId || currentFlavor?.profile || currentId;
  if (!Array.isArray(all) || !all.length) return [];
  const hasProfiles = all.some((e) => e && Array.isArray(e.profiles));
  let list;
  if (!hasProfiles) {
    list = all.slice();
  } else {
    list = all.filter(
      (e) => e && Array.isArray(e.profiles) && e.profiles.indexOf(id) !== -1,
    );
  }
  if (lang === "en" || lang === "pt") {
    const matched = list.filter((e) => {
      if (!e) return false;
      if (!e.lang) return true; /* undated = all langs */
      return e.lang === lang;
    });
    /* Only apply lang filter when this flavor has at least one book in that lang */
    if (matched.length) list = matched;
  }
  const pin = currentFlavor?.features?.pinFirst;
  if (Array.isArray(pin) && pin.length) {
    list = list.slice().sort((a, b) => {
      const ai = pin.indexOf(a.id);
      const bi = pin.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }
  return list;
}

/**
 * Find catalog entry for the same work in another language (pairId).
 * @param {Array<object>} all
 * @param {object} entry current catalog entry or book
 * @param {'pt'|'en'} wantLang
 */
export function findPairedEdition(all, entry, wantLang) {
  if (!entry || !Array.isArray(all)) return null;
  const pair = entry.pairId || entry.id;
  const want = wantLang === "en" ? "en" : "pt";
  return (
    all.find(
      (e) =>
        e &&
        (e.pairId === pair || e.id === pair) &&
        (e.lang || "en") === want,
    ) || null
  );
}

/**
 * Apply brand to document + library chrome.
 * @param {object} flavor
 * @param {'pt'|'en'} lang
 * @param {'light'|'dark'} resolvedTheme
 */
export function applyFlavorBrand(flavor, lang, resolvedTheme) {
  if (!flavor) return;
  const brand = flavor.brand || {};
  const id = flavor.id || "librus";

  document.documentElement.dataset.flavor = id;
  if (document.body) document.body.dataset.flavor = id;

  if (brand.title) document.title = brand.title;
  if (brand.description) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", brand.description);
  }

  if (brand.accent) {
    document.documentElement.style.setProperty("--accent", brand.accent);
  }

  const fav = document.getElementById("favicon");
  if (fav) {
    const href =
      resolvedTheme === "dark" && brand.faviconDark
        ? brand.faviconDark
        : brand.favicon || "/favicon.svg";
    fav.href = href;
  }

  /* Top browser/PWA chrome: neutral grey only (syncBrowserChrome in main owns it) */
  try {
    const metaTheme = document.getElementById("meta-theme-color");
    if (metaTheme) {
      metaTheme.content = resolvedTheme === "dark" ? "#202124" : "#e8eaed";
    }
  } catch (_) {
    /* ignore */
  }

  /* PWA install surface: per-flavor name + icons (static manifests under /public) */
  const nextManifest = `/manifest-${id}.webmanifest`;
  let manifest = document.getElementById("web-manifest");
  if (!manifest) {
    manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) manifest.id = "web-manifest";
  }
  /* Drop vite-plugin-pwa’s default /manifest.webmanifest if a second link was injected */
  document.querySelectorAll('link[rel="manifest"]').forEach((link) => {
    if (link !== manifest) link.remove();
  });
  if (manifest && manifest.getAttribute("href") !== nextManifest) {
    manifest.setAttribute("href", nextManifest);
  }
  const apple = document.getElementById("apple-touch-icon");
  if (apple) {
    apple.href = `/pwa/${id}-apple-touch-icon.png`;
  }

  const titleEl = document.querySelector("#library > header h1");
  if (titleEl && brand.name) {
    /* Name lives in a child span so #app-version superscript stays intact */
    const nameEl =
      titleEl.querySelector('[data-i18n="library.title"]') ||
      titleEl.querySelector("span");
    if (nameEl) {
      nameEl.textContent = brand.name;
      nameEl.removeAttribute("data-i18n");
    } else {
      const verEl = titleEl.querySelector("#app-version, .app-version");
      titleEl.textContent = brand.name;
      if (verEl) titleEl.appendChild(verEl);
    }
    titleEl.removeAttribute("data-i18n");
  }

  /* Bottom bar product name (filled text) */
  const barTitle = document.getElementById("app-title");
  if (barTitle && brand.name) {
    barTitle.textContent = brand.name;
  }

  const ctaNode =
    document.querySelector("#library > header .library-cta") ||
    document.querySelector('#library > header p[data-i18n="library.cta"]');
  if (ctaNode && brand.cta) {
    const code = lang === "en" ? "en" : "pt";
    ctaNode.textContent = brand.cta[code] || brand.cta.pt || ctaNode.textContent;
    ctaNode.classList.add("library-cta");
    ctaNode.removeAttribute("data-i18n");
  }

  /* Library mark: SVG file or data-icon (icon fallback if mark missing) */
  const markHost = document.querySelector(
    "#library > header [data-brand-mark], #library > header .library-mark, #library > header [data-icon]",
  );
  if (markHost) {
    const useMark = (src) => {
      markHost.removeAttribute("data-icon");
      markHost.setAttribute("data-brand-mark", "1");
      markHost.innerHTML =
        '<img src="' +
        src +
        '" alt="" width="56" height="56" decoding="async" onerror="this.remove()" />';
    };
    const useIcon = (name) => {
      markHost.removeAttribute("data-brand-mark");
      markHost.setAttribute("data-icon", name);
      markHost.setAttribute("data-icon-size", "56");
      markHost.innerHTML = "";
    };
    if (brand.mark) {
      useMark(brand.mark);
    } else if (brand.favicon) {
      useMark(brand.favicon);
    } else if (brand.icon) {
      useIcon(brand.icon);
    }
  }

  const tagline = document.querySelector('[data-i18n="help.tagline"]');
  if (tagline && brand.tagline) {
    const code = lang === "en" ? "en" : "pt";
    tagline.textContent = brand.tagline[code] || brand.tagline.pt || tagline.textContent;
  }

  const feat = flavor.features || {};

  /* Video / JaaS: opt-in per flavor (centro on; librus & doutrina off) */
  const jaasOn = feat.jaas === true;
  document.documentElement.dataset.flavorJaas = jaasOn ? "1" : "0";
  document.querySelectorAll(
    '[data-mode="consult:video"], [data-tool="consult:video"], [data-panel="consult:video"], fieldset[data-feat="jaas"], #help-feat-jaas, [data-feat="jaas"]',
  ).forEach((el) => {
    el.hidden = !jaasOn;
    if (!jaasOn) el.classList.remove("on");
  });
  if (!jaasOn) {
    /* Leave consult on web if video was active */
    const webMode = document.querySelector('[data-mode="consult:web"]');
    const webTool = document.querySelector('[data-tool="consult:web"]');
    const webPanel = document.querySelector('[data-panel="consult:web"]');
    if (webMode) webMode.classList.add("on");
    if (webTool) {
      webTool.hidden = false;
      webTool.classList.add("on");
    }
    if (webPanel) {
      webPanel.hidden = false;
      webPanel.classList.add("on");
    }
  }

  /* Optional: default JaaS room (only when video enabled) */
  const room = document.getElementById("jitsi-room");
  if (jaasOn && room && feat.jaasRoom && !room.dataset.userEdited) {
    room.value = feat.jaasRoom;
  }

  /* Hide provider buttons not listed for this flavor (when specified) */
  const allowed = feat.providers;
  if (Array.isArray(allowed) && allowed.length) {
    document.querySelectorAll("[data-provider]").forEach((btn) => {
      const key = btn.getAttribute("data-provider");
      btn.hidden = allowed.indexOf(key) === -1;
    });
    /* Páginas toolbar: only Luz / Encyc / Dict, further gated by flavor */
    document.querySelectorAll("[data-link].link-toggle").forEach((btn) => {
      const key = btn.getAttribute("data-link");
      btn.hidden = !key || allowed.indexOf(key) === -1;
    });
  } else {
    document.querySelectorAll("[data-provider]").forEach((btn) => {
      btn.hidden = false;
    });
    document.querySelectorAll("[data-link].link-toggle").forEach((btn) => {
      btn.hidden = false;
    });
  }
}

/**
 * Favicon path for current flavor + theme (used from setTheme).
 * @param {'light'|'dark'} resolvedTheme
 */
export function flavorFavicon(resolvedTheme) {
  const brand = currentFlavor?.brand || {};
  if (resolvedTheme === "dark" && brand.faviconDark) return brand.faviconDark;
  return brand.favicon || (resolvedTheme === "dark" ? "/favicon-dark.svg" : "/favicon.svg");
}
