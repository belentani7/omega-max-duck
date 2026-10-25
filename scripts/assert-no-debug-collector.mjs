import fs from "node:fs";
import path from "node:path";

const publicOutput = path.resolve("dist/public");
const collectorPath = path.join(publicOutput, "__manus__", "debug-collector.js");
const htmlPath = path.join(publicOutput, "index.html");

if (fs.existsSync(collectorPath)) {
  throw new Error("Production output must not include the Manus debug collector.");
}

if (!fs.existsSync(htmlPath)) {
  throw new Error("Production output is missing dist/public/index.html.");
}

const html = fs.readFileSync(htmlPath, "utf8");
if (html.includes("/__manus__/debug-collector.js")) {
  throw new Error("Production HTML must not reference the Manus debug collector.");
}

if (html.includes("%VITE_ANALYTICS_") || html.includes("/umami")) {
  throw new Error("Production HTML must not contain unapproved analytics or unresolved placeholders.");
}

if (html.includes("maximum-scale") || html.includes("user-scalable=no")) {
  throw new Error("Production viewport must not prevent user zoom.");
}

console.log("Production privacy check passed.");
