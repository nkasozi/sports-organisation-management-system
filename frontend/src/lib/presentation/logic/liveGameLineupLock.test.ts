import { describe, expect, it, vi } from "vitest";

import { lock_fixture_lineups_after_start } from "./liveGameLineupLock";

function lineup_use_cases(lineups: Array<{ id: string; status: string }>): {
  get_lineups_for_fixture: ReturnType<typeof vi.fn>;
  lock_lineup: ReturnType<typeof vi.fn>;
} {
  return {
    get_lineups_for_fixture: vi
      .fn()
      .mockResolvedValue({ success: true, data: lineups }),
    lock_lineup: vi.fn().mockResolvedValue({ success: true, data: {} }),
  };
}

describe("lock_fixture_lineups_after_start", () => {
  it("locks every lineup of the fixture that is not locked yet", async () => {
    const use_cases = lineup_use_cases([
      { id: "home", status: "submitted" },
      { id: "away", status: "locked" },
      { id: "late", status: "draft" },
    ]);
    const result = await lock_fixture_lineups_after_start(
      "fixture-1" as never,
      use_cases as never,
    );
    expect(use_cases.lock_lineup.mock.calls).toEqual([["home"], ["late"]]);
    expect(result).toEqual({ locked_count: 2, failed_count: 0 });
  });

  it("reports lineups that could not be locked without stopping the others", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => true);
    const use_cases = lineup_use_cases([
      { id: "home", status: "submitted" },
      { id: "away", status: "submitted" },
    ]);
    use_cases.lock_lineup.mockResolvedValueOnce({
      success: false,
      error: "offline",
    });
    const result = await lock_fixture_lineups_after_start(
      "fixture-1" as never,
      use_cases as never,
    );
    expect(result).toEqual({ locked_count: 1, failed_count: 1 });
  });

  it("reports a failed lookup as zero locked lineups", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => true);
    const use_cases = lineup_use_cases([]);
    use_cases.get_lineups_for_fixture.mockResolvedValue({
      success: false,
      error: "offline",
    });
    const result = await lock_fixture_lineups_after_start(
      "fixture-1" as never,
      use_cases as never,
    );
    expect(result).toEqual({ locked_count: 0, failed_count: 1 });
  });
});
