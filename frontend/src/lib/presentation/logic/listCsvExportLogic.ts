import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import { get_display_value_for_entity_field } from "./listDisplayValueLogic";

type CsvMetadataState =
  | { status: "missing" }
  | { status: "present"; metadata: EntityMetadata };

export function create_missing_csv_metadata_state(): CsvMetadataState {
  return { status: "missing" };
}

export function create_present_csv_metadata_state(
  metadata: EntityMetadata,
): CsvMetadataState {
  return { status: "present", metadata };
}

export function build_csv_content(
  entities: BaseEntity[],
  visible_column_list: string[],
  metadata_state: CsvMetadataState,
  foreign_key_options: Record<string, BaseEntity[]>,
): string {
  if (!entities || entities.length === 0) return "";
  if (!visible_column_list || visible_column_list.length === 0) return "";

  const headers = visible_column_list.map((field_name) => {
    const field =
      metadata_state.status === "present"
        ? metadata_state.metadata.fields.find(
            (f: FieldMetadata) => f.field_name === field_name,
          )
        : void 0;
    return field?.display_name || field_name;
  });

  const csv_rows = [headers.join(",")];
  entities.forEach((entity) => {
    const row = visible_column_list.map((field_name) => {
      const value = get_display_value_for_entity_field(
        entity,
        field_name,
        foreign_key_options,
      );
      return `"${value.replace(/"/g, '""')}"`;
    });
    csv_rows.push(row.join(","));
  });
  return csv_rows.join("\n");
}

export function build_csv_filename(
  entity_type: string,
  export_date: Date,
): string {
  const date_string = export_date.toISOString().split("T")[0];
  return `${entity_type}_export_${date_string}.csv`;
}
