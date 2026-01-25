import type { BaseEntity, EntityStatus } from "./BaseEntity";

export type ProfileVisibility = "public" | "private";

export interface PlayerProfile extends BaseEntity {
  player_id: string;
  profile_summary: string;
  visibility: ProfileVisibility;
  profile_slug: string;
  featured_image_url: string;
  status: EntityStatus;
}

export type CreatePlayerProfileInput = Omit<
  PlayerProfile,
  "id" | "created_at" | "updated_at"
>;

export type UpdatePlayerProfileInput = Partial<
  Omit<PlayerProfile, "id" | "created_at" | "updated_at" | "player_id">
>;

export const PROFILE_VISIBILITY_OPTIONS = [
  { value: "public", label: "Public - Anyone with the link can view" },
  { value: "private", label: "Private - Only you can view" },
];

export function create_empty_player_profile_input(
  player_id: string = "",
): CreatePlayerProfileInput {
  return {
    player_id,
    profile_summary: "",
    visibility: "private",
    profile_slug: "",
    featured_image_url: "",
    status: "active",
  };
}

export function generate_profile_slug(
  first_name: string,
  last_name: string,
  player_id: string,
): string {
  const name_part = `${first_name}-${last_name}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const id_suffix = player_id.slice(-6);
  return `${name_part}-${id_suffix}`;
}

export function validate_player_profile_input(
  input: CreatePlayerProfileInput | UpdatePlayerProfileInput,
): { is_valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (
    "player_id" in input &&
    (!input.player_id || input.player_id.trim() === "")
  ) {
    errors.player_id = "Player is required";
  }

  if (input.visibility && !["public", "private"].includes(input.visibility)) {
    errors.visibility = "Visibility must be public or private";
  }

  return {
    is_valid: Object.keys(errors).length === 0,
    errors,
  };
}
