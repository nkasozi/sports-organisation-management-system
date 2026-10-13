import { describe, expect, it } from "vitest";

import type { UpdateCompetitionInput } from "$lib/core/entities/Competition";

import {
  has_competition_rule_overrides,
  with_default_competition_rule_overrides,
} from "./competitionEditRuleOverrides";

const existing_rule_overrides = { max_squad_size: 20 };

describe("has_competition_rule_overrides", () => {
  it("is true when the form already carries rule overrides", () => {
    expect(
      has_competition_rule_overrides({
        rule_overrides: existing_rule_overrides,
      }),
    ).toBe(true);
  });

  it("is true for an empty rule overrides object", () => {
    expect(has_competition_rule_overrides({ rule_overrides: {} })).toBe(true);
  });

  it("is false when the form has no rule overrides", () => {
    expect(has_competition_rule_overrides({ name: "League" })).toBe(false);
  });
});

describe("with_default_competition_rule_overrides", () => {
  it("returns the same form when rule overrides already exist so edits are never replaced", () => {
    const form_data: UpdateCompetitionInput = {
      name: "League",
      rule_overrides: existing_rule_overrides,
    };

    const result = with_default_competition_rule_overrides(form_data);

    expect(result).toBe(form_data);
    expect(result.rule_overrides).toBe(existing_rule_overrides);
  });

  it("adds an empty rule overrides object without mutating the input", () => {
    const form_data: UpdateCompetitionInput = { name: "League" };

    const result = with_default_competition_rule_overrides(form_data);

    expect(result).toEqual({ name: "League", rule_overrides: {} });
    expect(form_data).toEqual({ name: "League" });
  });

  it("keeps a later rule override edit after defaulting once", () => {
    const defaulted_form = with_default_competition_rule_overrides({
      name: "League",
    });
    const edited_form: UpdateCompetitionInput = {
      ...defaulted_form,
      rule_overrides: { max_players_on_field: 7 },
    };

    expect(with_default_competition_rule_overrides(edited_form)).toBe(
      edited_form,
    );
  });
});
