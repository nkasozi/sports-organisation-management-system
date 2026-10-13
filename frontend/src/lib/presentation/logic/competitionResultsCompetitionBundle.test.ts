import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  COMPETITION_RESULTS_BUNDLE_LOAD_STATUS,
  load_selected_competition_bundle,
} from "./competitionResultsCompetitionBundle";

const EMPTY_LIST = { success: true, data: { items: [] } };

function create_dependencies(overrides: Record<string, unknown> = {}): never {
  return {
    competition_use_cases: {
      get_by_id: async () => ({ success: false, error: "missing" }),
    },
    format_use_cases: {
      get_by_id: async () => ({ success: false, error: "missing" }),
    },
    competition_stage_use_cases: {
      list_stages_by_competition: async () => EMPTY_LIST,
    },
    competition_team_use_cases: {
      list_teams_in_competition: async () => EMPTY_LIST,
    },
    team_use_cases: { get_by_id: async () => ({ success: false }) },
    fixture_use_cases: {
      list_fixtures_by_competition: async () => EMPTY_LIST,
    },
    ...overrides,
  } as never;
}

describe("load_selected_competition_bundle load state", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports a loaded bundle when every source loads", async () => {
    const bundle = await load_selected_competition_bundle(
      create_dependencies(),
      "competition-1",
    );
    expect(bundle.load_state).toEqual({
      status: COMPETITION_RESULTS_BUNDLE_LOAD_STATUS.LOADED,
    });
  });

  it.each([
    [
      "fixtures",
      {
        fixture_use_cases: {
          list_fixtures_by_competition: async () => ({
            success: false,
            error: "offline",
          }),
        },
      },
    ],
    [
      "teams",
      {
        competition_team_use_cases: {
          list_teams_in_competition: async () => ({
            success: false,
            error: "offline",
          }),
        },
      },
    ],
    [
      "stages",
      {
        competition_stage_use_cases: {
          list_stages_by_competition: async () => ({
            success: false,
            error: "offline",
          }),
        },
      },
    ],
  ])(
    "reports a failure when %s cannot be loaded",
    async (source, overrides) => {
      const bundle = await load_selected_competition_bundle(
        create_dependencies(overrides),
        "competition-1",
      );
      expect(bundle.load_state.status).toBe(
        COMPETITION_RESULTS_BUNDLE_LOAD_STATUS.FAILED,
      );
      expect(
        bundle.load_state.status ===
          COMPETITION_RESULTS_BUNDLE_LOAD_STATUS.FAILED &&
          bundle.load_state.error_message.length > 0,
      ).toBe(true);
      expect(console.error).toHaveBeenCalledWith(
        "[CompetitionResults] Failed to load competition results data",
        expect.objectContaining({
          event: "competition_results_bundle_load_failed",
          competition_id: "competition-1",
          failed_sources: [source],
        }),
      );
    },
  );
});
