import { get } from "svelte/store";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import {
  get_dynamic_entity_list_selected_entities,
  get_dynamic_entity_list_toggle_all_selection,
  get_dynamic_entity_list_toggle_single_selection,
} from "$lib/presentation/logic/dynamicEntityListControllerInteractions";
import type { DynamicEntityListViewCommand } from "$lib/presentation/logic/dynamicEntityListControllerRuntimeDisplay";

type DynamicEntityListSelectionActions = {
  clear_all_selections: () => void;
  get_current_selected_entities: () => BaseEntity[];
  get_selected_entity_count: () => number;
  toggle_all_entity_selection: () => void;
  toggle_single_selection: (entity_id: string) => void;
};

function apply_dynamic_entity_list_selection(
  command: DynamicEntityListViewCommand,
  entities: BaseEntity[],
  selected_entity_ids: Set<string>,
): void {
  command.set_state({ selected_entity_ids });
  command
    .get_options()
    .on_selection_changed?.(
      get_dynamic_entity_list_selected_entities(entities, selected_entity_ids),
    );
}

function toggle_all_dynamic_entity_list_selection(
  command: DynamicEntityListViewCommand,
): void {
  const current_state = get(command.state_store);
  apply_dynamic_entity_list_selection(
    command,
    current_state.entities,
    get_dynamic_entity_list_toggle_all_selection(
      current_state.filtered_entities,
      current_state.all_selected,
    ),
  );
}

function toggle_single_dynamic_entity_list_selection(
  command: DynamicEntityListViewCommand,
  entity_id: string,
): void {
  const current_state = get(command.state_store);
  apply_dynamic_entity_list_selection(
    command,
    current_state.entities,
    get_dynamic_entity_list_toggle_single_selection(
      current_state.selected_entity_ids,
      entity_id,
    ),
  );
}

export function create_dynamic_entity_list_selection_actions(
  command: DynamicEntityListViewCommand,
): DynamicEntityListSelectionActions {
  return {
    clear_all_selections: (): void => {
      command.set_state({ selected_entity_ids: new Set<string>() });
      command.get_options().on_selection_changed?.([]);
    },
    get_current_selected_entities: (): BaseEntity[] =>
      get_dynamic_entity_list_selected_entities(
        get(command.state_store).entities,
        get(command.state_store).selected_entity_ids,
      ),
    get_selected_entity_count: (): number =>
      get(command.state_store).selected_entity_ids.size,
    toggle_all_entity_selection: (): void =>
      toggle_all_dynamic_entity_list_selection(command),
    toggle_single_selection: (entity_id: string): void =>
      toggle_single_dynamic_entity_list_selection(command, entity_id),
  };
}
