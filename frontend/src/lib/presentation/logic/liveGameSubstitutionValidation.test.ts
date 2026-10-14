import { describe, expect, it } from "vitest";

import {
  SUBSTITUTION_LIMIT,
  SUBSTITUTION_MESSAGE,
  validate_substitution,
} from "./liveGameSubstitutionRules";

function player(id: string): never {
  return { id, first_name: id, last_name: "Player" } as never;
}

function availability(overrides: Record<string, unknown> = {}): never {
  return {
    on_field_ids: new Set(["a", "b"]),
    ejected_ids: new Set<string>(),
    suspended_ids: new Set<string>(),
    substituted_off_ids: new Set<string>(),
    substitutions_used: 0,
    ...overrides,
  } as never;
}

const LIMITED_NO_RETURN = {
  limit: { kind: SUBSTITUTION_LIMIT.LIMITED, max_substitutions: 3 },
  return_after_substitution_allowed: false,
} as const;

function check(
  player_on_id: string,
  player_off_id: string,
  availability_overrides: Record<string, unknown> = {},
): ReturnType<typeof validate_substitution> {
  return validate_substitution({
    on_field_players: [player("a"), player("b")],
    player_on_id,
    player_off_id,
    max_players_on_field: 2,
    availability: availability(availability_overrides),
    rules: LIMITED_NO_RETURN,
  });
}

describe("validate_substitution with the sport's rules", () => {
  it("refuses to bring back a player who was sent off", () => {
    expect(check("x", "a", { ejected_ids: new Set(["x"]) })).toEqual({
      success: false,
      error: SUBSTITUTION_MESSAGE.PLAYER_ON_DISMISSED,
    });
  });

  it("refuses once the team has used all its substitutions", () => {
    expect(check("c", "a", { substitutions_used: 3 })).toEqual({
      success: false,
      error: SUBSTITUTION_MESSAGE.LIMIT_REACHED,
    });
  });

  it("refuses a player returning after being substituted off when returns are not allowed", () => {
    expect(check("c", "a", { substituted_off_ids: new Set(["c"]) })).toEqual({
      success: false,
      error: SUBSTITUTION_MESSAGE.NO_RETURN,
    });
  });

  it("lets a suspended player return without using a substitution", () => {
    const result = validate_substitution({
      on_field_players: [player("b")],
      player_on_id: "a",
      player_off_id: "",
      max_players_on_field: 2,
      availability: availability({
        suspended_ids: new Set(["a"]),
        substitutions_used: 3,
      }),
      rules: LIMITED_NO_RETURN,
    });
    expect(result.success).toBe(true);
  });

  it("allows a regular substitution within the limit", () => {
    expect(check("c", "a", { substitutions_used: 2 }).success).toBe(true);
  });
});
