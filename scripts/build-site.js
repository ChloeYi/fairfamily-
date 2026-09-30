// Assembles the Vercel site in dist/: marketing pages at /, React app at /app.
// Run via `npm run build:site` (the React build has already written dist/app).
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "website");
const OUT = path.join(__dirname, "..", "dist");
// Old copies of the app build live in website/ — never ship them.
const SKIP = new Set(["app.html", "static", "asset-manifest.json"]);

for (const name of fs.readdirSync(SRC)) {
  if (SKIP.has(name) || name.startsWith(".")) continue;
  fs.cpSync(path.join(SRC, name), path.join(OUT, name), { recursive: true });
}
console.log("Site assembled in dist/ (landing at /, app at /app)");
