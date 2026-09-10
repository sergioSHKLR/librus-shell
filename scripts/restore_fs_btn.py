from pathlib import Path
import subprocess

p = Path("src/main.js")
s = p.read_text()
s = s.replace(
    'const APP_VERSION = "0.9.11"; // 2026-09-10 — no auto Fullscreen API on Android PWA',
    'const APP_VERSION = "0.9.12"; // 2026-09-10 — manual FS button, no auto-enter',
    1,
)
start = s.find("function lockFsIfInstalledAndroid()")
if start < 0:
    raise SystemExit("lockFsIfInstalledAndroid not found")
end = s.find("function toggleAppFullscreen()", start)
s = s[:start] + s[end:]
s = s.replace("  lockFsIfInstalledAndroid();\n", "")
s = s.replace(
    "const api = canToggleFullscreen() && !fsUnsticky;",
    "const api = canToggleFullscreen();",
    1,
)
if "lockFsIfInstalledAndroid" in s:
    raise SystemExit("lock still present")
p.write_text(s)
print("patched", p.stat().st_size)
