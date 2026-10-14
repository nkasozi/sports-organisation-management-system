import { describe, expect, it } from "vitest";

import {
  resolve_substitution_rules,
  SUBSTITUTION_LIMIT,
} from "./liveGameSubstitutionRules";

describe("resolve_substitution_rules", () => {
  it("uses the sport's substitution rules", () => {
    expect(
      resolve_substitution_rules(
        {
          substitution_rules: {
            max_substitutions_per_game: 5,
            return_after_substitution_allowed: false,
          },
        } as never,
        void 0,
      ),
    ).toEqual({
      limit: { kind: SUBSTITUTION_LIMIT.LIMITED, max_substitutions: 5 },
      return_after_substitution_allowed: false,
    });
  });

  it("lets the competition override the sport", () => {
    expect(
      resolve_substitution_rules(
        {
          substitution_rules: {
            max_substitutions_per_game: 5,
            return_after_substitution_allowed: false,
          },
        } as never,
        {
          rule_overrides: {
            substitution_rules: { max_substitutions_per_game: -1 },
          },
        } as never,
      ),
    ).toEqual({
      limit: { kind: SUBSTITUTION_LIMIT.UNLIMITED },
      return_after_substitution_allowed: false,
    });
  });

  it("allows unlimited rolling substitutions when no rules are known", () => {
    expect(resolve_substitution_rules(void 0, void 0)).toEqual({
      limit: { kind: SUBSTITUTION_LIMIT.UNLIMITED },
      return_after_substitution_allowed: true,
    });
  });
});
