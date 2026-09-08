/**
 * JaaS (8x8) video — imported only when FEAT.jaas is true.
 */
const STORAGE = "librus-jaas";
let api = null;
/** @type {(key: string) => string} */
let t = (k) => k;

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) || "{}") || {};
  } catch (_) {
    return {};
  }
}

function saveSettings(partial) {
  const next = { ...loadSettings(), ...partial };
  try {
    localStorage.setItem(STORAGE, JSON.stringify(next));
  } catch (_) {
    /* private mode */
  }
  return next;
}

function loadExternalApi(appId) {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve(window.JitsiMeetExternalAPI);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://8x8.vc/" + encodeURIComponent(appId) + "/external_api.js";
    s.async = true;
    s.onload = () => {
      if (window.JitsiMeetExternalAPI) resolve(window.JitsiMeetExternalAPI);
      else reject(new Error("JaaS API missing"));
    };
    s.onerror = () => reject(new Error("JaaS script failed"));
    document.head.appendChild(s);
  });
}

function statusEl() {
  return document.getElementById("meet-status");
}

function setStatus(text) {
  const el = statusEl();
  if (el) el.textContent = text;
}

function setLive(on) {
  const panel = document.getElementById("video-panel");
  const host = document.getElementById("meet-jaas-host");
  const idle = document.getElementById("video-mock");
  if (panel) panel.classList.toggle("is-live", !!on);
  if (host) host.hidden = !on;
  if (idle) idle.hidden = !!on;
}

const IFRAME_ALLOW =
  "camera *; microphone *; display-capture *; autoplay *; clipboard-write *; hid *; screen-wake-lock *; fullscreen *";

/** 8x8/Jitsi treat missing iframe allow + HTTP-on-LAN as “browser not supported”. */
function unlockIframeMedia(host) {
  const apply = (iframe) => {
    if (!(iframe instanceof HTMLIFrameElement)) return;
    iframe.setAttribute("allow", IFRAME_ALLOW);
    iframe.setAttribute("allowfullscreen", "true");
    iframe.allowFullscreen = true;
  };
  host?.querySelectorAll("iframe").forEach(apply);
  if (!host || typeof MutationObserver !== "function") return;
  const obs = new MutationObserver(() => {
    host.querySelectorAll("iframe").forEach(apply);
  });
  obs.observe(host, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 8000);
}

function leave() {
  if (api) {
    try {
      api.dispose();
    } catch (_) {
      /* ignore */
    }
    api = null;
  }
  const host = document.getElementById("meet-jaas-host");
  if (host) host.innerHTML = "";
  setLive(false);
  syncIdleStatus();
}

function currentFields() {
  const appIdEl = document.getElementById("jitsi-app-id");
  const roomEl = document.getElementById("jitsi-room");
  const nameEl = document.getElementById("jitsi-name");
  const saved = loadSettings();
  return {
    appId: (appIdEl?.value || saved.appId || "").trim(),
    room: (roomEl?.value || saved.room || "librus-estudo").trim() || "librus-estudo",
    name: (nameEl?.value || saved.name || "").trim(),
  };
}

function persistFields() {
  const roomEl = document.getElementById("jitsi-room");
  if (roomEl) roomEl.dataset.userEdited = "1";
  const next = currentFields();
  saveSettings(next);
  if (!api) syncIdleStatus();
  return next;
}

function syncIdleStatus() {
  if (api) return;
  const { appId, room } = currentFields();
  setStatus(
    appId ? t("meet.ready").replace("{room}", room) : t("meet.hint"),
  );
}

/**
 * @param {(key: string) => string} translate
 * @param {() => 'pt'|'en'} [getLang]
 */
export function wireJaasUi(translate, getLang) {
  if (typeof translate === "function") t = translate;
  const appIdEl = document.getElementById("jitsi-app-id");
  const roomEl = document.getElementById("jitsi-room");
  const nameEl = document.getElementById("jitsi-name");
  const saved = loadSettings();
  if (appIdEl && !appIdEl.value) appIdEl.value = saved.appId || "";
  if (roomEl && !roomEl.dataset.userEdited) {
    roomEl.value = saved.room || roomEl.value || "librus-estudo";
  }
  if (nameEl && !nameEl.value) nameEl.value = saved.name || "";

  [appIdEl, roomEl, nameEl].forEach((el) => {
    el?.addEventListener("input", persistFields);
    el?.addEventListener("change", persistFields);
  });

  async function join(mode) {
    const { appId, room, name } = persistFields();
    if (!appId) {
      setStatus(t("meet.needAppId"));
      return;
    }
    if (!window.isSecureContext) {
      setStatus(t("meet.needHttps"));
      return;
    }
    setStatus(t("meet.connecting"));
    const host = document.getElementById("meet-jaas-host");
    try {
      const Jitsi = await loadExternalApi(appId);
      if (api) {
        try {
          api.dispose();
        } catch (_) {
          /* ignore */
        }
        api = null;
      }
      if (!host) throw new Error("no host");
      host.innerHTML = "";
      setLive(true);
      unlockIframeMedia(host);
      const lang = typeof getLang === "function" && getLang() === "en" ? "en" : "pt-BR";
      api = new Jitsi("8x8.vc", {
        roomName: appId + "/" + room,
        parentNode: host,
        width: "100%",
        height: "100%",
        lang,
        userInfo: { displayName: name || "Guest" },
        configOverwrite: {
          startWithAudioMuted: mode === "video",
          startWithVideoMuted: mode !== "video",
          disableDeepLinking: true,
          prejoinConfig: { enabled: true },
          disableInitialGUM: false,
        },
        interfaceConfigOverwrite: {
          SHOW_CHROME_EXTENSION_BANNER: false,
        },
      });
      api.addListener?.("videoConferenceJoined", () => {
        setStatus(
          (mode === "video" ? t("meet.inVideo") : t("meet.inVoice")).replace(
            "{room}",
            room,
          ),
        );
      });
      api.addListener?.("readyToClose", () => leave());
      setStatus(
        (mode === "video" ? t("meet.inVideo") : t("meet.inVoice")).replace(
          "{room}",
          room,
        ),
      );
    } catch (err) {
      console.warn("[POC] JaaS", err);
      leave();
      setStatus(t("meet.loadError"));
    }
  }

  document.querySelectorAll("[data-jitsi]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const a = btn.getAttribute("data-jitsi");
      if (a === "join-video") join("video");
      if (a === "join-voice") join("voice");
      if (a === "leave") leave();
    });
  });

  setLive(false);
  syncIdleStatus();
}
