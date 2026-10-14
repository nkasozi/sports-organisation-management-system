import type {
  CreatePlayerTeamTransferHistoryInput,
  PlayerTeamTransferHistory,
  UpdatePlayerTeamTransferHistoryInput,
} from "../entities/PlayerTeamTransferHistory";
import { TRANSFER_STATUS } from "../entities/StatusConstants";

export const TRANSFER_EDIT_DECISION = {
  ALLOWED: "allowed",
  REJECTED: "rejected",
} as const;

type TransferEditDecision =
  | { kind: typeof TRANSFER_EDIT_DECISION.ALLOWED }
  | { kind: typeof TRANSFER_EDIT_DECISION.REJECTED; reason: string };

const TRANSFER_EDIT_MESSAGE = {
  CREATE_MUST_BE_PENDING:
    "New transfers must be saved as pending. Approve or decline the transfer after it has been created.",
  STATUS_REQUIRES_RESOLUTION:
    "A transfer's status can only change by approving or declining it.",
  RESOLVED_PARTIES_LOCKED:
    "This transfer has already been resolved, so its player and teams can no longer be changed. Create a new transfer instead.",
} as const;

const RESOLVED_TRANSFER_LOCKED_FIELDS = [
  "player_id",
  "from_team_id",
  "to_team_id",
] as const satisfies ReadonlyArray<keyof PlayerTeamTransferHistory>;

const ALLOWED: TransferEditDecision = { kind: TRANSFER_EDIT_DECISION.ALLOWED };

function reject(reason: string): TransferEditDecision {
  return { kind: TRANSFER_EDIT_DECISION.REJECTED, reason };
}

export function decide_transfer_creation(
  input: CreatePlayerTeamTransferHistoryInput,
): TransferEditDecision {
  return input.status === TRANSFER_STATUS.PENDING
    ? ALLOWED
    : reject(TRANSFER_EDIT_MESSAGE.CREATE_MUST_BE_PENDING);
}

function changes_locked_party(
  existing: PlayerTeamTransferHistory,
  input: UpdatePlayerTeamTransferHistoryInput,
): boolean {
  return RESOLVED_TRANSFER_LOCKED_FIELDS.some(
    (field_name) =>
      input[field_name] !== void 0 &&
      String(input[field_name]) !== String(existing[field_name]),
  );
}

function decide_resolved_transfer_edit(
  existing: PlayerTeamTransferHistory,
  input: UpdatePlayerTeamTransferHistoryInput,
): TransferEditDecision {
  return changes_locked_party(existing, input)
    ? reject(TRANSFER_EDIT_MESSAGE.RESOLVED_PARTIES_LOCKED)
    : ALLOWED;
}

export function decide_transfer_edit(
  existing: PlayerTeamTransferHistory,
  input: UpdatePlayerTeamTransferHistoryInput,
): TransferEditDecision {
  if (input.status !== void 0 && input.status !== existing.status)
    return reject(TRANSFER_EDIT_MESSAGE.STATUS_REQUIRES_RESOLUTION);
  switch (existing.status) {
    case TRANSFER_STATUS.PENDING:
      return ALLOWED;
    case TRANSFER_STATUS.APPROVED:
    case TRANSFER_STATUS.DECLINED:
      return decide_resolved_transfer_edit(existing, input);
  }
}
