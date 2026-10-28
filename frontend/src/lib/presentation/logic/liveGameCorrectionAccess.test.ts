import { describe, expect, it } from "vitest";

import { LIVE_GAME_ACTOR } from "./liveGameControl";
import { derive_live_game_correction_access } from "./liveGameCorrectionAccess";

function page(
  actor: string,
  overrides: { status?: string; used?: number; max?: number } = {},
): never {
  return {
    can_modify_game: true,
    live_game_actor: actor,
    correction_author_name: "Someone",
    correction_author_role: "Officials Manager",
    competition: { max_event_edits_per_game: overrides.max ?? 3 },
    fixture: {
      status: overrides.status ?? "in_progress",
      event_edits_used: overrides.used ?? 0,
    },
  } as never;
}

describe("event correction access on the live game screen", () => {
  it("tells the table official how many edits they have left", () => {
    expect(
      derive_live_game_correction_access(
        page(LIVE_GAME_ACTOR.TABLE_OFFICIAL, { used: 1 }),
        true,
      ),
    ).toMatchObject({
      can_correct: true,
      can_reset: false,
      status_text: "2 of 3 event edits left for this game",
      edit_cost_text: "This uses 1 of your 2 remaining edits.",
    });
  });

  it("explains what to do when the official has used every edit", () => {
    const access = derive_live_game_correction_access(
      page(LIVE_GAME_ACTOR.TABLE_OFFICIAL, { used: 3 }),
      true,
    );
    expect(access.can_correct).toBe(false);
    expect(access.status_text).toBe(
      "You've used all 3 event edits for this game.",
    );
    expect(access.help_text).toContain("officials manager to reset");
  });

  it("explains when the competition doesn't allow officials to edit", () => {
    const access = derive_live_game_correction_access(
      page(LIVE_GAME_ACTOR.TABLE_OFFICIAL, { max: 0 }),
      true,
    );
    expect(access.can_correct).toBe(false);
    expect(access.status_text).toBe(
      "Editing events is turned off for this competition.",
    );
  });

  it("closes corrections to officials once the game has ended", () => {
    expect(
      derive_live_game_correction_access(
        page(LIVE_GAME_ACTOR.TABLE_OFFICIAL, { status: "completed" }),
        false,
      ).can_correct,
    ).toBe(false);
  });

  it("lets managers correct during and after the game and reset used edits", () => {
    const access = derive_live_game_correction_access(
      page(LIVE_GAME_ACTOR.MANAGER, { status: "completed", used: 3 }),
      false,
    );
    expect(access).toMatchObject({
      can_correct: true,
      can_reset: true,
      status_text:
        "The table official has used 3 of 3 event edits in this game.",
    });
  });

  it("gives watchers nothing to change", () => {
    expect(
      derive_live_game_correction_access(page(LIVE_GAME_ACTOR.WATCHER), true),
    ).toMatchObject({ can_correct: false, can_reset: false, status_text: "" });
  });
});
