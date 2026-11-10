// READ-ONLY WINDOWS BASELINE for the Phase 1 audit. Changes nothing, clicks nothing, types nothing.
// It only times: PowerShell start-up, a C# Add-Type compile (the same kind the mouse tools do on every call),
// the primary-screen-bounds query, and tools.screenshot() (writes %TEMP%\9jarvis-screenshot.png like the app does).
//
// Run from a scratch folder that holds a COPY of tools.js (never inside the project):
//   node bench-windows-baseline.js .\tools.js
// UNTESTED on Windows by its author (written on Linux). Numbers come from YOUR machine only.
"use strict";
const path = require("path");
const { execFileSync } = require("child_process");

if (process.platform !== "win32") {
  console.error("Run this on Windows.");
  process.exit(2);
}
const toolsPath = path.resolve(process.argv[2] || "./tools.js");
const N = 5;
const ms = (t) => Number(process.hrtime.bigint() - t) / 1e6;
const stats = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return `min ${s[0].toFixed(0)}  median ${s[Math.floor(s.length / 2)].toFixed(0)}  max ${s[s.length - 1].toFixed(0)} ms`;
};
const ps = (cmd) =>
  execFileSync("powershell.exe", ["-NoProfile", "-Command", cmd], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
function time(label, fn, n = N) {
  const runs = [];
  for (let i = 0; i < n; i++) {
    const t = process.hrtime.bigint();
    fn();
    runs.push(ms(t));
  }
  console.log(
    `${label.padEnd(58)} first ${runs[0].toFixed(0).padStart(5)} ms | ${stats(runs)}`,
  );
}

console.log(
  `Node ${process.version}, ${process.platform}, ${N} runs each (first run is shown separately)\n`,
);
time("powershell.exe -NoProfile -Command 1   (bare start-up)", () => ps("1"));
time("PS + System.Windows.Forms screen-bounds query", () =>
  ps(
    "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width",
  ),
);
time("PS + C# Add-Type compile (like MouseControl, no call)", () =>
  ps(
    "Add-Type @'\nusing System; using System.Runtime.InteropServices;\npublic class J9Bench { [DllImport(\"user32.dll\")] public static extern bool SetCursorPos(int x, int y); }\n'@",
  ),
);

const { screenshot } = require(toolsPath);
const shots = [];
for (let i = 0; i < 3; i++) {
  const t = process.hrtime.bigint();
  const r = screenshot();
  const dt = ms(t);
  if (!r.success) {
    console.log("screenshot() failed:", r.error);
    break;
  }
  shots.push(dt);
  if (i === 0)
    console.log(
      `\nscreenshot(): ${r.width}x${r.height}, PNG base64 string = ${(r.image.length / 1e6).toFixed(2)} MB (about ${((r.image.length * 0.75) / 1e6).toFixed(2)} MB binary)`,
    );
}
if (shots.length)
  console.log(
    `screenshot() wall time, blocks the Node event loop: ${stats(shots)}`,
  );
console.log(
  "\nA mouse_click in the app = one screen-bounds query + one Add-Type compile (two PowerShell processes). Compare with the lines above.",
);
