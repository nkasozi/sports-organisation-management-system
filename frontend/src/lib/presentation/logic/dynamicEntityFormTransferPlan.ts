import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type {
  PlayerTeamTransferHistory,
  UpdatePlayerTeamTransferHistoryInput,
} from "$lib/core/entities/PlayerTeamTransferHistory";
import {
  TRANSFER_STATUS,
  type TransferStatusValue,
} from "$lib/core/entities/StatusConstants";
import {
  decide_transfer_edit,
  TRANSFER_EDIT_DECISION,
} from "$lib/core/usecases/TransferEditGuard";
import {
  decide_transfer_resolution,
  TransferResolution,
  TransferResolutionOutcome,
  type TransferResolutionValue,
} from "$lib/core/usecases/TransferResolutionStateMachine";

import {
  DYNAMIC_FORM_ENTITY_TYPE,
  is_dynamic_form_entity_type,
} from "./dynamicFormConstants";

export const TRANSFER_FORM_PLAN = {
  SAVE_ONLY: "save_only",
  SAVE_THEN_RESOLVE: "save_then_resolve",
  BLOCKED: "blocked",
} as const;

export type TransferFormPlan =
  | { kind: typeof TRANSFER_FORM_PLAN.SAVE_ONLY }
  | {
      kind: typeof TRANSFER_FORM_PLAN.SAVE_THEN_RESOLVE;
      resolution: TransferResolutionValue;
    }
  | { kind: typeof TRANSFER_FORM_PLAN.BLOCKED; reason: string };

type TransferFormPlanInput = {
  entity_type: string;
  is_edit_mode: boolean;
  entity_data: Partial<BaseEntity>;
  form_data: Record<string, unknown>;
};

const TRANSFER_FORM_MESSAGE = {
  CREATE_MUST_BE_PENDING:
    "New transfers must be saved as pending. Approve or decline the transfer after it has been created.",
  CANNOT_REOPEN:
    "This transfer has already been resolved and cannot be moved back to pending.",
  UNKNOWN_STATUS:
    "This transfer has a status we don't recognise. Please refresh and try again.",
} as const;

const TRANSFER_STATUS_FIELD_NAME = "status";
const STRING_TYPE_NAME = "string";
const KNOWN_TRANSFER_STATUSES: ReadonlySet<string> = new Set(
  Object.values(TRANSFER_STATUS),
);

function is_transfer_status(value: unknown): value is TransferStatusValue {
  return (
    typeof value === STRING_TYPE_NAME &&
    KNOWN_TRANSFER_STATUSES.has(String(value))
  );
}

function is_status_absent(value: unknown): boolean {
  return value === undefined || value === "";
}

function read_previous_status(input: TransferFormPlanInput): unknown {
  const previous_values: Record<string, unknown> = { ...input.entity_data };
  const stored_status = previous_values[TRANSFER_STATUS_FIELD_NAME];
  return input.is_edit_mode && !is_status_absent(stored_status)
    ? stored_status
    : TRANSFER_STATUS.PENDING;
}

function block(reason: string): TransferFormPlan {
  return { kind: TRANSFER_FORM_PLAN.BLOCKED, reason };
}

function plan_resolution(
  previous_status: TransferStatusValue,
  resolution: TransferResolutionValue,
  is_edit_mode: boolean,
): TransferFormPlan {
  if (!is_edit_mode) return block(TRANSFER_FORM_MESSAGE.CREATE_MUST_BE_PENDING);
  const decision = decide_transfer_resolution(previous_status, resolution);
  return decision.outcome === TransferResolutionOutcome.ALLOWED
    ? { kind: TRANSFER_FORM_PLAN.SAVE_THEN_RESOLVE, resolution }
    : block(decision.reason);
}

function plan_status_change(
  previous_status: TransferStatusValue,
  next_status: TransferStatusValue,
  is_edit_mode: boolean,
): TransferFormPlan {
  switch (next_status) {
    case TRANSFER_STATUS.APPROVED:
      return plan_resolution(
        previous_status,
        TransferResolution.CONFIRM,
        is_edit_mode,
      );
    case TRANSFER_STATUS.DECLINED:
      return plan_resolution(
        previous_status,
        TransferResolution.REJECT,
        is_edit_mode,
      );
    case TRANSFER_STATUS.PENDING:
      return block(TRANSFER_FORM_MESSAGE.CANNOT_REOPEN);
  }
}

function plan_same_status_edit(
  input: TransferFormPlanInput,
  status: TransferStatusValue,
): TransferFormPlan {
  if (!input.is_edit_mode) return { kind: TRANSFER_FORM_PLAN.SAVE_ONLY };
  const decision = decide_transfer_edit(
    { ...input.entity_data, status } as PlayerTeamTransferHistory,
    input.form_data as UpdatePlayerTeamTransferHistoryInput,
  );
  return decision.kind === TRANSFER_EDIT_DECISION.REJECTED
    ? block(decision.reason)
    : { kind: TRANSFER_FORM_PLAN.SAVE_ONLY };
}

export function plan_transfer_form_submission(
  input: TransferFormPlanInput,
): TransferFormPlan {
  if (
    !is_dynamic_form_entity_type(
      input.entity_type,
      DYNAMIC_FORM_ENTITY_TYPE.PLAYER_TEAM_TRANSFER_HISTORY,
    )
  )
    return { kind: TRANSFER_FORM_PLAN.SAVE_ONLY };
  const previous_status = read_previous_status(input);
  const next_status = input.form_data[TRANSFER_STATUS_FIELD_NAME];
  if (is_status_absent(next_status))
    return { kind: TRANSFER_FORM_PLAN.SAVE_ONLY };
  if (!is_transfer_status(previous_status) || !is_transfer_status(next_status))
    return block(TRANSFER_FORM_MESSAGE.UNKNOWN_STATUS);
  if (previous_status === next_status)
    return plan_same_status_edit(input, previous_status);
  return plan_status_change(previous_status, next_status, input.is_edit_mode);
}

export function build_transfer_form_data_for_save<
  FormData extends Record<string, unknown>,
>(form_data: FormData, plan: TransferFormPlan): FormData {
  switch (plan.kind) {
    case TRANSFER_FORM_PLAN.SAVE_THEN_RESOLVE:
      return {
        ...form_data,
        [TRANSFER_STATUS_FIELD_NAME]: TRANSFER_STATUS.PENDING,
      };
    case TRANSFER_FORM_PLAN.SAVE_ONLY:
    case TRANSFER_FORM_PLAN.BLOCKED:
      return form_data;
  }
}
