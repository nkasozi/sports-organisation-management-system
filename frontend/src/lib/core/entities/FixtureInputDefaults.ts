import { apply_entity_input_defaults } from "./EntityInputDefaults";
import type { CreateFixtureInput } from "./FixtureTypes";

export const FIXTURE_INPUT_DEFAULTS: Partial<CreateFixtureInput> = {
  round_number: 1,
};

export function apply_fixture_input_defaults(
  input: CreateFixtureInput,
): CreateFixtureInput {
  return apply_entity_input_defaults(FIXTURE_INPUT_DEFAULTS, input);
}
