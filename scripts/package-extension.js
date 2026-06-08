const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "dist");
const outZip = path.join(outDir, "freetar-favorites-helper.zip");

fs.mkdirSync(outDir, { recursive: true });

const files = [
  "manifest.json",
  "background.js",
  "popup.html",
  "popup.css",
  "popup.js",
  "shared.js",
  "README.md"
];

const dirs = ["icons"];

const result = spawnSync("zip", ["-q", "-r", outZip, ...files, ...dirs], {
  cwd: root,
  stdio: "inherit"
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log(`Wrote ${path.relative(root, outZip)}`);
