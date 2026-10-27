import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");

describe("public HTML privacy and accessibility gates", () => {
  it("does not inject analytics or unresolved analytics placeholders", () => {
    expect(html).not.toContain("%VITE_ANALYTICS_");
    expect(html).not.toContain("/umami");
  });

  it("allows user zoom rather than limiting maximum scale", () => {
    expect(html).toContain('name="viewport"');
    expect(html).not.toContain("maximum-scale");
    expect(html).not.toContain("user-scalable=no");
  });
});
