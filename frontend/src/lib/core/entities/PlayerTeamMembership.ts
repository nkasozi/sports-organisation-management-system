import type { BaseEntity } from "./BaseEntity";

export type PlayerTeamMembershipStatus = "active" | "inactive" | "ended";

export interface PlayerTeamMembership extends BaseEntity {
  player_id: string;
  team_id: string;
  start_date: string;
  jersey_number: number | null;
  status: PlayerTeamMembershipStatus;
}

export type CreatePlayerTeamMembershipInput = Omit<
  PlayerTeamMembership,
  "id" | "created_at" | "updated_at"
>;
export type UpdatePlayerTeamMembershipInput =
  Partial<CreatePlayerTeamMembershipInput>;

export function create_empty_player_team_membership_input(
  player_id: string = "",
  team_id: string = "",
): CreatePlayerTeamMembershipInput {
  return {
    player_id,
    team_id,
    start_date: new Date().toISOString().split("T")[0],
    jersey_number: 1,
    status: "active",
  };
}

export function validate_player_team_membership_input(
  input: CreatePlayerTeamMembershipInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.player_id || input.player_id.trim().length === 0) {
    validation_errors.push("Player is required");
  }

  if (!input.team_id || input.team_id.trim().length === 0) {
    validation_errors.push("Team is required");
  }

  if (!input.start_date || input.start_date.trim().length === 0) {
    validation_errors.push("Start date is required");
  }

  if (
    typeof input.jersey_number === "number" &&
    (input.jersey_number < 1 || input.jersey_number > 99)
  ) {
    validation_errors.push("Jersey number must be between 1 and 99");
  }

  return validation_errors;
}
