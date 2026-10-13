import type { BaseEntity, FieldMetadata } from "$lib/core/entities/BaseEntity";
import { get_use_cases_for_entity_type } from "$lib/infrastructure/registry/entityUseCasesRegistry";
import { DYNAMIC_ENTITY_LIST_EVENT } from "$lib/presentation/logic/dynamicEntityListMessages";
import { DYNAMIC_FORM_FIELD_TYPE } from "$lib/presentation/logic/dynamicFormConstants";
import { extract_items_from_result_data } from "$lib/presentation/logic/dynamicListLogic";

const FILTER_OPTIONS_PAGE_SIZE = 100;

export interface DynamicEntityListResult {
  success: boolean;
  data?: BaseEntity[] | { items: BaseEntity[]; total_count: number };
  error?: string;
  error_message?: string;
}

export function get_dynamic_entity_list_items(
  result: DynamicEntityListResult,
): BaseEntity[] {
  return result.success ? extract_items_from_result_data(result.data) : [];
}

export async function load_dynamic_entity_list_filter_options(
  fields: FieldMetadata[],
): Promise<Record<string, BaseEntity[]>> {
  const next_options: Record<string, BaseEntity[]> = {};
  for (const field of fields) {
    if (
      field.field_type !== DYNAMIC_FORM_FIELD_TYPE.FOREIGN_KEY ||
      !field.foreign_key_entity
    ) {
      continue;
    }
    const use_cases_result = get_use_cases_for_entity_type(
      field.foreign_key_entity,
    );
    if (!use_cases_result.success) {
      console.warn("[DynamicEntityList] Filter options unavailable", {
        event: DYNAMIC_ENTITY_LIST_EVENT.FILTER_OPTIONS_UNAVAILABLE,
        field_name: field.field_name,
        foreign_key_entity: field.foreign_key_entity,
      });
      next_options[field.field_name] = [];
      continue;
    }
    const result = await use_cases_result.data.list(
      {},
      {
        page_size: FILTER_OPTIONS_PAGE_SIZE,
      },
    );
    next_options[field.field_name] = get_dynamic_entity_list_items(
      result as DynamicEntityListResult,
    );
  }
  return next_options;
}
