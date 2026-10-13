import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import { get_display_value_for_entity_field } from "./listDisplayValueLogic";
import { PRESENCE_STATUS } from "./presenceStatus";

type CsvMetadataState =
  | { status: typeof PRESENCE_STATUS.MISSING }
  | { status: typeof PRESENCE_STATUS.PRESENT; metadata: EntityMetadata };

const CSV_FORMULA_TRIGGER_CHARACTERS: readonly string[] = [
  "=",
  "+",
  "-",
  "@",
  "\t",
  "\r",
];
const CSV_FORMULA_NEUTRALISING_PREFIX = "'";

function neutralise_csv_formula_value(value: string): string {
  const starts_with_formula_trigger = CSV_FORMULA_TRIGGER_CHARACTERS.some(
    (trigger_character: string) => value.startsWith(trigger_character),
  );
  return starts_with_formula_trigger
    ? `${CSV_FORMULA_NEUTRALISING_PREFIX}${value}`
    : value;
}

function escape_csv_cell_value(value: string): string {
  const neutralised_value = neutralise_csv_formula_value(value);
  return `"${neutralised_value.replace(/"/g, '""')}"`;
}

export function create_missing_csv_metadata_state(): CsvMetadataState {
  return { status: PRESENCE_STATUS.MISSING };
}

export function create_present_csv_metadata_state(
  metadata: EntityMetadata,
): CsvMetadataState {
  return { status: PRESENCE_STATUS.PRESENT, metadata };
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
      metadata_state.status === PRESENCE_STATUS.PRESENT
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
      return escape_csv_cell_value(value);
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
