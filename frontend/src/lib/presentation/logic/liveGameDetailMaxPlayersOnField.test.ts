import { describe, expect, it } from "vitest";

import { resolve_live_game_max_players_on_field } from "./liveGameDetailMaxPlayersOnField";

describe("resolve_live_game_max_players_on_field", () => {
  it("prefers the competition override", () => {
    expect(
      resolve_live_game_max_players_on_field({
        sport: { max_players_on_field: 11, max_players_per_fixture: 18 },
        competition: { rule_overrides: { max_players_on_field: 7 } },
      } as never),
    ).toBe(7);
  });

  it("uses the sport when no override exists", () => {
    expect(
      resolve_live_game_max_players_on_field({
        sport: { max_players_on_field: 15, max_players_per_fixture: 23 },
      } as never),
    ).toBe(15);
  });

  it("uses the default when no sport is loaded", () => {
    expect(resolve_live_game_max_players_on_field({} as never)).toBe(11);
  });
});
