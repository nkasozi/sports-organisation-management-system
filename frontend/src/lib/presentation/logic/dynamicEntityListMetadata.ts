import type {
  EntityMetadata,
  FieldMetadata,
} from "$lib/core/entities/BaseEntity";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
import { entityMetadataRegistry } from "$lib/infrastructure/registry/EntityMetadataRegistry";
import { load_column_preferences } from "$lib/presentation/logic/columnPreferences";
import { build_default_visible_column_names } from "$lib/presentation/logic/dynamicListLogic";

export function get_dynamic_entity_list_metadata(
  entity_type: string,
): EntityMetadata | false {
  return entityMetadataRegistry.get_entity_metadata(entity_type.toLowerCase());
}

export async function load_dynamic_entity_list_columns(command: {
  entity_metadata: EntityMetadata;
  entity_type: string;
  sub_entity_filter: SubEntityFilter | undefined;
}): Promise<{
  columns_restored_from_cache: boolean;
  visible_columns: Set<string>;
}> {
  const available_field_names = command.entity_metadata.fields.map(
    (field: FieldMetadata) => field.field_name,
  );
  const cached_result = await load_column_preferences({
    entity_type: command.entity_type,
    sub_entity_filter: command.sub_entity_filter,
    available_field_names,
  });
  if (cached_result.restored) {
    return {
      columns_restored_from_cache: true,
      visible_columns: cached_result.columns,
    };
  }
  return {
    columns_restored_from_cache: false,
    visible_columns: new Set(
      build_default_visible_column_names(command.entity_metadata.fields, 5),
    ),
  };
}
