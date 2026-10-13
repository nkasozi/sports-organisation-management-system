import {
  TRANSFER_STATUS,
  type TransferStatusValue,
} from "../entities/StatusConstants";
import {
  build_cannot_confirm_message,
  build_cannot_reject_message,
} from "./PlayerTeamTransferUseCasesConstants";

export const TransferResolution = {
  CONFIRM: "confirm",
  REJECT: "reject",
} as const;

export type TransferResolutionValue =
  (typeof TransferResolution)[keyof typeof TransferResolution];

export const TransferResolutionOutcome = {
  ALLOWED: "allowed",
  REJECTED: "rejected",
} as const;

type TransferResolutionDecision =
  | {
      outcome: typeof TransferResolutionOutcome.ALLOWED;
      next_status: TransferStatusValue;
    }
  | { outcome: typeof TransferResolutionOutcome.REJECTED; reason: string };

function resolved_status_for(
  resolution: TransferResolutionValue,
): TransferStatusValue {
  switch (resolution) {
    case TransferResolution.CONFIRM:
      return TRANSFER_STATUS.APPROVED;
    case TransferResolution.REJECT:
      return TRANSFER_STATUS.DECLINED;
  }
}

function build_rejection_reason(
  resolution: TransferResolutionValue,
  status: TransferStatusValue,
): string {
  switch (resolution) {
    case TransferResolution.CONFIRM:
      return build_cannot_confirm_message(status);
    case TransferResolution.REJECT:
      return build_cannot_reject_message(status);
  }
}

export function decide_transfer_resolution(
  status: TransferStatusValue,
  resolution: TransferResolutionValue,
): TransferResolutionDecision {
  switch (status) {
    case TRANSFER_STATUS.PENDING:
      return {
        outcome: TransferResolutionOutcome.ALLOWED,
        next_status: resolved_status_for(resolution),
      };
    case TRANSFER_STATUS.APPROVED:
    case TRANSFER_STATUS.DECLINED:
      return {
        outcome: TransferResolutionOutcome.REJECTED,
        reason: build_rejection_reason(resolution, status),
      };
  }
}
