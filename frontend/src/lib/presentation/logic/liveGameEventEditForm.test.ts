import { describe, expect, it } from "vitest";

import {
  build_event_correction,
  can_change_event_player,
  create_event_edit_form,
} from "./liveGameEventEditForm";

const PLAYERS = [
  { id: "p1", first_name: "Moses", last_name: "Alowo" },
  { id: "p2", first_name: "Kenneth", last_name: "Amuge" },
] as never;

const GOAL = {
  id: "g1",
  event_type: "goal",
  minute: 10,
  player_id: "p1",
  player_name: "Moses Alowo",
  description: "",
} as never;

describe("editing a recorded event", () => {
  it("starts from the event as recorded", () => {
    expect(create_event_edit_form(GOAL)).toEqual({
      player_id: "p1",
      minute: 10,
      description: "",
    });
  });

  it("switches the scorer, minute and note", () => {
    expect(
      build_event_correction(
        GOAL,
        { player_id: "p2", minute: 12.4, description: " Deflected " },
        PLAYERS,
      ),
    ).toEqual({
      player_id: "p2",
      player_name: "Kenneth Amuge",
      minute: 12,
      description: "Deflected",
    });
  });

  it("never sends a negative minute", () => {
    expect(
      build_event_correction(
        GOAL,
        { player_id: "p1", minute: -3, description: "" },
        PLAYERS,
      ).minute,
    ).toBe(0);
  });

  it("keeps the players of a substitution fixed", () => {
    const sub = { ...(GOAL as object), event_type: "substitution" } as never;
    expect(can_change_event_player(sub)).toBe(false);
    expect(
      build_event_correction(
        sub,
        { player_id: "p2", minute: 30, description: "" },
        PLAYERS,
      ),
    ).toEqual({ minute: 30, description: "" });
  });
});
