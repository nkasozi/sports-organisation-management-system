import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  build_calendar_shell_load_command_mock,
  create_calendar_category_action_mock,
  delete_calendar_activity_action_mock,
  load_calendar_organization_bundle_mock,
  save_calendar_activity_action_mock,
  sync_and_load_calendar_events_mock,
} = vi.hoisted(() => ({
  build_calendar_shell_load_command_mock: vi.fn(),
  create_calendar_category_action_mock: vi.fn(),
  delete_calendar_activity_action_mock: vi.fn(),
  load_calendar_organization_bundle_mock: vi.fn(),
  save_calendar_activity_action_mock: vi.fn(),
  sync_and_load_calendar_events_mock: vi.fn(),
}));

vi.mock("./calendarPageActions", () => ({
  create_calendar_category_action: create_calendar_category_action_mock,
  delete_calendar_activity_action: delete_calendar_activity_action_mock,
  save_calendar_activity_action: save_calendar_activity_action_mock,
}));

vi.mock("./calendarPageData", () => ({
  load_calendar_organization_bundle: load_calendar_organization_bundle_mock,
  sync_and_load_calendar_events: sync_and_load_calendar_events_mock,
}));

vi.mock("./calendarPageShellControllerTypes", () => ({
  build_calendar_shell_load_command: build_calendar_shell_load_command_mock,
}));

import {
  create_calendar_shell_category,
  delete_calendar_shell_activity,
  load_calendar_shell_bundle,
  load_calendar_shell_events,
  save_calendar_shell_activity,
} from "./calendarPageShellControllerData";

describe("calendarPageShellControllerData", () => {
  function create_command() {
    return {
      filter_category_id: "",
      filter_competition_id: "",
      filter_team_id: "",
      selected_organization_id: "organization-1",
      use_cases: {
        activity_category_use_cases: { marker: "categories" },
        activity_use_cases: { marker: "activities" },
      },
    };
  }

  beforeEach(() => {
    build_calendar_shell_load_command_mock.mockReset();
    create_calendar_category_action_mock.mockReset();
    delete_calendar_activity_action_mock.mockReset();
    load_calendar_organization_bundle_mock.mockReset();
    save_calendar_activity_action_mock.mockReset();
    sync_and_load_calendar_events_mock.mockReset();
  });

  it("delegates bundle and event loading to the underlying calendar data helpers", async () => {
    load_calendar_organization_bundle_mock.mockResolvedValueOnce({
      categories: [],
      teams: [],
      competitions: [],
      calendar_events: [],
    });
    sync_and_load_calendar_events_mock.mockResolvedValueOnce([
      { id: "event-1" },
    ]);

    await expect(
      load_calendar_shell_bundle({
        organization_id: "organization-1",
      } as never),
    ).resolves.toEqual({
      categories: [],
      teams: [],
      competitions: [],
      calendar_events: [],
    });
    await expect(
      load_calendar_shell_events({
        organization_id: "organization-1",
        filter_category_id: "category-1",
        filter_competition_id: "competition-1",
        filter_team_id: "team-1",
        use_cases: { activity_use_cases: { marker: true } },
      } as never),
    ).resolves.toEqual([{ id: "event-1" }]);
  });

  it("returns activity save failures and reloads events after a successful save", async () => {
    const load_command = {
      organization_id: "organization-1",
      filter_category_id: "",
      filter_competition_id: "",
      filter_team_id: "",
      use_cases: { activity_use_cases: { marker: "activities" } },
    };
    save_calendar_activity_action_mock
      .mockResolvedValueOnce({
        success: false,
        error_message: "save failed",
        error_type: "error",
      })
      .mockResolvedValueOnce({ success: true });
    build_calendar_shell_load_command_mock.mockReturnValue(load_command);
    sync_and_load_calendar_events_mock.mockResolvedValueOnce([
      { id: "event-1" },
    ]);

    await expect(
      save_calendar_shell_activity(create_command() as never),
    ).resolves.toEqual({
      success: false,
      error_message: "save failed",
      error_type: "error",
    });
    await expect(
      save_calendar_shell_activity(create_command() as never),
    ).resolves.toEqual({
      success: true,
      calendar_events: [{ id: "event-1" }],
    });
  });

  it("returns activity delete failures and reloads events after a successful delete", async () => {
    const load_command = {
      organization_id: "organization-1",
      filter_category_id: "",
      filter_competition_id: "",
      filter_team_id: "",
      use_cases: { activity_use_cases: { marker: "activities" } },
    };
    delete_calendar_activity_action_mock
      .mockResolvedValueOnce({
        success: false,
        error_message: "delete failed",
        error_type: "error",
      })
      .mockResolvedValueOnce({ success: true });
    build_calendar_shell_load_command_mock.mockReturnValue(load_command);
    sync_and_load_calendar_events_mock.mockResolvedValueOnce([
      { id: "event-2" },
    ]);

    await expect(
      delete_calendar_shell_activity(create_command() as never),
    ).resolves.toEqual({
      success: false,
      error_message: "delete failed",
      error_type: "error",
    });
    await expect(
      delete_calendar_shell_activity(create_command() as never),
    ).resolves.toEqual({
      success: true,
      calendar_events: [{ id: "event-2" }],
    });
  });

  it("creates categories and reloads the bundle categories after success", async () => {
    create_calendar_category_action_mock
      .mockResolvedValueOnce({
        success: false,
        error_message: "category failed",
        error_type: "warning",
      })
      .mockResolvedValueOnce({ success: true });
    build_calendar_shell_load_command_mock.mockReturnValue({
      organization_id: "organization-1",
    });
    load_calendar_organization_bundle_mock.mockResolvedValueOnce({
      categories: [{ id: "category-1", name: "Training" }],
      teams: [],
      competitions: [],
      calendar_events: [],
    });

    await expect(
      create_calendar_shell_category(create_command() as never),
    ).resolves.toEqual({
      success: false,
      error_message: "category failed",
      error_type: "warning",
    });
    await expect(
      create_calendar_shell_category(create_command() as never),
    ).resolves.toEqual({
      success: true,
      categories: [{ id: "category-1", name: "Training" }],
    });
  });
});
