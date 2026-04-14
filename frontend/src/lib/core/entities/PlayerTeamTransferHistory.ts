import type {
  EntityId,
  IsoDateString,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity } from "./BaseEntity";

export type PlayerTeamTransferStatus = "pending" | "approved" | "declined";

export interface PlayerTeamTransferHistory extends BaseEntity {
  organization_id: EntityId;
  player_id: EntityId;
  from_team_id: EntityId;
  to_team_id: EntityId;
  transfer_date: IsoDateString;
  status: PlayerTeamTransferStatus;
  approved_by: EntityId;
  notes: string;
}

export type CreatePlayerTeamTransferHistoryInput = Omit<
  ScalarInput<PlayerTeamTransferHistory>,
  "id" | "created_at" | "updated_at"
>;

export type UpdatePlayerTeamTransferHistoryInput =
  Partial<CreatePlayerTeamTransferHistoryInput>;

function create_empty_player_team_transfer_history_input(
  organization_id: CreatePlayerTeamTransferHistoryInput["organization_id"] = "",
  player_id: CreatePlayerTeamTransferHistoryInput["player_id"] = "",
  from_team_id: CreatePlayerTeamTransferHistoryInput["from_team_id"] = "",
  to_team_id: CreatePlayerTeamTransferHistoryInput["to_team_id"] = "",
): CreatePlayerTeamTransferHistoryInput {
  return {
    organization_id,
    player_id,
    from_team_id,
    to_team_id,
    transfer_date: new Date().toISOString().split("T")[0],
    status: "pending",
    approved_by: "",
    notes: "",
  };
}

export function validate_player_team_transfer_history_input(
  input: CreatePlayerTeamTransferHistoryInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.organization_id || input.organization_id.trim().length === 0) {
    validation_errors.push("Organization is required");
  }

  if (!input.player_id || input.player_id.trim().length === 0) {
    validation_errors.push("Player is required");
  }

  if (!input.from_team_id || input.from_team_id.trim().length === 0) {
    validation_errors.push("From Team is required");
  }

  if (!input.to_team_id || input.to_team_id.trim().length === 0) {
    validation_errors.push("To Team is required");
  }

  if (input.from_team_id === input.to_team_id) {
    validation_errors.push("From Team and To Team cannot be the same");
  }

  if (!input.transfer_date || input.transfer_date.trim().length === 0) {
    input.transfer_date = new Date().toISOString().split("T")[0];
  }

  if (!input.status || input.status.trim().length === 0) {
    validation_errors.push("Status is required");
  }

  return validation_errors;
}
