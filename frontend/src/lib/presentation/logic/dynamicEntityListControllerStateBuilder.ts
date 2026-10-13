import type {
  DynamicEntityListControllerOptions,
  DynamicEntityListViewState,
} from "$lib/presentation/logic/dynamicEntityListControllerTypes";
import { get_dynamic_entity_list_metadata } from "$lib/presentation/logic/dynamicEntityListData";
import {
  build_collection_view_fields,
  build_option_derived_view_fields,
  build_pagination_view_fields,
  build_ui_flag_view_fields,
} from "$lib/presentation/logic/dynamicEntityListViewStateSections";

export function build_dynamic_entity_list_view_state(
  options: DynamicEntityListControllerOptions,
  current_state: Partial<DynamicEntityListViewState>,
): DynamicEntityListViewState {
  const entity_metadata_result = get_dynamic_entity_list_metadata(
    options.entity_type,
  );
  const entity_metadata = entity_metadata_result || undefined;
  const collection_fields = build_collection_view_fields(
    options,
    current_state,
    entity_metadata,
  );
  return {
    ...build_option_derived_view_fields(options, entity_metadata),
    ...build_ui_flag_view_fields(current_state),
    ...collection_fields,
    ...build_pagination_view_fields(
      current_state,
      collection_fields.filtered_entities,
    ),
  };
}
