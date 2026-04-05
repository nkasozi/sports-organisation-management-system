import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { PlayerProfile } from "../../core/entities/PlayerProfile";
import { PROFILE_VISIBILITY_OPTIONS } from "../../core/entities/PlayerProfile";
import type { TeamProfile } from "../../core/entities/TeamProfile";
import { TEAM_PROFILE_VISIBILITY_OPTIONS } from "../../core/entities/TeamProfile";

export function register_player_profile_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("playerprofile", {
    entity_name: "playerprofile",
    display_name: "Player Profile",
    fields: [
      {
        field_name: "player_id" satisfies keyof PlayerProfile,
        display_name: "Player",
        field_type: "foreign_key",
        foreign_key_entity: "player",
        is_required: true,
        is_read_only: false,
        is_read_only_on_edit: true,
        show_in_list: true,
      },
      {
        field_name: "profile_summary" satisfies keyof PlayerProfile,
        display_name: "Profile Summary",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
        placeholder: "Write a brief bio or introduction about the player...",
      },
      {
        field_name: "visibility" satisfies keyof PlayerProfile,
        display_name: "Profile Visibility",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        enum_values: PROFILE_VISIBILITY_OPTIONS.map((o) => o.value),
      },
      {
        field_name: "profile_slug" satisfies keyof PlayerProfile,
        display_name: "Profile URL Slug",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
        placeholder: "Auto-generated from player name",
      },
      {
        field_name: "links",
        display_name: "Links & Media",
        field_type: "sub_entity",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
        sub_entity_config: {
          child_entity_type: "profilelink",
          foreign_key_field: "profile_id",
        },
      },
      {
        field_name: "status" satisfies keyof PlayerProfile,
        display_name: "Status",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: ["active", "inactive"],
        show_in_list: true,
      },
    ],
  });
  return metadata_map;
}

export function register_team_profile_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("teamprofile", {
    entity_name: "teamprofile",
    display_name: "Team Profile",
    fields: [
      {
        field_name: "team_id" satisfies keyof TeamProfile,
        display_name: "Team",
        field_type: "foreign_key",
        foreign_key_entity: "team",
        is_required: true,
        is_read_only: false,
        is_read_only_on_edit: true,
        show_in_list: true,
      },
      {
        field_name: "profile_summary" satisfies keyof TeamProfile,
        display_name: "Profile Summary",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
        placeholder: "Write a brief introduction about the team...",
      },
      {
        field_name: "visibility" satisfies keyof TeamProfile,
        display_name: "Profile Visibility",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        enum_options: TEAM_PROFILE_VISIBILITY_OPTIONS,
      },
      {
        field_name: "profile_slug" satisfies keyof TeamProfile,
        display_name: "Profile URL Slug",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
        placeholder: "Auto-generated from team name",
      },
      {
        field_name: "links",
        display_name: "Links & Media",
        field_type: "sub_entity",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
        sub_entity_config: {
          child_entity_type: "profilelink",
          foreign_key_field: "profile_id",
        },
      },
      {
        field_name: "status" satisfies keyof TeamProfile,
        display_name: "Status",
        field_type: "enum",
        is_required: true,
        is_read_only: false,
        enum_values: ["active", "inactive"],
        show_in_list: true,
      },
    ],
  });
  return metadata_map;
}
