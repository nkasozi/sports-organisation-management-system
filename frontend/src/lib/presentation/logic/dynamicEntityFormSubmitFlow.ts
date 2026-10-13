import type { PlayerTeamMembershipUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/PlayerTeamMembershipUseCasesPort";
import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import type {
  BaseEntity,
  EntityMetadata,
} from "../../core/entities/BaseEntity";
import { DYNAMIC_ENTITY_FORM_SUBMIT_STATUS } from "./dynamicEntityFormConstants";
import {
  DYNAMIC_ENTITY_FORM_EVENT,
  DYNAMIC_ENTITY_FORM_MESSAGE,
} from "./dynamicEntityFormMessages";
import {
  check_if_player_transfer_is_being_approved,
  execute_dynamic_form_transfer_membership_change,
  is_transfer_entity_and_status_just_changed_to_declined,
  resolve_dynamic_form_create_result,
  resolve_dynamic_form_update_result,
} from "./dynamicEntityFormSubmission";
import type { DynamicFormData } from "./dynamicFormConstants";
import { validate_form_data_against_metadata } from "./dynamicFormLogic";

export type DynamicEntityFormSubmitResult =
  | { status: typeof DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.SKIPPED }
  | {
      status: typeof DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.INVALID;
      validation_errors: Record<string, string>;
    }
  | {
      status: typeof DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.FAILED;
      save_error_message: string;
    }
  | {
      status: typeof DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.SAVED;
      saved_entity: BaseEntity;
      transfer_declined: boolean;
    };

export type DynamicEntityFormSubmitCommand = {
  entity_type: string;
  entity_metadata?: EntityMetadata;
  form_data: DynamicFormData;
  is_edit_mode: boolean;
  entity_data?: Partial<BaseEntity>;
  crud_handlers?: EntityCrudHandlers;
  permission_denied: boolean;
  player_team_membership_use_cases: PlayerTeamMembershipUseCasesPort;
};

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

async function apply_approved_transfer_update(
  command: DynamicEntityFormSubmitCommand,
  saved_entity: BaseEntity,
  should_apply_transfer_update: boolean,
): Promise<Result<boolean, string>> {
  if (!should_apply_transfer_update) return create_success_result(true);
  return execute_dynamic_form_transfer_membership_change(
    saved_entity,
    command.player_team_membership_use_cases,
  );
}

async function persist_dynamic_entity_form(
  command: DynamicEntityFormSubmitCommand,
): Promise<Result<BaseEntity, string>> {
  const should_apply_transfer_update =
    check_if_player_transfer_is_being_approved(
      command.entity_type,
      command.is_edit_mode,
      command.entity_data,
      command.form_data,
    );
  const save_result = await save_dynamic_entity_form_record(command);
  if (!save_result.success) {
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
  const transfer_result = await apply_approved_transfer_update(
    command,
    save_result.data,
    should_apply_transfer_update,
  );
  if (!transfer_result.success) {
    console.error("[DynamicEntityForm] Transfer membership update failed", {
      event: DYNAMIC_ENTITY_FORM_EVENT.TRANSFER_MEMBERSHIP_UPDATE_FAILED,
      entity_type: command.entity_type,
      entity_id: save_result.data.id,
      error: transfer_result.error,
    });
    return create_failure_result(transfer_result.error);
  }
  return save_result;
}

function build_saved_submit_result(
  command: DynamicEntityFormSubmitCommand,
  saved_entity: BaseEntity,
): DynamicEntityFormSubmitResult {
  return {
    status: DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.SAVED,
    saved_entity,
    transfer_declined: is_transfer_entity_and_status_just_changed_to_declined(
      command.entity_type,
      command.is_edit_mode,
      command.entity_data,
      command.form_data,
    ),
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

  const persist_result = await persist_dynamic_entity_form(command);
  if (!persist_result.success) {
    return {
      status: DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.FAILED,
      save_error_message: persist_result.error,
    };
  }
  return build_saved_submit_result(command, persist_result.data);
}
