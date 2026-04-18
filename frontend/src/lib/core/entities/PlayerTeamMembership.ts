import type {
  EntityId,
  IsoDateString,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity } from "./BaseEntity";

export type PlayerTeamMembershipStatus = "active" | "inactive" | "ended";

export interface PlayerTeamMembership extends BaseEntity {
  organization_id: EntityId;
  player_id: EntityId;
  team_id: EntityId;
  start_date: IsoDateString;
  jersey_number: number;
  status: PlayerTeamMembershipStatus;
}

export type CreatePlayerTeamMembershipInput = Omit<
  ScalarInput<PlayerTeamMembership>,
  "id" | "created_at" | "updated_at"
>;
export type UpdatePlayerTeamMembershipInput =
  Partial<CreatePlayerTeamMembershipInput>;

export function create_empty_player_team_membership_input(
  organization_id: CreatePlayerTeamMembershipInput["organization_id"] = "",
  player_id: CreatePlayerTeamMembershipInput["player_id"] = "",
  team_id: CreatePlayerTeamMembershipInput["team_id"] = "",
): CreatePlayerTeamMembershipInput {
  return {
    organization_id,
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

  if (!input.organization_id || input.organization_id.trim().length === 0) {
    validation_errors.push("Organization is required");
  }

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
    input.jersey_number !== 0 &&
    (input.jersey_number < 1 || input.jersey_number > 99)
  ) {
    validation_errors.push("Jersey number must be between 1 and 99");
  }

  return validation_errors;
}
