import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  get_competition_team_collections_after_add_mock,
  get_competition_team_collections_after_remove_mock,
} = vi.hoisted(() => ({
  get_competition_team_collections_after_add_mock: vi.fn(),
  get_competition_team_collections_after_remove_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/competitionEditPageState", () => ({
  get_competition_team_collections_after_add:
    get_competition_team_collections_after_add_mock,
  get_competition_team_collections_after_remove:
    get_competition_team_collections_after_remove_mock,
}));

import {
  add_team_to_competition_workspace,
  remove_team_from_competition_workspace,
  submit_competition_edit_workspace,
} from "./competitionEditWorkspaceActions";

describe("competitionEditWorkspaceActions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-01T10:00:00.000Z"));
    get_competition_team_collections_after_add_mock.mockReset();
    get_competition_team_collections_after_remove_mock.mockReset();
  });

  it("submits updates and surfaces the use-case failure message when saving fails", async () => {
    await expect(
      submit_competition_edit_workspace({
        competition_id: "competition-1",
        form_data: { name: "League" } as never,
        competition_use_cases: {
          update: vi
            .fn()
            .mockResolvedValueOnce({ success: false, error: "update failed" }),
        },
      }),
    ).resolves.toEqual({ success: false, error: "update failed" });

    await expect(
      submit_competition_edit_workspace({
        competition_id: "competition-1",
        form_data: { name: "League" } as never,
        competition_use_cases: {
          update: vi.fn().mockResolvedValueOnce({ success: true }),
        },
      }),
    ).resolves.toEqual({ success: true, data: true });
  });

  it("adds a team to the competition and returns the rebuilt workspace collections", async () => {
    const collections = {
      available_teams: [{ id: "team-2" }],
      competition_team_entries: [],
      teams_in_competition: [],
    };
    const next_collections = {
      available_teams: [],
      competition_team_entries: [{ id: "entry-1", team_id: "team-2" }],
      teams_in_competition: [{ id: "team-2", name: "Falcons" }],
    };
    get_competition_team_collections_after_add_mock.mockReturnValueOnce(
      next_collections,
    );
    const add_team_to_competition = vi.fn().mockResolvedValueOnce({
      success: true,
      data: { id: "entry-1", team_id: "team-2" },
    });

    await expect(
      add_team_to_competition_workspace({
        competition_id: "competition-1",
        team: { id: "team-2", name: "Falcons" } as never,
        collections: collections as never,
        competition_team_use_cases: { add_team_to_competition },
      }),
    ).resolves.toEqual({ success: true, data: next_collections });

    expect(add_team_to_competition).toHaveBeenCalledWith({
      competition_id: "competition-1",
      team_id: "team-2",
      registration_date: "2024-06-01",
      seed_number: null,
      group_name: null,
      notes: "",
      status: "registered",
    });
  });

  it("returns failures from add and remove team operations and removes teams on success", async () => {
    await expect(
      add_team_to_competition_workspace({
        competition_id: "competition-1",
        team: { id: "team-2" } as never,
        collections: {
          available_teams: [],
          competition_team_entries: [],
          teams_in_competition: [],
        } as never,
        competition_team_use_cases: {
          add_team_to_competition: vi
            .fn()
            .mockResolvedValueOnce({ success: false, error: "cannot add" }),
        },
      }),
    ).resolves.toEqual({ success: false, error: "cannot add" });

    const next_collections = {
      available_teams: [{ id: "team-3" }],
      competition_team_entries: [],
      teams_in_competition: [],
    };
    get_competition_team_collections_after_remove_mock.mockReturnValueOnce(
      next_collections,
    );
    await expect(
      remove_team_from_competition_workspace({
        competition_id: "competition-1",
        team: { id: "team-2" } as never,
        collections: {
          available_teams: [],
          competition_team_entries: [{ id: "entry-1", team_id: "team-2" }],
          teams_in_competition: [{ id: "team-2" }],
        } as never,
        competition_team_use_cases: {
          remove_team_from_competition: vi
            .fn()
            .mockResolvedValueOnce({ success: true }),
        },
      }),
    ).resolves.toEqual({ success: true, data: next_collections });
  });
});
