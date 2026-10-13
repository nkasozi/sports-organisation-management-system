import { apply_entity_input_defaults } from "./EntityInputDefaults";
import type { CreateVenueInput } from "./Venue";

const VENUE_INPUT_DEFAULTS: Partial<CreateVenueInput> = {
  capacity: 0,
};

export function apply_venue_input_defaults(
  input: CreateVenueInput,
): CreateVenueInput {
  return apply_entity_input_defaults(VENUE_INPUT_DEFAULTS, input);
}
