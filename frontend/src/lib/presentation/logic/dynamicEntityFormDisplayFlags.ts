import type { EntityMetadata } from "../../core/entities/BaseEntity";
import {
  build_form_title,
  format_entity_display_name,
} from "./dynamicFormLogic";

const TRANSFER_HISTORY_ENTITY_TYPE = "playerteamtransferhistory";

interface DynamicEntityFormDisplayFlagsInput {
  entity_type: string;
  is_edit_mode: boolean;
  show_fake_data_button: boolean;
  is_signed_in: boolean;
  is_fake_data_generation_enabled: boolean;
}

interface DynamicEntityFormDisplayFlags {
  can_show_fake_data_button: boolean;
  show_transfer_notice: boolean;
}

export function build_dynamic_entity_form_display_flags(
  input: DynamicEntityFormDisplayFlagsInput,
): DynamicEntityFormDisplayFlags {
  return {
    can_show_fake_data_button:
      input.show_fake_data_button &&
      !input.is_edit_mode &&
      !input.is_signed_in &&
      input.is_fake_data_generation_enabled,
    show_transfer_notice:
      input.entity_type.toLowerCase() === TRANSFER_HISTORY_ENTITY_TYPE &&
      !input.is_edit_mode,
  };
}

export function build_dynamic_entity_form_title(
  entity_type: string,
  entity_metadata: EntityMetadata | undefined,
  is_edit_mode: boolean,
): string {
  return build_form_title(
    entity_metadata?.display_name || format_entity_display_name(entity_type),
    is_edit_mode,
  );
}
