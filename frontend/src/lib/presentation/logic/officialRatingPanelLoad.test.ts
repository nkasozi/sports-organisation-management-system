import { afterEach, describe, expect, it, vi } from "vitest";

import { resolve_official_rating_submit_feedback } from "./officialRatingPanelFeedback";
import {
  OFFICIAL_RATING_PANEL_EVENT,
  OFFICIAL_RATING_PANEL_MESSAGE,
} from "./officialRatingPanelMessages";
import {
  load_official_rating_panel,
  load_official_rating_states,
} from "./officialRatingPanelState";
import { TOAST_KIND } from "./toastConfig";

const LOAD_COMMAND = {
  fixture_id: "fixture-1",
  organization_id: "organization-1",
  assigned_official_ids: ["official-1"],
  rater_user_id: "rater-1",
};

function build_dependencies(command: {
  officials_ok: boolean;
  ratings_ok: boolean;
}): never {
  return {
    official_use_cases: {
      list: async () =>
        command.officials_ok
          ? { success: true, data: { items: [{ id: "official-1" }] } }
          : { success: false },
    },
    rating_use_cases: {
      list_by_fixture: async () =>
        command.ratings_ok
          ? { success: true, data: { items: [] } }
          : { success: false },
    },
  } as never;
}

describe("load_official_rating_panel", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns a friendly failure and logs when officials cannot load", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await load_official_rating_panel(
      LOAD_COMMAND,
      build_dependencies({ officials_ok: false, ratings_ok: true }),
    );
    expect(result).toEqual({
      success: false,
      error: OFFICIAL_RATING_PANEL_MESSAGE.OFFICIALS_LOAD_FAILED,
    });
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: OFFICIAL_RATING_PANEL_EVENT.OFFICIALS_LOAD_FAILED,
        fixture_id: "fixture-1",
      }),
    );
  });

  it("logs and keeps default ratings when existing ratings cannot load", async () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await load_official_rating_panel(
      LOAD_COMMAND,
      build_dependencies({ officials_ok: true, ratings_ok: false }),
    );
    expect(result.success && result.data.length).toBe(1);
    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: OFFICIAL_RATING_PANEL_EVENT.RATINGS_LOAD_FAILED,
      }),
    );
    expect(
      await load_official_rating_states(
        "fixture-1",
        "organization-1",
        ["official-1"],
        "rater-1",
        build_dependencies({ officials_ok: false, ratings_ok: true }),
      ),
    ).toEqual([]);
  });

  it("returns rating states with defaults when everything loads", async () => {
    const result = await load_official_rating_panel(
      LOAD_COMMAND,
      build_dependencies({ officials_ok: true, ratings_ok: true }),
    );
    expect(result.success && result.data.map((s) => s.existing_id)).toEqual([
      "",
    ]);
  });
});

describe("resolve_official_rating_submit_feedback", () => {
  afterEach(() => vi.restoreAllMocks());

  const context = {
    fixture_id: "fixture-1",
    official_id: "official-1",
    official_name: "Ref One",
  };

  it("returns a success toast naming the official", () => {
    expect(
      resolve_official_rating_submit_feedback(
        { success: true, data: { id: "rating-1" } },
        context,
      ),
    ).toEqual({
      toast_type: TOAST_KIND.SUCCESS,
      toast_message: `${OFFICIAL_RATING_PANEL_MESSAGE.SUBMIT_SUCCEEDED_PREFIX} Ref One`,
    });
  });

  it("hides the raw error behind a friendly message and logs it", () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      resolve_official_rating_submit_feedback(
        { success: false, error: "IndexedDB write failed: quota" },
        context,
      ),
    ).toEqual({
      toast_type: TOAST_KIND.ERROR,
      toast_message: OFFICIAL_RATING_PANEL_MESSAGE.SUBMIT_FAILED,
    });
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: OFFICIAL_RATING_PANEL_EVENT.SUBMIT_FAILED,
        official_id: "official-1",
        error: "IndexedDB write failed: quota",
      }),
    );
  });
});
