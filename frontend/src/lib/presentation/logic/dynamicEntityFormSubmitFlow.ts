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
  saved_entity: BaseEntity | null;
  transfer_declined: boolean;
};

export async function submit_dynamic_entity_form(
  entity_type: string,
  entity_metadata: EntityMetadata | null,
  form_data: Record<string, any>,
  is_edit_mode: boolean,
  entity_data: Partial<BaseEntity> | null,
  crud_handlers: EntityCrudHandlers | null,
  permission_denied: boolean,
  player_team_membership_use_cases: PlayerTeamMembershipUseCasesPort,
): Promise<DynamicEntityFormSubmitResult> {
  if (!entity_metadata || permission_denied) {
    return empty_submit_result();
  }

  const validation_result = validate_form_data_against_metadata(
    form_data,
    entity_metadata,
    is_edit_mode,
    entity_type,
  );
  if (!validation_result.success) {
    return {
      ...empty_submit_result(),
      validation_errors: validation_result.error,
    };
  }

  const should_apply_transfer_update =
    check_if_player_transfer_is_being_approved(
      entity_type,
      is_edit_mode,
      entity_data,
      form_data,
    );
  const save_result =
    is_edit_mode && entity_data?.id
      ? await resolve_dynamic_form_update_result(
          entity_type,
          crud_handlers,
          entity_data.id,
          form_data,
        )
      : await resolve_dynamic_form_create_result(
          entity_type,
          crud_handlers,
          form_data,
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
        player_team_membership_use_cases,
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
      entity_type,
      is_edit_mode,
      entity_data,
      form_data,
    ),
  };
}

function empty_submit_result(): DynamicEntityFormSubmitResult {
  return {
    validation_errors: {},
    save_error_message: "",
    saved_entity: null,
    transfer_declined: false,
  };
}
