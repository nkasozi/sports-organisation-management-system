import { describe, expect, it } from "vitest";

import { EDIT_ALLOWANCE } from "$lib/core/entities/FixtureEventCorrections";

import { LIVE_GAME_ACTOR } from "./liveGameControl";
import { build_live_game_correction_author } from "./liveGameCorrectionAuthor";

describe("who is correcting events, and how many edits they get", () => {
  it("limits the table official to the competition's edits per game", () => {
    expect(
      build_live_game_correction_author({
        live_game_actor: LIVE_GAME_ACTOR.TABLE_OFFICIAL,
        correction_author_name: "Grace Akello",
        correction_author_role: "Official",
        competition: { max_event_edits_per_game: 2 } as never,
      }),
    ).toEqual({
      name: "Grace Akello",
      role_label: "Table Official",
      allowance: { status: EDIT_ALLOWANCE.LIMITED, max_edits: 2 },
    });
  });

  it("uses the default of 3 for competitions saved before the setting existed", () => {
    expect(
      build_live_game_correction_author({
        live_game_actor: LIVE_GAME_ACTOR.TABLE_OFFICIAL,
        correction_author_name: "Grace Akello",
        correction_author_role: "Official",
        competition: {} as never,
      }).allowance,
    ).toEqual({ status: EDIT_ALLOWANCE.LIMITED, max_edits: 3 });
  });

  it("doesn't limit officials managers and admins", () => {
    expect(
      build_live_game_correction_author({
        live_game_actor: LIVE_GAME_ACTOR.MANAGER,
        correction_author_name: "Moses Okello",
        correction_author_role: "Officials Manager",
        competition: { max_event_edits_per_game: 0 } as never,
      }),
    ).toEqual({
      name: "Moses Okello",
      role_label: "Officials Manager",
      allowance: { status: EDIT_ALLOWANCE.UNLIMITED },
    });
  });
});
