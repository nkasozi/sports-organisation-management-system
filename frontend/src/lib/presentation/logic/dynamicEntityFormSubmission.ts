import type { PlayerTeamMembershipUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/PlayerTeamMembershipUseCasesPort";
import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";
import {
  apply_player_transfer_membership_change,
  type TransferApprovalDetails,
} from "$lib/presentation/logic/playerTransferApprovalLogic";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";

export async function resolve_dynamic_form_create_result(
  entity_type: string,
  crud_handlers: EntityCrudHandlers | null,
  data: Record<string, unknown>,
): Promise<Result<BaseEntity, string>> {
  if (crud_handlers?.create) {
    return crud_handlers.create(data);
  }

  const use_cases_result = get_use_cases_for_entity_type(
    entity_type.toLowerCase(),
  );
  if (!use_cases_result.success) {
    return create_failure_result(`No handler found for "${entity_type}"`);
  }
  if (typeof use_cases_result.data.create !== "function") {
    return create_failure_result(
      `Create is not supported for "${entity_type}"`,
    );
  }
  return use_cases_result.data.create(data);
}

export async function resolve_dynamic_form_update_result(
  entity_type: string,
  crud_handlers: EntityCrudHandlers | null,
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
    return create_failure_result(`No handler found for "${entity_type}"`);
  }
  if (typeof use_cases_result.data.update !== "function") {
    return create_failure_result(
      `Update is not supported for "${entity_type}"`,
    );
  }
  return use_cases_result.data.update(id, data);
}

export function check_if_player_transfer_is_being_approved(
  entity_type: string,
  is_edit_mode: boolean,
  entity_data: Partial<BaseEntity> | null,
  form_data: Record<string, unknown>,
): boolean {
  return (
    entity_type.toLowerCase() === "playerteamtransferhistory" &&
    is_edit_mode &&
    entity_data?.["status" as keyof BaseEntity] !== "approved" &&
    form_data["status"] === "approved"
  );
}

export function is_transfer_entity_and_status_just_changed_to_declined(
  entity_type: string,
  is_edit_mode: boolean,
  entity_data: Partial<BaseEntity> | null,
  form_data: Record<string, unknown>,
): boolean {
  return (
    entity_type.toLowerCase() === "playerteamtransferhistory" &&
    is_edit_mode &&
    entity_data?.["status" as keyof BaseEntity] !== "declined" &&
    form_data["status"] === "declined"
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
