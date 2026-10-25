import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");

describe("public HTML privacy and accessibility gates", () => {
  it("does not inject analytics or unresolved analytics placeholders", () => {
    expect(html).not.toMatch(/%VITE_ANALYTICS_|\\/umami/);
  });

  it("allows user zoom rather than limiting maximum scale", () => {
    expect(html).toContain('name="viewport"');
    expect(html).not.toMatch(/maximum-scale|user-scalable\\s*=\\s*no/i);
  });
});
