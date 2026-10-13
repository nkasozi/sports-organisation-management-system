import type { PlayerTeamMembershipUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/PlayerTeamMembershipUseCasesPort";
import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";
import {
  apply_player_transfer_membership_change,
  type TransferApprovalDetails,
} from "$lib/presentation/logic/playerTransferApprovalLogic";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import { TRANSFER_STATUS } from "../../core/entities/StatusConstants";
import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import {
  DYNAMIC_ENTITY_FORM_EVENT,
  DYNAMIC_ENTITY_FORM_MESSAGE,
} from "./dynamicEntityFormMessages";
import {
  DYNAMIC_FORM_ENTITY_TYPE,
  is_dynamic_form_entity_type,
} from "./dynamicFormConstants";

const TRANSFER_STATUS_FIELD_NAME = "status";

function report_save_handler_failure(
  entity_type: string,
  event: string,
  user_message: string,
): Result<never, string> {
  console.error("[DynamicEntityForm] Save handler unavailable", {
    event,
    entity_type,
  });
  return create_failure_result(user_message);
}

export async function resolve_dynamic_form_create_result(
  entity_type: string,
  crud_handlers: EntityCrudHandlers | undefined,
  data: Record<string, unknown>,
): Promise<Result<BaseEntity, string>> {
  if (crud_handlers?.create) {
    return crud_handlers.create(data);
  }

  const use_cases_result = get_use_cases_for_entity_type(
    entity_type.toLowerCase(),
  );
  if (!use_cases_result.success) {
    return report_save_handler_failure(
      entity_type,
      DYNAMIC_ENTITY_FORM_EVENT.SAVE_HANDLER_MISSING,
      DYNAMIC_ENTITY_FORM_MESSAGE.SAVE_HANDLER_MISSING,
    );
  }
  if (!(use_cases_result.data.create instanceof Function)) {
    return report_save_handler_failure(
      entity_type,
      DYNAMIC_ENTITY_FORM_EVENT.CREATE_NOT_SUPPORTED,
      DYNAMIC_ENTITY_FORM_MESSAGE.CREATE_NOT_SUPPORTED,
    );
  }
  return use_cases_result.data.create(data);
}

export async function resolve_dynamic_form_update_result(
  entity_type: string,
  crud_handlers: EntityCrudHandlers | undefined,
  id: string,
  data: Record<string, unknown>,
): Promise<Result<BaseEntity, string>> {
  if (crud_handlers?.update) {
    return crud_handlers.update(id, data);
  }

  const use_cases_result = get_use_cases_for_entity_type(
    entity_type.toLowerCase(),
  );
  if (!use_cases_result.success) {
    return report_save_handler_failure(
      entity_type,
      DYNAMIC_ENTITY_FORM_EVENT.SAVE_HANDLER_MISSING,
      DYNAMIC_ENTITY_FORM_MESSAGE.SAVE_HANDLER_MISSING,
    );
  }
  if (!(use_cases_result.data.update instanceof Function)) {
    return report_save_handler_failure(
      entity_type,
      DYNAMIC_ENTITY_FORM_EVENT.UPDATE_NOT_SUPPORTED,
      DYNAMIC_ENTITY_FORM_MESSAGE.UPDATE_NOT_SUPPORTED,
    );
  }
  return use_cases_result.data.update(id, data);
}

function is_transfer_status_transition(
  entity_type: string,
  is_edit_mode: boolean,
  entity_data: Partial<BaseEntity> | undefined,
  form_data: Record<string, unknown>,
  target_status: string,
): boolean {
  const previous_values: Record<string, unknown> = { ...entity_data };
  return (
    is_dynamic_form_entity_type(
      entity_type,
      DYNAMIC_FORM_ENTITY_TYPE.PLAYER_TEAM_TRANSFER_HISTORY,
    ) &&
    is_edit_mode &&
    previous_values[TRANSFER_STATUS_FIELD_NAME] !== target_status &&
    form_data[TRANSFER_STATUS_FIELD_NAME] === target_status
  );
}

export function check_if_player_transfer_is_being_approved(
  entity_type: string,
  is_edit_mode: boolean,
  entity_data: Partial<BaseEntity> | undefined,
  form_data: Record<string, unknown>,
): boolean {
  return is_transfer_status_transition(
    entity_type,
    is_edit_mode,
    entity_data,
    form_data,
    TRANSFER_STATUS.APPROVED,
  );
}

export function is_transfer_entity_and_status_just_changed_to_declined(
  entity_type: string,
  is_edit_mode: boolean,
  entity_data: Partial<BaseEntity> | undefined,
  form_data: Record<string, unknown>,
): boolean {
  return is_transfer_status_transition(
    entity_type,
    is_edit_mode,
    entity_data,
    form_data,
    TRANSFER_STATUS.DECLINED,
  );
}
export async function execute_dynamic_form_transfer_membership_change(
  saved_transfer: BaseEntity,
  player_team_membership_use_cases: PlayerTeamMembershipUseCasesPort,
): Promise<Result<boolean, string>> {
  const transfer = saved_transfer as unknown as TransferApprovalDetails;
  const result = await apply_player_transfer_membership_change(
    player_team_membership_use_cases,
    transfer,
  );
  if (!result.success) {
    return create_failure_result(result.error);
  }
  return create_success_result(true);
}
