import { type Writable, writable } from "svelte/store";

import { are_dynamic_entity_list_controller_options_equal } from "$lib/presentation/logic/dynamicEntityListControllerOptionsEquality";
import { create_dynamic_entity_list_controller_crud_actions } from "$lib/presentation/logic/dynamicEntityListControllerRuntimeCrud";
import {
  type DynamicEntityListRuntimeContext,
  initialize_dynamic_entity_list_runtime,
  load_dynamic_entity_list_for_display,
} from "$lib/presentation/logic/dynamicEntityListControllerRuntimeLoading";
import { create_dynamic_entity_list_controller_view_actions } from "$lib/presentation/logic/dynamicEntityListControllerRuntimeView";
import { build_dynamic_entity_list_view_state } from "$lib/presentation/logic/dynamicEntityListControllerStateBuilder";
import type {
  DynamicEntityListControllerOptions,
  DynamicEntityListViewState,
} from "$lib/presentation/logic/dynamicEntityListControllerTypes";

type DynamicEntityListControllerRuntime = ReturnType<
  typeof create_dynamic_entity_list_controller_crud_actions
> &
  ReturnType<typeof create_dynamic_entity_list_controller_view_actions> & {
    initialize: () => Promise<void>;
    load_all_entities_for_display: () => Promise<void>;
    state_store: Writable<DynamicEntityListViewState>;
    update_options: (
      next_options: DynamicEntityListControllerOptions,
    ) => boolean;
  };

function create_options_updater(
  get_current_options: () => DynamicEntityListControllerOptions,
  set_current_options: (
    next_options: DynamicEntityListControllerOptions,
  ) => void,
  state_store: Writable<DynamicEntityListViewState>,
): (next_options: DynamicEntityListControllerOptions) => boolean {
  return (next_options: DynamicEntityListControllerOptions): boolean => {
    if (
      are_dynamic_entity_list_controller_options_equal(
        get_current_options(),
        next_options,
      )
    )
      return false;
    set_current_options(next_options);
    state_store.update((state) =>
      build_dynamic_entity_list_view_state(next_options, state),
    );
    return true;
  };
}

export function create_dynamic_entity_list_controller_runtime(
  initial_options: DynamicEntityListControllerOptions,
): DynamicEntityListControllerRuntime {
  let current_options = initial_options;
  const state_store = writable(
    build_dynamic_entity_list_view_state(current_options, {}),
  );
  const context: DynamicEntityListRuntimeContext = {
    get_options: () => current_options,
    set_state: (updates: Partial<DynamicEntityListViewState>): void =>
      state_store.update((state) =>
        build_dynamic_entity_list_view_state(current_options, {
          ...state,
          ...updates,
        }),
      ),
    state_store,
  };
  const load_all_entities_for_display = (): Promise<void> =>
    load_dynamic_entity_list_for_display(context);
  return {
    initialize: (): Promise<void> =>
      initialize_dynamic_entity_list_runtime(context),
    load_all_entities_for_display,
    state_store,
    update_options: create_options_updater(
      () => current_options,
      (next_options) => {
        current_options = next_options;
      },
      state_store,
    ),
    ...create_dynamic_entity_list_controller_crud_actions({
      ...context,
      load_all_entities_for_display,
    }),
    ...create_dynamic_entity_list_controller_view_actions(context),
  };
}
