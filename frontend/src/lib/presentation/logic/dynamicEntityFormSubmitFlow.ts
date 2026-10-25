import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import { DYNAMIC_ENTITY_FORM_SUBMIT_STATUS } from "./dynamicEntityFormConstants";
import {
  DYNAMIC_ENTITY_FORM_EVENT,
  DYNAMIC_ENTITY_FORM_MESSAGE,
} from "./dynamicEntityFormMessages";
import {
  resolve_dynamic_form_create_result,
  resolve_dynamic_form_update_result,
} from "./dynamicEntityFormSubmission";
import type {
  DynamicEntityFormSubmitCommand,
  DynamicEntityFormSubmitResult,
} from "./dynamicEntityFormSubmitTypes";
import {
  build_transfer_form_data_for_save,
  plan_transfer_form_submission,
  TRANSFER_FORM_PLAN,
  type TransferFormPlan,
} from "./dynamicEntityFormTransferPlan";
import {
  is_transfer_decline_plan,
  resolve_transfer_after_save,
} from "./dynamicEntityFormTransferResolution";
import { validate_form_data_against_metadata } from "./dynamicFormLogic";
import { omit_form_only_fields } from "./dynamicFormOnlyFields";

export type {
  DynamicEntityFormSubmitCommand,
  DynamicEntityFormSubmitResult,
} from "./dynamicEntityFormSubmitTypes";

const SAVE_CRASHED_LOG_MESSAGE =
  "[DynamicEntityForm] Save crashed unexpectedly";

async function save_dynamic_entity_form_record(
  command: DynamicEntityFormSubmitCommand,
): Promise<Result<BaseEntity, string>> {
  try {
    return await request_dynamic_entity_form_save(command);
  } catch (error) {
    console.error(SAVE_CRASHED_LOG_MESSAGE, {
      event: DYNAMIC_ENTITY_FORM_EVENT.SAVE_CRASHED,
      entity_type: command.entity_type,
      is_edit_mode: command.is_edit_mode,
      error: String(error),
    });
    return create_failure_result(DYNAMIC_ENTITY_FORM_MESSAGE.SAVE_FAILED);
  }
}

async function request_dynamic_entity_form_save(
  command: DynamicEntityFormSubmitCommand,
): Promise<Result<BaseEntity, string>> {
  return command.is_edit_mode && command.entity_data?.id
    ? resolve_dynamic_form_update_result(
        command.entity_type,
        command.crud_handlers,
        command.entity_data.id,
        command.form_data,
      )
    : resolve_dynamic_form_create_result(
        command.entity_type,
        command.crud_handlers,
        command.form_data,
      );
}

type PersistedDynamicEntityForm = {
  saved_entity: BaseEntity;
  transfer_plan: TransferFormPlan;
};

function block_transfer_submission(
  command: DynamicEntityFormSubmitCommand,
  reason: string,
): Result<never, string> {
  console.warn("[DynamicEntityForm] Transfer status change blocked", {
    event: DYNAMIC_ENTITY_FORM_EVENT.TRANSFER_STATUS_CHANGE_BLOCKED,
    entity_type: command.entity_type,
    is_edit_mode: command.is_edit_mode,
  });
  return create_failure_result(reason);
}

async function save_planned_dynamic_entity_form(
  command: DynamicEntityFormSubmitCommand,
  transfer_plan: TransferFormPlan,
): Promise<Result<BaseEntity, string>> {
  const save_result = await save_dynamic_entity_form_record({
    ...command,
    form_data: build_transfer_form_data_for_save(
      command.form_data,
      transfer_plan,
    ),
  });
  if (save_result.success) return save_result;
  console.error("[DynamicEntityForm] Save failed", {
    event: DYNAMIC_ENTITY_FORM_EVENT.SAVE_FAILED,
    entity_type: command.entity_type,
    is_edit_mode: command.is_edit_mode,
    error: save_result.error,
  });
  return create_failure_result(
    save_result.error || DYNAMIC_ENTITY_FORM_MESSAGE.SAVE_FAILED,
  );
}

async function persist_dynamic_entity_form(
  command: DynamicEntityFormSubmitCommand,
): Promise<Result<PersistedDynamicEntityForm, string>> {
  const transfer_plan = plan_transfer_form_submission({
    entity_type: command.entity_type,
    is_edit_mode: command.is_edit_mode,
    entity_data: command.entity_data ?? {},
    form_data: command.form_data,
  });
  if (transfer_plan.kind === TRANSFER_FORM_PLAN.BLOCKED)
    return block_transfer_submission(command, transfer_plan.reason);
  const save_result = await save_planned_dynamic_entity_form(
    command,
    transfer_plan,
  );
  if (!save_result.success) return save_result;
  const resolution_result = await resolve_transfer_after_save(
    transfer_plan,
    save_result.data,
    command.player_team_transfer_use_cases,
  );
  if (!resolution_result.success) {
    console.error("[DynamicEntityForm] Transfer resolution failed", {
      event: DYNAMIC_ENTITY_FORM_EVENT.TRANSFER_MEMBERSHIP_UPDATE_FAILED,
      entity_type: command.entity_type,
      entity_id: save_result.data.id,
      error: resolution_result.error,
    });
    return resolution_result;
  }
  return create_success_result({
    saved_entity: resolution_result.data,
    transfer_plan,
  });
}

function build_saved_submit_result(
  persisted: PersistedDynamicEntityForm,
): DynamicEntityFormSubmitResult {
  return {
    status: DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.SAVED,
    saved_entity: persisted.saved_entity,
    transfer_declined: is_transfer_decline_plan(persisted.transfer_plan),
  };
}

export async function submit_dynamic_entity_form(
  command: DynamicEntityFormSubmitCommand,
): Promise<DynamicEntityFormSubmitResult> {
  if (!command.entity_metadata || command.permission_denied) {
    return { status: DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.SKIPPED };
  }

  const validation_result = validate_form_data_against_metadata(
    command.form_data,
    command.entity_metadata,
    command.is_edit_mode,
    command.entity_type,
  );
  if (!validation_result.success) {
    return {
      status: DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.INVALID,
      validation_errors: validation_result.error,
    };
  }

  const persist_result = await persist_dynamic_entity_form({
    ...command,
    form_data: omit_form_only_fields(
      command.form_data,
      command.entity_metadata.fields,
    ),
  });
  if (!persist_result.success) {
    return {
      status: DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.FAILED,
      save_error_message: persist_result.error,
    };
  }
  return build_saved_submit_result(persist_result.data);
}
