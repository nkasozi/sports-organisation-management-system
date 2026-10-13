import { describe, expect, it, type Mock, vi } from "vitest";

import { submit_fixture_lineup_create_form } from "./fixtureLineupCreateDataSubmit";

const PRESENT_ORGANIZATION = {
  status: "present",
  organization: { id: "organization-1" } as never,
} as const;
const PRESENT_FIXTURE = {
  status: "present",
  fixture: { id: "fixture-1" } as never,
} as const;
const PRESENT_TEAM = {
  status: "present",
  team: { id: "team-1" } as never,
} as const;

const base_form_data = {
  organization_id: "organization-1",
  fixture_id: "fixture-1",
  team_id: "team-1",
  selected_players: [{ id: "player-1" }, { id: "player-2" }] as never[],
  submitted_by: "",
  notes: "",
};

function create_dependencies(): {
  lineup_use_cases: {
    create: Mock;
    get_lineup_for_team_in_fixture: Mock;
  };
} {
  return {
    lineup_use_cases: {
      create: vi.fn(),
      get_lineup_for_team_in_fixture: vi.fn().mockResolvedValue({
        success: false,
      }),
    },
  };
}

describe("fixtureLineupCreateDataSubmit validation", () => {
  it("requires a fixture", async () => {
    const result = await submit_fixture_lineup_create_form(
      base_form_data,
      PRESENT_ORGANIZATION,
      { status: "missing" },
      PRESENT_TEAM,
      2,
      18,
      true,
      create_dependencies() as never,
    );
    expect(result).toMatchObject({ success: false, step_index: 1 });
  });

  it("requires a team", async () => {
    const result = await submit_fixture_lineup_create_form(
      { ...base_form_data, team_id: "" },
      PRESENT_ORGANIZATION,
      PRESENT_FIXTURE,
      PRESENT_TEAM,
      2,
      18,
      true,
      create_dependencies() as never,
    );
    expect(result).toEqual({
      success: false,
      error_message: expect.stringContaining("Team is required."),
      step_index: 2,
      failure_display: "field_validation",
    });
  });

  it("requires the lock confirmation", async () => {
    const result = await submit_fixture_lineup_create_form(
      base_form_data,
      PRESENT_ORGANIZATION,
      PRESENT_FIXTURE,
      PRESENT_TEAM,
      2,
      18,
      false,
      create_dependencies() as never,
    );
    expect(result).toEqual({
      success: false,
      error_message: expect.stringContaining("Confirmation required."),
      step_index: 4,
      failure_display: "field_validation",
    });
  });

  it("returns the create error and defaults submitted_by to system", async () => {
    const dependencies = create_dependencies();
    dependencies.lineup_use_cases.create.mockResolvedValue({
      success: false,
      error: "Save exploded",
    });
    const result = await submit_fixture_lineup_create_form(
      base_form_data,
      PRESENT_ORGANIZATION,
      PRESENT_FIXTURE,
      PRESENT_TEAM,
      2,
      18,
      true,
      dependencies as never,
    );
    expect(dependencies.lineup_use_cases.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "locked", submitted_by: "system" }),
    );
    expect(result).toEqual({
      success: false,
      error_message: "Save exploded",
      step_index: 4,
      failure_display: "page_error",
    });
  });

  it("uses the generic failure message when create returns no data", async () => {
    const dependencies = create_dependencies();
    dependencies.lineup_use_cases.create.mockResolvedValue({ success: true });
    const result = await submit_fixture_lineup_create_form(
      base_form_data,
      PRESENT_ORGANIZATION,
      PRESENT_FIXTURE,
      PRESENT_TEAM,
      2,
      18,
      true,
      dependencies as never,
    );
    expect(result).toEqual({
      success: false,
      error_message: expect.stringContaining("Failed to submit lineup."),
      step_index: 4,
      failure_display: "page_error",
    });
  });
});
