import type { BaseEntity, EntityStatus } from "./BaseEntity";

export type ProfileVisibility = "public" | "private";

export interface TeamProfile extends BaseEntity {
  team_id: string;
  profile_summary: string;
  visibility: ProfileVisibility;
  profile_slug: string;
  featured_image_url: string;
  status: EntityStatus;
}

export type CreateTeamProfileInput = Omit<
  TeamProfile,
  "id" | "created_at" | "updated_at"
>;

export type UpdateTeamProfileInput = Partial<
  Omit<TeamProfile, "id" | "created_at" | "updated_at" | "team_id">
>;

export const TEAM_PROFILE_VISIBILITY_OPTIONS = [
  { value: "public", label: "Public - Anyone with the link can view" },
  { value: "private", label: "Private - Only you can view" },
];

export function create_empty_team_profile_input(
  team_id: string = "",
): CreateTeamProfileInput {
  return {
    team_id,
    profile_summary: "",
    visibility: "private",
    profile_slug: "",
    featured_image_url: "",
    status: "active",
  };
}

export function generate_team_profile_slug(
  team_name: string,
  team_id: string,
): string {
  const name_part = team_name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const id_suffix = team_id.slice(-6);
  return `${name_part}-${id_suffix}`;
}

export function validate_team_profile_input(
  input: CreateTeamProfileInput | UpdateTeamProfileInput,
): { is_valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if ("team_id" in input && (!input.team_id || input.team_id.trim() === "")) {
    errors.team_id = "Team is required";
  }

  if (input.visibility && !["public", "private"].includes(input.visibility)) {
    errors.visibility = "Visibility must be public or private";
  }

  return {
    is_valid: Object.keys(errors).length === 0,
    errors,
  };
}
