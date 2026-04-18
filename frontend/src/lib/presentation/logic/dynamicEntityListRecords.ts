import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "$lib/core/entities/BaseEntity";
import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { get_use_cases_for_entity_type } from "$lib/infrastructure/registry/entityUseCasesRegistry";
import {
  apply_id_filter_to_entities,
  build_entity_authorization_filter,
  build_filter_from_sub_entity_config,
  extract_error_message_from_result,
  extract_items_from_result_data,
  merge_entity_list_filters,
} from "$lib/presentation/logic/dynamicListLogic";
import type {
  ListAuthorizationMetadataState,
  ListAuthorizationProfileState,
} from "$lib/presentation/logic/listAuthorizationFilterLogic";

interface DynamicEntityListResult {
  success: boolean;
  data?: BaseEntity[] | { items: BaseEntity[]; total_count: number };
  error?: string;
  error_message?: string;
}

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
  return { status: "present", entity_metadata };
}

function get_dynamic_entity_list_items(
  result: DynamicEntityListResult,
): BaseEntity[] {
  return result.success ? extract_items_from_result_data(result.data) : [];
}

function get_dynamic_entity_list_error(
  result: DynamicEntityListResult,
): string {
  return extract_error_message_from_result(result) || "Unknown error";
}

export async function load_dynamic_entity_list_filter_options(
  fields: FieldMetadata[],
): Promise<Record<string, BaseEntity[]>> {
  const next_options: Record<string, BaseEntity[]> = {};
  for (const field of fields) {
    if (field.field_type !== "foreign_key" || !field.foreign_key_entity) {
      continue;
    }
    const use_cases_result = get_use_cases_for_entity_type(
      field.foreign_key_entity,
    );
    if (!use_cases_result.success) {
      next_options[field.field_name] = [];
      continue;
    }
    const result = await use_cases_result.data.list(
      {},
      {
        page_size: 100,
      },
    );
    next_options[field.field_name] = get_dynamic_entity_list_items(
      result as DynamicEntityListResult,
    );
  }
  return next_options;
}

export async function load_dynamic_entity_list_entities(
  command: DynamicEntityListCommand,
): Promise<{
  auth_profile_missing: boolean;
  entities: BaseEntity[];
  error_message: string;
}> {
  if (!command.entity_metadata) {
    return {
      auth_profile_missing: false,
      entities: [],
      error_message: `No metadata found for entity type: ${command.entity_type}`,
    };
  }
  const auth_filter_result = build_entity_authorization_filter(
    command.current_profile_state,
    build_list_authorization_metadata_state(command.entity_metadata),
    command.entity_type,
  );
  if (auth_filter_result.status === "profile_missing") {
    return {
      auth_profile_missing: true,
      entities: [],
      error_message:
        "Unable to load data: No user profile is set. Please select a user profile to continue.",
    };
  }
  const normalized_type = command.entity_type
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  if (command.raw_token) {
    const authorization_check =
      await get_authorization_adapter().check_entity_authorized(
        command.raw_token,
        normalized_type,
        "read",
      );
    if (
      authorization_check.success &&
      !authorization_check.data.is_authorized
    ) {
      return {
        auth_profile_missing: false,
        entities: [],
        error_message: `Access denied: Your role does not have permission to view ${command.display_name} data.`,
      };
    }
  }
  const filter = merge_entity_list_filters(
    build_filter_from_sub_entity_config(command.sub_entity_filter),
    auth_filter_result.filter_state,
  );
  if (command.crud_handlers?.list) {
    const custom_list_result = await command.crud_handlers.list(filter, {
      page_size: 1000,
    });
    return custom_list_result.success
      ? {
          auth_profile_missing: false,
          entities: apply_id_filter_to_entities(
            get_dynamic_entity_list_items(
              custom_list_result as DynamicEntityListResult,
            ),
            filter,
          ),
          error_message: "",
        }
      : {
          auth_profile_missing: false,
          entities: [],
          error_message: get_dynamic_entity_list_error(
            custom_list_result as DynamicEntityListResult,
          ),
        };
  }
  const use_cases_result = get_use_cases_for_entity_type(command.entity_type);
  if (!use_cases_result.success) {
    return {
      auth_profile_missing: false,
      entities: [],
      error_message: `No use cases found for entity type: ${command.entity_type}`,
    };
  }
  const default_list_result = await use_cases_result.data.list(filter, {
    page_size: 1000,
  });
  return default_list_result.success
    ? {
        auth_profile_missing: false,
        entities: apply_id_filter_to_entities(
          get_dynamic_entity_list_items(
            default_list_result as DynamicEntityListResult,
          ),
          filter,
        ),
        error_message: "",
      }
    : {
        auth_profile_missing: false,
        entities: [],
        error_message: get_dynamic_entity_list_error(
          default_list_result as DynamicEntityListResult,
        ),
      };
}
