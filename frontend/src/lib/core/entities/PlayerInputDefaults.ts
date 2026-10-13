import { apply_entity_input_defaults } from "./EntityInputDefaults";
import type { CreatePlayerInput } from "./Player";

export const PLAYER_INPUT_DEFAULTS: Partial<CreatePlayerInput> = {
  email: "",
  phone: "",
  height_cm: 0,
  weight_kg: 0,
  profile_image_url: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  medical_notes: "",
};

export function apply_player_input_defaults(
  input: CreatePlayerInput,
): CreatePlayerInput {
  return apply_entity_input_defaults(PLAYER_INPUT_DEFAULTS, input);
}
