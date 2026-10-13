import type { BaseEntity, EntityMetadata } from "$lib/core/entities/BaseEntity";
import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { get_use_cases_for_entity_type } from "$lib/infrastructure/registry/entityUseCasesRegistry";
import {
  type DynamicEntityListResult,
  get_dynamic_entity_list_items,
} from "$lib/presentation/logic/dynamicEntityListFilterOptions";
import {
  build_dynamic_entity_list_access_denied_message,
  DYNAMIC_ENTITY_LIST_EVENT,
  DYNAMIC_ENTITY_LIST_MESSAGE,
} from "$lib/presentation/logic/dynamicEntityListMessages";
import { normalize_dynamic_form_entity_type } from "$lib/presentation/logic/dynamicFormConstants";
import {
  apply_id_filter_to_entities,
  build_entity_authorization_filter,
  build_filter_from_sub_entity_config,
  extract_error_message_from_result,
  merge_entity_list_filters,
} from "$lib/presentation/logic/dynamicListLogic";
import type {
  ListAuthorizationMetadataState,
  ListAuthorizationProfileState,
} from "$lib/presentation/logic/listAuthorizationFilterLogic";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

export { load_dynamic_entity_list_filter_options } from "$lib/presentation/logic/dynamicEntityListFilterOptions";

const AUTH_FILTER_PROFILE_MISSING_STATUS =
  "profile_missing" as const satisfies ReturnType<
    typeof build_entity_authorization_filter
  >["status"];

interface DynamicEntityListCommand {
  crud_handlers?: EntityCrudHandlers;
  current_profile_state: ListAuthorizationProfileState;
  display_name: string;
  entity_metadata?: EntityMetadata;
  entity_type: string;
  raw_token: string;
  sub_entity_filter?: SubEntityFilter;
}

function build_list_authorization_metadata_state(
  entity_metadata: EntityMetadata,
): ListAuthorizationMetadataState {
  return { status: PRESENCE_STATUS.PRESENT, entity_metadata };
}

function get_dynamic_entity_list_error(
  result: DynamicEntityListResult,
): string {
  return (
    extract_error_message_from_result(result) ||
    DYNAMIC_ENTITY_LIST_MESSAGE.LOAD_FAILED
  );
}

type DynamicEntityListLoadResult = {
  auth_profile_missing: boolean;
  entities: BaseEntity[];
  error_message: string;
};

type DynamicEntityListFilter = ReturnType<typeof merge_entity_list_filters>;

function build_list_load_failure(
  error_message: string,
): DynamicEntityListLoadResult {
  return { auth_profile_missing: false, entities: [], error_message };
}

function build_list_load_result(
  list_result: DynamicEntityListResult,
  filter: DynamicEntityListFilter,
): DynamicEntityListLoadResult {
  if (!list_result.success) {
    const error_message = get_dynamic_entity_list_error(list_result);
    console.error("[DynamicEntityList] Failed to load records", {
      event: DYNAMIC_ENTITY_LIST_EVENT.LOAD_FAILED,
      error: error_message,
    });
    return build_list_load_failure(error_message);
  }
  return {
    auth_profile_missing: false,
    entities: apply_id_filter_to_entities(
      get_dynamic_entity_list_items(list_result),
      filter,
    ),
    error_message: "",
  };
}

async function is_dynamic_entity_list_read_denied(
  command: DynamicEntityListCommand,
): Promise<boolean> {
  if (!command.raw_token) return false;
  const authorization_check =
    await get_authorization_adapter().check_entity_authorized(
      command.raw_token,
      normalize_dynamic_form_entity_type(command.entity_type),
      "read",
    );
  return authorization_check.success && !authorization_check.data.is_authorized;
}

async function fetch_dynamic_entity_list_records(
  command: DynamicEntityListCommand,
  filter: DynamicEntityListFilter,
): Promise<DynamicEntityListLoadResult> {
  if (command.crud_handlers?.list) {
    const custom_list_result = await command.crud_handlers.list(filter, {
      page_size: 1000,
    });
    return build_list_load_result(
      custom_list_result as DynamicEntityListResult,
      filter,
    );
  }
  const use_cases_result = get_use_cases_for_entity_type(command.entity_type);
  if (!use_cases_result.success) {
    console.error("[DynamicEntityList] No use cases for entity type", {
      event: DYNAMIC_ENTITY_LIST_EVENT.USE_CASES_MISSING,
      entity_type: command.entity_type,
      error: use_cases_result.error,
    });
    return build_list_load_failure(
      DYNAMIC_ENTITY_LIST_MESSAGE.LIST_UNAVAILABLE,
    );
  }
  const default_list_result = await use_cases_result.data.list(filter, {
    page_size: 1000,
  });
  return build_list_load_result(
    default_list_result as DynamicEntityListResult,
    filter,
  );
}

export async function load_dynamic_entity_list_entities(
  command: DynamicEntityListCommand,
): Promise<DynamicEntityListLoadResult> {
  if (!command.entity_metadata) {
    console.error("[DynamicEntityList] No metadata for entity type", {
      event: DYNAMIC_ENTITY_LIST_EVENT.METADATA_MISSING,
      entity_type: command.entity_type,
    });
    return build_list_load_failure(
      DYNAMIC_ENTITY_LIST_MESSAGE.LIST_UNAVAILABLE,
    );
  }
  const auth_filter_result = build_entity_authorization_filter(
    command.current_profile_state,
    build_list_authorization_metadata_state(command.entity_metadata),
    command.entity_type,
  );
  if (auth_filter_result.status === AUTH_FILTER_PROFILE_MISSING_STATUS) {
    return {
      auth_profile_missing: true,
      entities: [],
      error_message: DYNAMIC_ENTITY_LIST_MESSAGE.PROFILE_MISSING,
    };
  }
  if (await is_dynamic_entity_list_read_denied(command)) {
    return build_list_load_failure(
      build_dynamic_entity_list_access_denied_message(command.display_name),
    );
  }
  const filter = merge_entity_list_filters(
    build_filter_from_sub_entity_config(command.sub_entity_filter),
    auth_filter_result.filter_state,
  );
  return fetch_dynamic_entity_list_records(command, filter);
}
