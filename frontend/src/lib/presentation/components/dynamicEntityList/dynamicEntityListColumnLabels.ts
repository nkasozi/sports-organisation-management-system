import type {
  EntityMetadata,
  FieldMetadata,
} from "$lib/core/entities/BaseEntity";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";

export type ColumnDisplayNames = Record<string, string>;

export function build_column_display_names(
  metadata_option: Option<EntityMetadata>,
): ColumnDisplayNames {
  switch (metadata_option.status) {
    case OptionStatus.SOME:
      return Object.fromEntries(
        metadata_option.value.fields.map((field: FieldMetadata) => [
          field.field_name,
          field.display_name,
        ]),
      );
    case OptionStatus.NONE:
      return {};
  }
}

export function resolve_column_display_name(
  column_display_names: ColumnDisplayNames,
  field_name: string,
): string {
  return column_display_names[field_name] || field_name;
}

export function to_metadata_option(
  boundary_metadata: EntityMetadata | undefined,
): Option<EntityMetadata> {
  return boundary_metadata
    ? create_some_option(boundary_metadata)
    : create_none_option();
}
