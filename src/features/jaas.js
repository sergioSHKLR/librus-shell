/**
 * Optional JaaS (8x8) video — only imported when FEAT.jaas is true.
 */
const STORAGE = 'librus-jaas';
let api = null;

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) || '{}') || {};
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
    const s = document.createElement('script');
    s.src = 'https://8x8.vc/' + encodeURIComponent(appId) + '/external_api.js';
    s.async = true;
    s.onload = () => resolve(window.JitsiMeetExternalAPI);
    s.onerror = () => reject(new Error('JaaS script failed'));
    document.head.appendChild(s);
  });
}

export function wireJaasUi(t) {
  const appIdEl = document.getElementById('jitsi-app-id');
  const roomEl = document.getElementById('jitsi-room');
  const nameEl = document.getElementById('jitsi-name');
  const status = document.getElementById('meet-status');
  const host = document.getElementById('meet-jaas-host');
  const saved = loadSettings();
  if (appIdEl) appIdEl.value = saved.appId || '';
  if (roomEl) roomEl.value = saved.room || 'librus-estudo';
  if (nameEl) nameEl.value = saved.name || '';

  [appIdEl, roomEl, nameEl].forEach((el) => {
    el?.addEventListener('change', () => {
      saveSettings({
        appId: appIdEl?.value.trim() || '',
        room: roomEl?.value.trim() || 'librus-estudo',
        name: nameEl?.value.trim() || ''
      });
    });
  });

  async function join(mode) {
    const appId = appIdEl?.value.trim();
    const room = roomEl?.value.trim() || 'librus-estudo';
    const name = nameEl?.value.trim() || 'Guest';
    if (!appId) {
      if (status) status.textContent = t('meet.needAppId');
      return;
    }
    saveSettings({ appId, room, name });
    if (status) status.textContent = t('meet.connecting');
    try {
      const Jitsi = await loadExternalApi(appId);
      leave();
      if (host) {
        host.hidden = false;
        host.innerHTML = '';
      }
      api = new Jitsi('8x8.vc', {
        roomName: appId + '/' + room,
        parentNode: host,
        userInfo: { displayName: name },
        configOverwrite: {
          startWithAudioMuted: mode === 'video',
          startWithVideoMuted: mode !== 'video'
        }
      });
      if (status) {
        status.textContent = (mode === 'video' ? t('meet.inVideo') : t('meet.inVoice')).replace(
          '{room}',
          room
        );
      }
    } catch (err) {
      console.warn('[POC] JaaS', err);
      if (status) status.textContent = t('meet.loadError');
    }
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
    if (host) {
      host.innerHTML = '';
      host.hidden = true;
    }
    if (status) status.textContent = t('meet.hint');
  }

  document.querySelectorAll('[data-jitsi]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const a = btn.getAttribute('data-jitsi');
      if (a === 'join-video') join('video');
      if (a === 'join-voice') join('voice');
      if (a === 'leave') leave();
    });
  });
}
