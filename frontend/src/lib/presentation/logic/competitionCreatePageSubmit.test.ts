import { beforeEach, describe, expect, it, vi } from "vitest";

import { submit_competition_create_form } from "./competitionCreatePageSubmit";

describe("competitionCreatePageSubmit", () => {
  function create_dependencies() {
    return {
      competition_use_cases: { create: vi.fn() },
      competition_team_use_cases: { create: vi.fn() },
    };
  }

  const base_form_data = {
    name: "Premier Cup",
    organization_id: "organization-1",
    competition_format_id: "format-1",
    team_ids: ["team-1", "team-2"],
  };

  beforeEach(() => {
    vi.useRealTimers();
  });

  it("returns the create error when the competition record cannot be created", async () => {
    const dependencies = create_dependencies();
    dependencies.competition_use_cases.create.mockResolvedValue({
      success: false,
      error: "Duplicate name",
    });

    await expect(
      submit_competition_create_form({
        dependencies: dependencies as never,
        form_data: base_form_data as never,
      }),
    ).resolves.toEqual({ success: false, error_message: "Duplicate name" });
  });

  it("returns a partial-registration error when team enrollment fails after the competition is created", async () => {
    const dependencies = create_dependencies();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-01T10:00:00.000Z"));
    dependencies.competition_use_cases.create.mockResolvedValue({
      success: true,
      data: { id: "competition-1" },
    });
    dependencies.competition_team_use_cases.create
      .mockResolvedValueOnce({
        success: true,
        data: { id: "competition-team-1" },
      })
      .mockResolvedValueOnce({ success: false, error: "team create failed" });

    await expect(
      submit_competition_create_form({
        dependencies: dependencies as never,
        form_data: base_form_data as never,
      }),
    ).resolves.toEqual({
      success: false,
      error_message:
        "Competition created but failed to register some teams. Please add teams manually.",
    });
  });

  it("creates the competition and registers each selected team on success", async () => {
    const dependencies = create_dependencies();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-01T10:00:00.000Z"));
    dependencies.competition_use_cases.create.mockResolvedValue({
      success: true,
      data: { id: "competition-1" },
    });
    dependencies.competition_team_use_cases.create.mockResolvedValue({
      success: true,
      data: { id: "competition-team-1" },
    });

    await expect(
      submit_competition_create_form({
        dependencies: dependencies as never,
        form_data: base_form_data as never,
      }),
    ).resolves.toEqual({ success: true, error_message: "" });

    expect(
      dependencies.competition_team_use_cases.create,
    ).toHaveBeenCalledTimes(2);
    expect(
      dependencies.competition_team_use_cases.create,
    ).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        competition_id: "competition-1",
        team_id: "team-1",
        registration_date: "2024-06-01",
      }),
    );
  });
});
