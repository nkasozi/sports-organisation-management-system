import {
  create_dynamic_entity_list_display_actions,
  type DynamicEntityListViewCommand,
} from "$lib/presentation/logic/dynamicEntityListControllerRuntimeDisplay";
import { create_dynamic_entity_list_selection_actions } from "$lib/presentation/logic/dynamicEntityListControllerRuntimeSelection";

type DynamicEntityListViewActions = ReturnType<
  typeof create_dynamic_entity_list_display_actions
> &
  ReturnType<typeof create_dynamic_entity_list_selection_actions>;

export function create_dynamic_entity_list_controller_view_actions(
  command: DynamicEntityListViewCommand,
): DynamicEntityListViewActions {
  return {
    ...create_dynamic_entity_list_selection_actions(command),
    ...create_dynamic_entity_list_display_actions(command),
  };
}
