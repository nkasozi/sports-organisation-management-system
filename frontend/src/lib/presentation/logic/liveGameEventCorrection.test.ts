import { describe, expect, it, vi } from "vitest";

import {
  correct_live_game_detail_event,
  LIVE_EVENT_CORRECTION_KIND,
  undo_substitution_in_lineup,
} from "./liveGameEventCorrection";

const SUB_EVENT = {
  id: "s1",
  event_type: "substitution",
  team_side: "home",
  player_id: "p_on",
  secondary_player_id: "p_off",
} as never;

const GOAL_EVENT = { id: "g1", event_type: "goal", team_side: "home" } as never;

type TestHarness = {
  command: never;
  toasts: { message: string; type: string }[];
  record_live_player_times: ReturnType<typeof vi.fn>;
  read: () => { fixture: unknown; home_players: unknown[] };
};

function create_command(result: unknown): TestHarness {
  let page_state = {
    fixture: { id: "f1" },
    home_players: [
      { id: "p_on", is_substitute: true, time_on: "20" },
      { id: "p_off", is_substitute: false, time_off: "20" },
    ],
    away_players: [],
    home_lineup_id: "home_lineup",
    away_lineup_id: "away_lineup",
  };
  const toasts: { message: string; type: string }[] = [];
  const record_live_player_times = vi.fn().mockResolvedValue({ success: true });
  const command = {
    action_dependencies: {
      fixture_use_cases: {
        update_game_event: vi.fn().mockResolvedValue(result),
        remove_game_event: vi.fn().mockResolvedValue(result),
      },
      fixture_lineup_use_cases: { record_live_player_times },
    },
    get_page_state: () => page_state,
    set_page_state: (state: typeof page_state) => (page_state = state),
    set_toast_state: (toast: { message: string; type: string }) =>
      toasts.push(toast),
  } as never;
  return { command, toasts, record_live_player_times, read: () => page_state };
}

describe("correcting events on the live game screen", () => {
  it("saves an edit and shows the updated game", async () => {
    const updated = { id: "f1", game_events: [] };
    const { command, toasts, read } = create_command({
      success: true,
      data: updated,
    });
    const ok = await correct_live_game_detail_event(command, {
      kind: LIVE_EVENT_CORRECTION_KIND.EDIT,
      event: GOAL_EVENT,
      correction: { minute: 12 } as never,
      reason: "Wrong minute",
    });
    expect(ok).toBe(true);
    expect(read().fixture).toBe(updated);
    expect(toasts.pop()?.message).toBe("Event updated");
  });

  it("removes a substitution and puts the players back as they were", async () => {
    const { command, record_live_player_times, read } = create_command({
      success: true,
      data: { id: "f1" },
    });
    await correct_live_game_detail_event(command, {
      kind: LIVE_EVENT_CORRECTION_KIND.REMOVE,
      event: SUB_EVENT,
      reason: "Recorded by mistake",
    });
    expect(record_live_player_times).toHaveBeenCalledWith(
      expect.objectContaining({ lineup_id: "home_lineup" }),
    );
    expect(read().home_players).toEqual([
      { id: "p_on", is_substitute: true, time_on: "didnt_play" },
      { id: "p_off", is_substitute: false, time_off: "" },
    ]);
  });

  it("leaves the lineup alone when a goal is removed", async () => {
    const { command, record_live_player_times } = create_command({
      success: true,
      data: { id: "f1" },
    });
    await correct_live_game_detail_event(command, {
      kind: LIVE_EVENT_CORRECTION_KIND.REMOVE,
      event: GOAL_EVENT,
      reason: "Recorded by mistake",
    });
    expect(record_live_player_times).not.toHaveBeenCalled();
  });

  it("shows the reason when the change is refused", async () => {
    const { command, toasts } = create_command({
      success: false,
      error: "This event is no longer in the game.",
    });
    expect(
      await correct_live_game_detail_event(command, {
        kind: LIVE_EVENT_CORRECTION_KIND.REMOVE,
        event: GOAL_EVENT,
        reason: "Recorded by mistake",
      }),
    ).toBe(false);
    expect(toasts.pop()).toEqual({
      is_visible: true,
      message: "This event is no longer in the game.",
      type: "error",
    });
  });

  it("only touches the two players in the substitution", () => {
    const players = [{ id: "other", time_on: "present_at_start" }] as never;
    expect(undo_substitution_in_lineup(players, SUB_EVENT)).toEqual(players);
  });
});
