import { apply_entity_input_defaults } from "./EntityInputDefaults";
import type { CreateOfficialInput } from "./Official";

const OFFICIAL_INPUT_DEFAULTS: Partial<CreateOfficialInput> = {
  years_of_experience: 0,
};

export function apply_official_input_defaults(
  input: CreateOfficialInput,
): CreateOfficialInput {
  return apply_entity_input_defaults(OFFICIAL_INPUT_DEFAULTS, input);
}
