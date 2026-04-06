import type { FieldMetadata, BaseEntity } from "../../core/entities/BaseEntity";
import { build_entity_display_label } from "./entityDisplayFormatter";

export type ForeignKeySelectOption = {
  value: string;
  label: string;
  color_swatch?: string;
  group?: string;
};

export function is_jersey_color_field(field: FieldMetadata): boolean {
  return field.foreign_key_entity?.toLowerCase() === "jerseycolor";
}

function is_fixture_field(field: FieldMetadata): boolean {
  return field.foreign_key_entity?.toLowerCase() === "fixture";
}

function resolve_competition_name_for_fixture(
  fixture_record: Record<string, unknown>,
  competition_entities: BaseEntity[],
): string {
  const competition_id = fixture_record["competition_id"];
  if (typeof competition_id !== "string") return "";
  const matched_competition = competition_entities.find(
    (entity) => entity.id === competition_id,
  );
  if (!matched_competition) return "";
  const record = matched_competition as unknown as Record<string, unknown>;
  const competition_name = record["name"];
  return typeof competition_name === "string" ? competition_name : "";
}

function build_single_option(
  entity: BaseEntity,
  is_jersey_field: boolean,
  is_fixture: boolean,
  competition_entities: BaseEntity[],
): ForeignKeySelectOption | null {
  const entity_id = String((entity as BaseEntity).id ?? "").trim();
  if (entity_id.length === 0) return null;

  let competition_name = "";
  if (is_fixture) {
    const fixture_record = entity as unknown as Record<string, unknown>;
    competition_name = resolve_competition_name_for_fixture(
      fixture_record,
      competition_entities,
    );
    if (competition_name) {
      fixture_record["competition_name"] = competition_name;
    }
  }

  const option: ForeignKeySelectOption = {
    value: entity_id,
    label: String(build_entity_display_label(entity)),
  };

  if (is_jersey_field) {
    const jersey = entity as unknown as { main_color?: string };
    if (jersey.main_color) option.color_swatch = jersey.main_color;
  }

  if (is_fixture && competition_name) {
    option.group = competition_name;
  }

  return option;
}

export function build_foreign_key_select_options(
  field: FieldMetadata,
  options_map: Record<string, BaseEntity[]>,
): ForeignKeySelectOption[] {
  const entities = options_map[field.field_name] || [];
  const is_jersey_field = is_jersey_color_field(field);
  const is_fixture = is_fixture_field(field);
  const competition_entities = is_fixture
    ? options_map["competition_id"] || []
    : [];
  return entities
    .map((entity) =>
      build_single_option(
        entity,
        is_jersey_field,
        is_fixture,
        competition_entities,
      ),
    )
    .filter((opt): opt is ForeignKeySelectOption => Boolean(opt));
}
