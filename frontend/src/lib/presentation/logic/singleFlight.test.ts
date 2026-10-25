import { describe, expect, it, vi } from "vitest";

import { create_single_flight } from "./singleFlight";

describe("single flight", () => {
  it("shares one run between overlapping callers for the same key", async () => {
    const once = create_single_flight<number>();
    const run = vi.fn(async () => 7);
    const results = await Promise.all([once("org", run), once("org", run)]);
    expect(results).toEqual([7, 7]);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("runs again once the first run has finished, and per key", async () => {
    const once = create_single_flight<number>();
    const run = vi.fn(async () => 1);
    await once("org", run);
    await Promise.all([once("org", run), once("other", run)]);
    expect(run).toHaveBeenCalledTimes(3);
  });
});
