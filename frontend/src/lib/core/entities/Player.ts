import type { BaseEntity } from "./BaseEntity";

export type PlayerStatus = "active" | "injured" | "suspended" | "inactive";

export const DEFAULT_PLAYER_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%236366f1'/%3E%3Ccircle cx='50' cy='35' r='18' fill='white'/%3E%3Cpath d='M50 55c-22 0-35 12-35 30h70c0-18-13-30-35-30z' fill='white'/%3E%3C/svg%3E";

export interface Player extends BaseEntity {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  position_id: string;
  height_cm: number | null;
  weight_kg: number | null;
  nationality: string;
  profile_image_url: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_notes: string;
  status: PlayerStatus;
}

export function get_player_avatar(player: Player): string {
  return player.profile_image_url && player.profile_image_url.trim() !== ""
    ? player.profile_image_url
    : DEFAULT_PLAYER_AVATAR;
}

export function get_player_initials(player: Player): string {
  const first_initial = player.first_name
    ? player.first_name.charAt(0).toUpperCase()
    : "";
  const last_initial = player.last_name
    ? player.last_name.charAt(0).toUpperCase()
    : "";
  return `${first_initial}${last_initial}` || "??";
}

export type CreatePlayerInput = Omit<
  Player,
  "id" | "created_at" | "updated_at"
>;
export type UpdatePlayerInput = Partial<CreatePlayerInput>;

export function get_player_full_name(player: Player): string {
  return `${player.first_name} ${player.last_name}`.trim();
}

export function create_empty_player_input(): CreatePlayerInput {
  return {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    position_id: "",
    height_cm: null,
    weight_kg: null,
    nationality: "",
    profile_image_url: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_notes: "",
    status: "active",
  };
}

export function validate_player_input(input: CreatePlayerInput): string[] {
  const validation_errors: string[] = [];

  if (!input.first_name || input.first_name.trim().length < 1) {
    validation_errors.push("First name is required");
  }

  if (!input.last_name || input.last_name.trim().length < 1) {
    validation_errors.push("Last name is required");
  }

  if (!input.date_of_birth) {
    validation_errors.push("Date of birth is required");
  }

  if (!input.nationality || input.nationality.trim().length === 0) {
    validation_errors.push("Nationality is required");
  }

  if (!input.position_id || input.position_id.trim().length === 0) {
    validation_errors.push("Position is required");
  }

  return validation_errors;
}
