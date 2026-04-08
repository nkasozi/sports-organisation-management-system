import { describe, expect, it } from "vitest";

import { prerender } from "./+page";

describe("competitions/[id] +page", () => {
  it("disables prerendering", () => {
    expect(prerender).toBe(false);
  });
});
