import type { PlayerTeamMembershipUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/PlayerTeamMembershipUseCasesPort";
import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";

import type {
  BaseEntity,
  EntityMetadata,
} from "../../core/entities/BaseEntity";
import {
  check_if_player_transfer_is_being_approved,
  execute_dynamic_form_transfer_membership_change,
  is_transfer_entity_and_status_just_changed_to_declined,
  resolve_dynamic_form_create_result,
  resolve_dynamic_form_update_result,
} from "./dynamicEntityFormSubmission";
import { validate_form_data_against_metadata } from "./dynamicFormLogic";

export type DynamicEntityFormSubmitResult = {
  validation_errors: Record<string, string>;
  save_error_message: string;
  saved_entity?: BaseEntity;
  transfer_declined: boolean;
};

export type DynamicEntityFormSubmitCommand = {
  entity_type: string;
  entity_metadata?: EntityMetadata;
  form_data: Record<string, any>;
  is_edit_mode: boolean;
  entity_data?: Partial<BaseEntity>;
  crud_handlers?: EntityCrudHandlers;
  permission_denied: boolean;
  player_team_membership_use_cases: PlayerTeamMembershipUseCasesPort;
};

export async function submit_dynamic_entity_form(
  command: DynamicEntityFormSubmitCommand,
): Promise<DynamicEntityFormSubmitResult> {
  if (!command.entity_metadata || command.permission_denied) {
    return empty_submit_result();
  }

  const validation_result = validate_form_data_against_metadata(
    command.form_data,
    command.entity_metadata,
    command.is_edit_mode,
    command.entity_type,
  );
  if (!validation_result.success) {
    return {
      ...empty_submit_result(),
      validation_errors: validation_result.error,
    };
  }

  const should_apply_transfer_update =
    check_if_player_transfer_is_being_approved(
      command.entity_type,
      command.is_edit_mode,
      command.entity_data,
      command.form_data,
    );
  const save_result =
    command.is_edit_mode && command.entity_data?.id
      ? await resolve_dynamic_form_update_result(
          command.entity_type,
          command.crud_handlers,
          command.entity_data.id,
          command.form_data,
        )
      : await resolve_dynamic_form_create_result(
          command.entity_type,
          command.crud_handlers,
          command.form_data,
        );

  if (!save_result.success) {
    return {
      ...empty_submit_result(),
      save_error_message: save_result.error || "Unknown error occurred",
    };
  }

  if (should_apply_transfer_update) {
    const transfer_result =
      await execute_dynamic_form_transfer_membership_change(
        save_result.data,
        command.player_team_membership_use_cases,
      );
    if (!transfer_result.success) {
      return {
        ...empty_submit_result(),
        save_error_message: transfer_result.error,
      };
    }
  }

  return {
    validation_errors: {},
    save_error_message: "",
    saved_entity: save_result.data,
    transfer_declined: is_transfer_entity_and_status_just_changed_to_declined(
      command.entity_type,
      command.is_edit_mode,
      command.entity_data,
      command.form_data,
    ),
  };
}

function empty_submit_result(): DynamicEntityFormSubmitResult {
  return {
    validation_errors: {},
    save_error_message: "",
    transfer_declined: false,
  };
}
