import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { Sport } from "../../core/entities/Sport";
import type { GameEventType } from "../../core/entities/GameEventType";

export function register_sport_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("sport", {
    entity_name: "sport",
    display_name: "Sport",
    fields: [
      {
        field_name: "name" satisfies keyof Sport,
        display_name: "Sport Name",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "code" satisfies keyof Sport,
        display_name: "Sport Code",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "description" satisfies keyof Sport,
        display_name: "Description",
        field_type: "string",
        is_required: false,
        is_read_only: false,
      },
      {
        field_name: "icon_url" satisfies keyof Sport,
        display_name: "Icon (Emoji)",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        placeholder: "e.g., ⚽ 🏀 🏈",
      },
      {
        field_name: "standard_game_duration_minutes" satisfies keyof Sport,
        display_name: "Game Duration (Minutes)",
        field_type: "number",
        is_required: true,
        is_read_only: false,
      },
      {
        field_name: "max_players_on_field" satisfies keyof Sport,
        display_name: "Max Players on Field",
        field_type: "number",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "min_players_on_field" satisfies keyof Sport,
        display_name: "Min Players on Field",
        field_type: "number",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "max_squad_size" satisfies keyof Sport,
        display_name: "Max Squad Size",
        field_type: "number",
        is_required: true,
        is_read_only: false,
      },
      {
        field_name: "status" satisfies keyof Sport,
        display_name: "Status",
        field_type: "enum",
        enum_values: ["active", "inactive", "archived"],
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
    ],
  });
  return metadata_map;
}

export function register_game_event_type_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("gameeventtype", {
    entity_name: "gameeventtype",
    display_name: "Game Event Type",
    fields: [
      {
        field_name: "name" satisfies keyof GameEventType,
        display_name: "Event Name",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "code" satisfies keyof GameEventType,
        display_name: "Code",
        field_type: "string",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "description" satisfies keyof GameEventType,
        display_name: "Description",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "icon" satisfies keyof GameEventType,
        display_name: "Icon",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "color" satisfies keyof GameEventType,
        display_name: "Color",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "category" satisfies keyof GameEventType,
        display_name: "Category",
        field_type: "enum",
        enum_values: ["score", "discipline"],
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "display_order" satisfies keyof GameEventType,
        display_name: "Display Order",
        field_type: "number",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "sport_id" satisfies keyof GameEventType,
        display_name: "Sport",
        field_type: "foreign_key",
        foreign_key_entity: "sport",
        is_required: false,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "status" satisfies keyof GameEventType,
        display_name: "Status",
        field_type: "enum",
        enum_values: ["active", "inactive", "archived"],
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "organization_id" satisfies keyof GameEventType,
        display_name: "Organization",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        foreign_key_entity: "organization",
        show_in_list: true,
      },
    ],
  });
  return metadata_map;
}
