import type { UpdateCompetitionInput } from "$lib/core/entities/Competition";
import { is_object_value } from "$lib/presentation/logic/runtimeTypeGuards";

export function has_competition_rule_overrides(
  form_data: UpdateCompetitionInput,
): boolean {
  return is_object_value(form_data.rule_overrides);
}

export function with_default_competition_rule_overrides(
  form_data: UpdateCompetitionInput,
): UpdateCompetitionInput {
  if (has_competition_rule_overrides(form_data)) return form_data;
  return { ...form_data, rule_overrides: {} };
}
