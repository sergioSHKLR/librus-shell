from pathlib import Path

p = Path("src/main.js")
s = p.read_text()
if "function isTallAndroidPhone()" in s:
    print("already patched")
    raise SystemExit(0)
s = s.replace(
    'const APP_VERSION = "0.9.12"; // 2026-09-10 — manual FS button, no auto-enter',
    'const APP_VERSION = "0.9.13"; // 2026-09-10 — no FS API on tall Android phones',
    1,
)
old = '''function isAndroidUa() {
return /Android/i.test(navigator.userAgent || "");
}
'''
new = '''function isAndroidUa() {
  return /Android/i.test(navigator.userAgent || "");
}

/** Tall phones (Moto G Stylus class) vs slates (Tab M9). */
function isTallAndroidPhone() {
  if (!isAndroidUa()) return false;
  const w = window.innerWidth || 0;
  const h = window.innerHeight || 0;
  const short = Math.min(w, h);
  const long = Math.max(w, h);
  if (!short) return true;
  return long / short >= 1.85;
}

function allowFullscreenApi() {
  if (!canToggleFullscreen()) return false;
  if (isTallAndroidPhone()) return false;
  return true;
}
'''
if old not in s:
    raise SystemExit("isAndroidUa block missing")
s = s.replace(old, new, 1)
s = s.replace(
    "function enterDocFullscreen() {\n  if (fsUnsticky) return;\n",
    "function enterDocFullscreen() {\n  if (!allowFullscreenApi() || fsUnsticky) return;\n",
    1,
)
s = s.replace(
    "function toggleAppFullscreen() {\n  if (fsUnsticky && !isDocFullscreen()) return;\n",
    "function toggleAppFullscreen() {\n  if (!allowFullscreenApi() && !isDocFullscreen()) return;\n  if (fsUnsticky && !isDocFullscreen()) return;\n",
    1,
)
s = s.replace(
    "  const api = canToggleFullscreen();\n  btn.hidden = !api;",
    "  const api = allowFullscreenApi();\n  btn.hidden = !api;",
    1,
)
p.write_text(s)
print("ok")
