import type { BaseEntity, EntityMetadata } from "$lib/core/entities/BaseEntity";
import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";

import type { DYNAMIC_ENTITY_FORM_SUBMIT_STATUS } from "./dynamicEntityFormConstants";
import type { TransferResolutionUseCases } from "./dynamicEntityFormTransferResolution";
import type { DynamicFormData } from "./dynamicFormConstants";

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
  player_team_transfer_use_cases: TransferResolutionUseCases;
};
