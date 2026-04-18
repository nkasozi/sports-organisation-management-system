import { beforeEach, describe, expect, it, vi } from "vitest";

import { submit_fixture_lineup_create_form } from "./fixtureLineupCreateDataSubmit";

describe("fixtureLineupCreateDataSubmit", () => {
  function create_dependencies() {
    return {
      lineup_use_cases: {
        create: vi.fn(),
        get_lineup_for_team_in_fixture: vi.fn(),
      },
    };
  }

  function create_selected_player(id: string) {
    return {
      id,
      first_name: id,
      last_name: "Player",
      jersey_number: 1,
      position: "Midfielder",
      is_captain: false,
      is_substitute: false,
    };
  }

  const base_form_data = {
    organization_id: "organization-1",
    fixture_id: "fixture-1",
    team_id: "team-1",
    selected_players: [
      create_selected_player("player-1"),
      create_selected_player("player-2"),
    ],
    submitted_by: " manager ",
    notes: "",
  };

  beforeEach(() => {
    vi.useRealTimers();
  });

  it("requires an organization before submit can proceed", async () => {
    const dependencies = create_dependencies();

    await expect(
      submit_fixture_lineup_create_form(
        { ...base_form_data, organization_id: "" },
        { status: "missing" },
        { status: "present", fixture: { id: "fixture-1" } as never },
        { status: "present", team: { id: "team-1" } as never },
        2,
        18,
        true,
        dependencies as never,
      ),
    ).resolves.toEqual({
      success: false,
      error_message: expect.stringContaining("Organization is required."),
      step_index: 0,
    });
  });

  it("blocks submit when the squad size is outside the fixture limits", async () => {
    const dependencies = create_dependencies();

    await expect(
      submit_fixture_lineup_create_form(
        {
          ...base_form_data,
          selected_players: [create_selected_player("player-1")],
        },
        {
          status: "present",
          organization: { id: "organization-1" } as never,
        },
        { status: "present", fixture: { id: "fixture-1" } as never },
        { status: "present", team: { id: "team-1" } as never },
        2,
        18,
        true,
        dependencies as never,
      ),
    ).resolves.toEqual({
      success: false,
      error_message: expect.stringContaining("Invalid squad size."),
      step_index: 3,
    });
  });

  it("rejects duplicate lineups before attempting to create a new record", async () => {
    const dependencies = create_dependencies();
    dependencies.lineup_use_cases.get_lineup_for_team_in_fixture.mockResolvedValue(
      { success: true },
    );

    await expect(
      submit_fixture_lineup_create_form(
        base_form_data,
        {
          status: "present",
          organization: { id: "organization-1" } as never,
        },
        { status: "present", fixture: { id: "fixture-1" } as never },
        { status: "present", team: { id: "team-1" } as never },
        2,
        18,
        true,
        dependencies as never,
      ),
    ).resolves.toEqual({
      success: false,
      error_message: expect.stringContaining(
        "A lineup already exists for this team in this fixture.",
      ),
      step_index: 4,
    });
    expect(dependencies.lineup_use_cases.create).not.toHaveBeenCalled();
  });

  it("creates a locked lineup with normalized submit metadata", async () => {
    const dependencies = create_dependencies();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-01T15:00:00.000Z"));
    dependencies.lineup_use_cases.get_lineup_for_team_in_fixture.mockResolvedValue(
      { success: false },
    );
    dependencies.lineup_use_cases.create.mockResolvedValue({
      success: true,
      data: { id: "lineup-1" },
    });

    await expect(
      submit_fixture_lineup_create_form(
        base_form_data,
        {
          status: "present",
          organization: { id: "organization-1" } as never,
        },
        { status: "present", fixture: { id: "fixture-1" } as never },
        { status: "present", team: { id: "team-1" } as never },
        2,
        18,
        true,
        dependencies as never,
      ),
    ).resolves.toEqual({ success: true, lineup_id: "lineup-1" });

    expect(dependencies.lineup_use_cases.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "locked",
        submitted_at: "2024-06-01T15:00:00.000Z",
        submitted_by: "manager",
      }),
    );
  });
});
