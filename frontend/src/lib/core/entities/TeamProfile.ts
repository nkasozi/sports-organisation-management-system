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

const TEAM_REQUIRED_MESSAGE = "Team is required";

export type { ProfileVisibility } from "./ProfileVisibility";

export interface TeamProfile extends BaseEntity {
  team_id: EntityId;
  profile_summary: string;
  visibility: ProfileVisibility;
  profile_slug: string;
  featured_image_url: string;
  status: EntityStatus;
}

export type CreateTeamProfileInput = Omit<
  ScalarInput<TeamProfile>,
  "id" | "created_at" | "updated_at"
>;

export type UpdateTeamProfileInput = Partial<
  Omit<ScalarInput<TeamProfile>, "id" | "created_at" | "updated_at" | "team_id">
>;

export const TEAM_PROFILE_VISIBILITY_OPTIONS =
  PROFILE_VISIBILITY_SELECT_OPTIONS;

export function create_empty_team_profile_input(
  team_id: CreateTeamProfileInput["team_id"] = "",
): CreateTeamProfileInput {
  return {
    team_id,
    profile_summary: "",
    visibility: PROFILE_VISIBILITY.PRIVATE,
    profile_slug: "",
    featured_image_url: "",
    status: ENTITY_STATUS.ACTIVE,
  };
}

export function generate_team_profile_slug(
  team_name: ScalarValueInput<Name>,
  team_id: ScalarValueInput<TeamProfile["team_id"]>,
): string {
  return build_profile_slug(team_name, team_id);
}

export function validate_team_profile_input(
  input: CreateTeamProfileInput | UpdateTeamProfileInput,
): { is_valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if ("team_id" in input && is_blank_text(input.team_id)) {
    errors.team_id = TEAM_REQUIRED_MESSAGE;
  }
  if (is_invalid_profile_visibility(input.visibility)) {
    errors.visibility = INVALID_PROFILE_VISIBILITY_MESSAGE;
  }
  return { is_valid: Object.keys(errors).length === 0, errors };
}
