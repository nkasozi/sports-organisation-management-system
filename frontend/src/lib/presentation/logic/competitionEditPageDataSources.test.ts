import { describe, expect, it, vi } from "vitest";

import { load_competition_edit_page_data } from "./competitionEditPageData";

vi.mock("$lib/adapters/persistence/sportService", () => ({
  get_sport_by_id: vi.fn(),
}));

vi.mock("./competitionEditPageState", () => ({
  create_competition_update_form_data: vi.fn(() => ({ id: "c-1" })),
}));

function create_dependencies(competition_result: unknown): {
  competition_format_use_cases: { list: ReturnType<typeof vi.fn> };
  competition_team_use_cases: {
    list_teams_in_competition: ReturnType<typeof vi.fn>;
  };
  competition_use_cases: { get_by_id: ReturnType<typeof vi.fn> };
  organization_use_cases: { list: ReturnType<typeof vi.fn> };
  team_use_cases: { list: ReturnType<typeof vi.fn> };
} {
  const failed = vi.fn(async () => ({ success: false }));
  return {
    competition_format_use_cases: { list: failed },
    competition_team_use_cases: { list_teams_in_competition: failed },
    competition_use_cases: {
      get_by_id: vi.fn(async () => competition_result),
    },
    organization_use_cases: { list: failed },
    team_use_cases: { list: failed },
  };
}

describe("load_competition_edit_page_data sources", () => {
  it("reports a missing competition", async () => {
    await expect(
      load_competition_edit_page_data({
        competition_id: "c-1",
        current_profile_state: { status: "missing" },
        dependencies: create_dependencies({ success: true }) as never,
      }),
    ).resolves.toEqual({
      success: false,
      error_message: "Competition not found",
    });
  });

  it("uses the default failure message when the error is empty", async () => {
    await expect(
      load_competition_edit_page_data({
        competition_id: "c-1",
        current_profile_state: { status: "missing" },
        dependencies: create_dependencies({ success: false }) as never,
      }),
    ).resolves.toEqual({
      success: false,
      error_message: "Failed to load competition",
    });
  });

  it("falls back to empty collections when list calls fail", async () => {
    const dependencies = create_dependencies({
      success: true,
      data: { id: "c-1", organization_id: "o-1", competition_format_id: "f" },
    });
    const result = await load_competition_edit_page_data({
      competition_id: "c-1",
      current_profile_state: { status: "missing" },
      dependencies: dependencies as never,
    });
    expect(dependencies.competition_format_use_cases.list).toHaveBeenCalledWith(
      {},
      { page_number: 1, page_size: 100 },
    );
    expect(dependencies.team_use_cases.list).toHaveBeenCalledWith(
      {},
      { page_number: 1, page_size: 100 },
    );
    expect(result).toEqual({
      success: true,
      data: {
        competition: {
          id: "c-1",
          organization_id: "o-1",
          competition_format_id: "f",
        },
        organizations: [],
        competition_formats: [],
        all_teams: [],
        competition_team_entries: [],
        form_data: { id: "c-1" },
        selected_format_state: { status: "missing" },
        selected_sport_state: { status: "missing" },
        is_customizing_scoring: false,
      },
    });
  });
});
