import { get, type Writable } from "svelte/store";

import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
import type {
  DynamicEntityListControllerOptions,
  DynamicEntityListViewState,
} from "$lib/presentation/logic/dynamicEntityListControllerTypes";
import {
  load_dynamic_entity_list_columns,
  load_dynamic_entity_list_entities,
  load_dynamic_entity_list_filter_options,
} from "$lib/presentation/logic/dynamicEntityListData";
import type { ListAuthorizationProfileState } from "$lib/presentation/logic/listAuthorizationFilterLogic";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
import { auth_store } from "$lib/presentation/stores/auth";
import {
  type AuthState,
  normalize_auth_profile_state,
} from "$lib/presentation/stores/authTypes";

export type DynamicEntityListRuntimeContext = {
  get_options: () => DynamicEntityListControllerOptions;
  set_state: (updates: Partial<DynamicEntityListViewState>) => void;
  state_store: Writable<DynamicEntityListViewState>;
};

function build_list_profile_state(
  auth_state: Pick<AuthState, "current_profile">,
): ListAuthorizationProfileState {
  const normalized_profile_state = normalize_auth_profile_state(
    auth_state.current_profile,
  );
  return normalized_profile_state.status === PRESENCE_STATUS.PRESENT
    ? {
        status: PRESENCE_STATUS.PRESENT,
        profile:
          normalized_profile_state.profile as unknown as UserScopeProfile,
      }
    : { status: PRESENCE_STATUS.MISSING };
}

export async function load_dynamic_entity_list_for_display(
  context: DynamicEntityListRuntimeContext,
): Promise<void> {
  context.set_state({ error_message: "", is_loading: true });
  const current_state = get(context.state_store);
  const current_options = context.get_options();
  const auth_state = get(auth_store);
  const result = await load_dynamic_entity_list_entities({
    crud_handlers: current_options.crud_handlers,
    current_profile_state: build_list_profile_state(auth_state),
    display_name: current_state.display_name,
    entity_metadata: current_state.entity_metadata,
    entity_type: current_options.entity_type,
    raw_token:
      auth_state.current_token.status === PRESENCE_STATUS.PRESENT
        ? auth_state.current_token.token.raw_token
        : "",
    sub_entity_filter: current_options.sub_entity_filter,
  });
  context.set_state({
    current_page: 1,
    entities: result.entities,
    error_message: result.error_message,
    is_loading: false,
  });
  context.get_options().on_total_count_changed?.(result.entities.length);
}

export async function initialize_dynamic_entity_list_runtime(
  context: DynamicEntityListRuntimeContext,
): Promise<void> {
  const current_state = get(context.state_store);
  if (!current_state.entity_metadata) return;
  const column_state = await load_dynamic_entity_list_columns({
    entity_metadata: current_state.entity_metadata,
    entity_type: context.get_options().entity_type,
    sub_entity_filter: context.get_options().sub_entity_filter,
  });
  context.set_state({
    columns_restored_from_cache: column_state.columns_restored_from_cache,
    visible_columns: column_state.visible_columns,
  });
  const auth_result = await ensure_auth_profile();
  if (!auth_result.success) {
    context.set_state({ error_message: auth_result.error_message });
    return;
  }
  await load_dynamic_entity_list_for_display(context);
  context.set_state({
    foreign_key_options: await load_dynamic_entity_list_filter_options(
      current_state.entity_metadata.fields,
    ),
  });
}
