import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const gate = fileURLToPath(new URL("../scripts/assert-no-debug-collector.mjs", import.meta.url));
const clean = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>';

const fixtures: Array<{
  name: string;
  html?: string;
  debugAsset?: boolean;
  passes: boolean;
}> = [
  { name: "clean production HTML", html: clean, passes: true },
  { name: "missing output HTML", passes: false },
  { name: "unresolved analytics placeholder", html: clean + "%VITE_ANALYTICS_ENDPOINT%", passes: false },
  { name: "unapproved analytics script", html: clean + '<script src="/umami"></script>', passes: false },
  { name: "browser zoom restriction", html: clean.replace("initial-scale=1.0", "maximum-scale=1"), passes: false },
  { name: "debug collector script reference", html: clean + '<script src="/__manus__/debug-collector.js"></script>', passes: false },
  { name: "debug collector public asset", html: clean, debugAsset: true, passes: false },
];

describe("production privacy gate", () => {
  for (const fixture of fixtures) {
    it(fixture.name, () => {
      const directory = mkdtempSync(join(tmpdir(), "omega-max-duck-privacy-"));
      try {
        const output = join(directory, "dist", "public");
        mkdirSync(output, { recursive: true });
        if (fixture.html !== undefined) {
          writeFileSync(join(output, "index.html"), fixture.html);
        }
        if (fixture.debugAsset) {
          const debugDir = join(output, "__manus__");
          mkdirSync(debugDir, { recursive: true });
          writeFileSync(join(debugDir, "debug-collector.js"), "");
        }
        const result = spawnSync(process.execPath, [gate], {
          cwd: directory,
          encoding: "utf8",
          timeout: 10000,
        });
        expect(result.error).toBeUndefined();
        expect(result.status === 0).toBe(fixture.passes);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    });
  }
});
