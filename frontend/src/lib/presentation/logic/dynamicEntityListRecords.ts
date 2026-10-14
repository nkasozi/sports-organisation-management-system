import type { BaseEntity, EntityMetadata } from "$lib/core/entities/BaseEntity";
import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
import { get_use_cases_for_entity_type } from "$lib/infrastructure/registry/entityUseCasesRegistry";
import {
  type DynamicEntityListResult,
  get_dynamic_entity_list_items,
} from "$lib/presentation/logic/dynamicEntityListFilterOptions";
import {
  build_dynamic_entity_list_access_denied_message,
  build_dynamic_entity_list_access_unverified_message,
  DYNAMIC_ENTITY_LIST_EVENT,
  DYNAMIC_ENTITY_LIST_MESSAGE,
} from "$lib/presentation/logic/dynamicEntityListMessages";
import {
  evaluate_dynamic_entity_list_read_access,
  LIST_READ_ACCESS_STATUS,
} from "$lib/presentation/logic/dynamicEntityListReadAccess";
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

async function describe_dynamic_entity_list_read_denial(
  command: DynamicEntityListCommand,
): Promise<Option<string>> {
  const read_access = await evaluate_dynamic_entity_list_read_access(
    command.raw_token,
    command.entity_type,
  );
  switch (read_access) {
    case LIST_READ_ACCESS_STATUS.ALLOWED:
      return create_none_option<string>();
    case LIST_READ_ACCESS_STATUS.DENIED:
      return create_some_option(
        build_dynamic_entity_list_access_denied_message(command.display_name),
      );
    case LIST_READ_ACCESS_STATUS.UNVERIFIED:
      return create_some_option(
        build_dynamic_entity_list_access_unverified_message(
          command.display_name,
        ),
      );
  }
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
  const read_denial = await describe_dynamic_entity_list_read_denial(command);
  if (read_denial.status === OptionStatus.SOME) {
    return build_list_load_failure(read_denial.value);
  }
  const filter = merge_entity_list_filters(
    build_filter_from_sub_entity_config(command.sub_entity_filter),
    auth_filter_result.filter_state,
  );
  return fetch_dynamic_entity_list_records(command, filter);
}
