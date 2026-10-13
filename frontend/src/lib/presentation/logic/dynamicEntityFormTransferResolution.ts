import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type { PlayerTeamTransferHistoryUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/PlayerTeamTransferHistoryUseCasesPort";
import { create_success_result, type Result } from "$lib/core/types/Result";
import { TransferResolution } from "$lib/core/usecases/TransferResolutionStateMachine";

import {
  TRANSFER_FORM_PLAN,
  type TransferFormPlan,
} from "./dynamicEntityFormTransferPlan";

export type TransferResolutionUseCases = Pick<
  PlayerTeamTransferHistoryUseCasesPort,
  "confirm_transfer" | "reject_transfer"
>;

async function run_transfer_resolution(
  plan: Extract<
    TransferFormPlan,
    { kind: typeof TRANSFER_FORM_PLAN.SAVE_THEN_RESOLVE }
  >,
  saved_entity: BaseEntity,
  transfer_use_cases: TransferResolutionUseCases,
): Promise<Result<BaseEntity, string>> {
  switch (plan.resolution) {
    case TransferResolution.CONFIRM:
      return transfer_use_cases.confirm_transfer(saved_entity.id);
    case TransferResolution.REJECT:
      return transfer_use_cases.reject_transfer(saved_entity.id);
  }
}

export async function resolve_transfer_after_save(
  plan: TransferFormPlan,
  saved_entity: BaseEntity,
  transfer_use_cases: TransferResolutionUseCases,
): Promise<Result<BaseEntity, string>> {
  switch (plan.kind) {
    case TRANSFER_FORM_PLAN.SAVE_THEN_RESOLVE:
      return run_transfer_resolution(plan, saved_entity, transfer_use_cases);
    case TRANSFER_FORM_PLAN.SAVE_ONLY:
    case TRANSFER_FORM_PLAN.BLOCKED:
      return create_success_result(saved_entity);
  }
}

export function is_transfer_decline_plan(plan: TransferFormPlan): boolean {
  return (
    plan.kind === TRANSFER_FORM_PLAN.SAVE_THEN_RESOLVE &&
    plan.resolution === TransferResolution.REJECT
  );
}
