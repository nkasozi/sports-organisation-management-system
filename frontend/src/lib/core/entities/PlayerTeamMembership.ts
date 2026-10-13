import type {
  EntityId,
  IsoDateString,
  ScalarInput,
} from "../types/DomainScalars";
import { OptionStatus } from "../types/Option";
import type { BaseEntity } from "./BaseEntity";
import { read_provided_number } from "./EntityValidation";
import type { MembershipStatusValue } from "./StatusConstants";
import { MEMBERSHIP_STATUS } from "./StatusConstants";

export type PlayerTeamMembershipStatus = MembershipStatusValue;

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
    status: MEMBERSHIP_STATUS.ACTIVE,
  };
}

function is_jersey_number_out_of_range(raw_value: unknown): boolean {
  const provided_number = read_provided_number(raw_value);
  switch (provided_number.status) {
    case OptionStatus.NONE:
      return false;
    case OptionStatus.SOME:
      return (
        provided_number.value !== 0 &&
        (provided_number.value < 1 || provided_number.value > 99)
      );
  }
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

  if (is_jersey_number_out_of_range(input.jersey_number)) {
    validation_errors.push("Jersey number must be between 1 and 99");
  }

  return validation_errors;
}
