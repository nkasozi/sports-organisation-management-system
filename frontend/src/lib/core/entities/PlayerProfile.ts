import type {
  EntityId,
  Name,
  ScalarInput,
  ScalarValueInput,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import { is_blank_text } from "./EntityValidation";
import {
  build_profile_slug,
  INVALID_PROFILE_VISIBILITY_MESSAGE,
  is_invalid_profile_visibility,
  PROFILE_VISIBILITY,
  PROFILE_VISIBILITY_SELECT_OPTIONS,
  type ProfileVisibility,
} from "./ProfileVisibility";
import { ENTITY_STATUS } from "./StatusConstants";

const PLAYER_REQUIRED_MESSAGE = "Player is required";

export type { ProfileVisibility } from "./ProfileVisibility";

export interface PlayerProfile extends BaseEntity {
  player_id: EntityId;
  profile_summary: string;
  visibility: ProfileVisibility;
  profile_slug: string;
  featured_image_url: string;
  status: EntityStatus;
}

export type CreatePlayerProfileInput = Omit<
  ScalarInput<PlayerProfile>,
  "id" | "created_at" | "updated_at"
>;

export type UpdatePlayerProfileInput = Partial<
  Omit<
    ScalarInput<PlayerProfile>,
    "id" | "created_at" | "updated_at" | "player_id"
  >
>;

export const PROFILE_VISIBILITY_OPTIONS = PROFILE_VISIBILITY_SELECT_OPTIONS;

export function create_empty_player_profile_input(
  player_id: CreatePlayerProfileInput["player_id"] = "",
): CreatePlayerProfileInput {
  return {
    player_id,
    profile_summary: "",
    visibility: PROFILE_VISIBILITY.PRIVATE,
    profile_slug: "",
    featured_image_url: "",
    status: ENTITY_STATUS.ACTIVE,
  };
}

export function generate_profile_slug(
  first_name: ScalarValueInput<Name>,
  last_name: ScalarValueInput<Name>,
  player_id: ScalarValueInput<PlayerProfile["player_id"]>,
): string {
  return build_profile_slug(`${first_name}-${last_name}`, player_id);
}

export function validate_player_profile_input(
  input: CreatePlayerProfileInput | UpdatePlayerProfileInput,
): { is_valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if ("player_id" in input && is_blank_text(input.player_id)) {
    errors.player_id = PLAYER_REQUIRED_MESSAGE;
  }
  if (is_invalid_profile_visibility(input.visibility)) {
    errors.visibility = INVALID_PROFILE_VISIBILITY_MESSAGE;
  }
  return { is_valid: Object.keys(errors).length === 0, errors };
}
