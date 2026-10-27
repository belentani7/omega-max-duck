import fs from "node:fs";
import path from "node:path";

const publicOutput = path.resolve("dist/public");
const htmlPath = path.join(publicOutput, "index.html");

if (!fs.existsSync(htmlPath)) {
  throw new Error("Production output is missing dist/public/index.html.");
}

// Vite may rename or inline a debug collector into a hashed asset. Checking
// only its original public/ filename leaves those production leaks undetected.
const directories = [publicOutput];
while (directories.length > 0) {
  const directory = directories.pop();
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Production output must not contain symbolic links: ${filePath}`);
    }
    if (entry.isDirectory()) {
      directories.push(filePath);
      continue;
    }
    if (!entry.isFile()) continue;

    if (/debug[-_]collector/i.test(entry.name)) {
      throw new Error(`Production output must not include the Manus debug collector: ${filePath}`);
    }
    if (/\.(?:html|js|mjs|cjs|css|map)$/i.test(entry.name)) {
      // Normalize escaped slashes used in bundled JavaScript strings.
      const source = fs.readFileSync(filePath, "utf8").replaceAll("\\/", "/");
      if (source.includes("__manus__/debug-collector") || /__manus__\/logs(?:[/?"'`]|$)/i.test(source)) {
        throw new Error(`Production asset references the Manus debug collector or log endpoint: ${filePath}`);
      }
    }
  }
}

const html = fs.readFileSync(htmlPath, "utf8");
if (html.includes("%VITE_ANALYTICS_") || html.includes("/umami")) {
  throw new Error("Production HTML must not contain unapproved analytics or unresolved placeholders.");
}

if (html.includes("maximum-scale") || html.includes("user-scalable=no")) {
  throw new Error("Production viewport must not prevent user zoom.");
}

console.log("Production privacy check passed.");
