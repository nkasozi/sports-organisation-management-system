import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_missing_managed_game_fixture_state,
  create_missing_managed_game_selected_event_type_state,
  create_present_managed_game_fixture_state,
  create_present_managed_game_selected_event_type_state,
} from "$lib/presentation/logic/managedGamePageTypes";

import {
  change_managed_game_period,
  end_managed_game,
  end_managed_game_period,
  record_managed_game_event,
  start_managed_game,
} from "./managedGamePageActions";

const {
  change_game_period_mock,
  end_game_period_mock,
  end_game_session_mock,
  record_game_manage_event_mock,
  start_game_session_mock,
} = vi.hoisted(() => ({
  change_game_period_mock: vi.fn(),
  end_game_period_mock: vi.fn(),
  end_game_session_mock: vi.fn(),
  record_game_manage_event_mock: vi.fn(),
  start_game_session_mock: vi.fn(),
}));

vi.mock("./gameManageActions", () => ({
  change_game_period: change_game_period_mock,
  end_game_period: end_game_period_mock,
  end_game_session: end_game_session_mock,
  record_game_manage_event: record_game_manage_event_mock,
  start_game_session: start_game_session_mock,
}));

describe("managedGamePageActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails fast when the fixture or event selection is missing", async () => {
    expect(
      await start_managed_game({
        fixture: create_missing_managed_game_fixture_state(),
        fixture_use_cases: {} as never,
      }),
    ).toEqual({ success: false, error: "No fixture loaded" });
    expect(
      await record_managed_game_event({
        fixture: create_missing_managed_game_fixture_state(),
        selected_event_type:
          create_missing_managed_game_selected_event_type_state(),
        event_minute: 0,
        selected_team_side: "home",
        event_player_name: "",
        event_description: "",
        fixture_use_cases: {} as never,
      }),
    ).toEqual({ success: false, error: "No fixture event selected" });
    expect(
      await change_managed_game_period({
        fixture: create_missing_managed_game_fixture_state(),
        new_period: "second_half",
        minute: 45,
        fixture_use_cases: {} as never,
      }),
    ).toEqual({ success: false, error: "No fixture loaded" });
  });

  it("delegates start and end session operations to the shared game actions", async () => {
    start_game_session_mock.mockResolvedValue({
      success: true,
      data: { id: "fixture-1" },
    });
    end_game_session_mock.mockResolvedValue({
      success: true,
      data: { id: "fixture-1" },
    });

    await start_managed_game({
      fixture: create_present_managed_game_fixture_state({
        id: "fixture-1",
      } as never),
      fixture_use_cases: { start_fixture: vi.fn() } as never,
    });
    await end_managed_game({
      fixture: create_present_managed_game_fixture_state({
        id: "fixture-1",
      } as never),
      fixture_use_cases: { end_fixture: vi.fn() } as never,
    });

    expect(start_game_session_mock).toHaveBeenCalledWith("fixture-1", {
      start_fixture: expect.any(Function),
    });
    expect(end_game_session_mock).toHaveBeenCalledWith("fixture-1", {
      end_fixture: expect.any(Function),
    });
  });

  it("delegates event recording and period transitions with the supplied fixture data", async () => {
    record_game_manage_event_mock.mockResolvedValue({
      success: true,
      data: { id: "fixture-1" },
    });
    change_game_period_mock.mockResolvedValue({
      success: true,
      data: { id: "fixture-1" },
    });
    end_game_period_mock.mockResolvedValue({
      success: true,
      data: {
        fixture: { id: "fixture-1" },
        completed_period_label: "First Half",
      },
    });

    await record_managed_game_event({
      fixture: create_present_managed_game_fixture_state({
        id: "fixture-1",
      } as never),
      selected_event_type:
        create_present_managed_game_selected_event_type_state({
          id: "goal",
          label: "Goal",
        } as never),
      event_minute: 12,
      selected_team_side: "away",
      event_player_name: "Ada Stone",
      event_description: "Volley",
      fixture_use_cases: { record_game_event: vi.fn() } as never,
    });
    await change_managed_game_period({
      fixture: create_present_managed_game_fixture_state({
        id: "fixture-1",
      } as never),
      new_period: "second_half",
      minute: 45,
      fixture_use_cases: {
        record_game_event: vi.fn(),
        update_period: vi.fn(),
      } as never,
    });
    await end_managed_game_period({
      fixture: create_present_managed_game_fixture_state({
        id: "fixture-1",
      } as never),
      minute: 90,
      fixture_use_cases: {
        record_game_event: vi.fn(),
        update_period: vi.fn(),
      } as never,
    });

    expect(record_game_manage_event_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        fixture_id: "fixture-1",
        selected_team_side: "away",
      }),
      { record_game_event: expect.any(Function) },
    );
    expect(change_game_period_mock).toHaveBeenCalledWith(
      { id: "fixture-1" },
      "second_half",
      45,
      {
        record_game_event: expect.any(Function),
        update_period: expect.any(Function),
      },
    );
    expect(end_game_period_mock).toHaveBeenCalledWith({ id: "fixture-1" }, 90, {
      record_game_event: expect.any(Function),
      update_period: expect.any(Function),
    });
  });
});
