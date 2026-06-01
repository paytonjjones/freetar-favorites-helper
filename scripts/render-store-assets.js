const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const sourceDir = path.join(root, "assets", "source");
const outDir = path.join(root, "assets", "chrome-store");
const tmpDir = path.join(root, ".tmp-store-assets");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { stdio: "inherit", ...options });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

function findChrome() {
  const envChrome = process.env.CHROME_BIN;
  if (envChrome && fs.existsSync(envChrome)) return envChrome;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium"
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  const which = spawnSync("which", ["google-chrome"], { encoding: "utf8" });
  if (which.status === 0) {
    const found = which.stdout.trim();
    if (found) return found;
  }
  throw new Error("Could not find a Chrome binary for the screenshot render.");
}

const chrome = findChrome();
const previewUrl = `file://${path.join(root, "scripts", "store-preview.html")}`;
const rawScreenshot = path.join(tmpDir, "screenshot.png");
const finalScreenshot = path.join(outDir, "screenshot-1.jpg");
const finalSmallPromo = path.join(outDir, "small-promo.jpg");
const finalMarquee = path.join(outDir, "marquee-promo.jpg");

run(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--allow-file-access-from-files",
  "--window-size=1280,800",
  `--screenshot=${rawScreenshot}`,
  previewUrl
]);

run("magick", [
  rawScreenshot,
  "-background",
  "white",
  "-alpha",
  "remove",
  "-alpha",
  "off",
  "-strip",
  "-quality",
  "92",
  finalScreenshot
]);

run("magick", [
  path.join(sourceDir, "canvas-440.png"),
  "-resize",
  "440x280^",
  "-gravity",
  "center",
  "-extent",
  "440x280",
  "-background",
  "white",
  "-alpha",
  "remove",
  "-alpha",
  "off",
  "-strip",
  "-quality",
  "92",
  finalSmallPromo
]);

run("magick", [
  path.join(sourceDir, "canvas-1400.png"),
  "-resize",
  "1400x560^",
  "-gravity",
  "center",
  "-extent",
  "1400x560",
  "-background",
  "white",
  "-alpha",
  "remove",
  "-alpha",
  "off",
  "-strip",
  "-quality",
  "92",
  finalMarquee
]);

console.log("Rendered store assets:");
console.log(`- ${path.relative(root, finalScreenshot)}`);
console.log(`- ${path.relative(root, finalSmallPromo)}`);
console.log(`- ${path.relative(root, finalMarquee)}`);
