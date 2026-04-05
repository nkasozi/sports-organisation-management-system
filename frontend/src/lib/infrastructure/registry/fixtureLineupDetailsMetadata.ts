import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { FixtureLineup } from "../../core/entities/FixtureLineup";
import type { FixtureDetailsSetup } from "../../core/entities/FixtureDetailsSetup";

export function register_fixture_lineup_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("fixturelineup", {
    entity_name: "fixturelineup",
    display_name: "Fixture Lineup",
    fields: [
      {
        field_name: "organization_id" satisfies keyof FixtureLineup,
        display_name: "Organization",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        is_read_only_on_edit: true,
        foreign_key_entity: "organization",
      },
      {
        field_name: "fixture_id" satisfies keyof FixtureLineup,
        display_name: "Fixture",
        field_type: "foreign_key",
        foreign_key_entity: "fixture",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        foreign_key_filter: {
          depends_on_field: "organization_id",
          filter_type: "fixtures_from_organization",
        },
      },
      {
        field_name: "team_id" satisfies keyof FixtureLineup,
        display_name: "Team",
        field_type: "foreign_key",
        foreign_key_entity: "team",
        is_required: true,
        is_read_only: false,
        show_in_list: true,
        foreign_key_filter: {
          depends_on_field: "organization_id",
          filter_type: "teams_from_organization",
        },
      },
      {
        field_name: "submitted_by" satisfies keyof FixtureLineup,
        display_name: "Submitted By",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: true,
      },
      {
        field_name: "submitted_at" satisfies keyof FixtureLineup,
        display_name: "Submitted At",
        field_type: "string",
        is_required: false,
        is_read_only: true,
        show_in_list: true,
      },
      {
        field_name: "notes" satisfies keyof FixtureLineup,
        display_name: "Notes",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "status" satisfies keyof FixtureLineup,
        display_name: "Status",
        field_type: "enum",
        enum_values: ["draft", "submitted", "locked"],
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
    ],
  });
  return metadata_map;
}

export function register_fixture_details_setup_metadata(
  metadata_map: Map<string, EntityMetadata>,
): Map<string, EntityMetadata> {
  metadata_map.set("fixturedetailssetup", {
    entity_name: "fixturedetailssetup",
    display_name: "Fixture Details Setup",
    fields: [
      {
        field_name: "organization_id" satisfies keyof FixtureDetailsSetup,
        display_name: "Organization",
        field_type: "foreign_key",
        is_required: true,
        is_read_only: false,
        is_read_only_on_edit: true,
        foreign_key_entity: "organization",
      },
      {
        field_name: "fixture_id" satisfies keyof FixtureDetailsSetup,
        display_name: "Fixture",
        field_type: "foreign_key",
        foreign_key_entity: "fixture",
        is_required: true,
        is_read_only: false,
        is_read_only_on_edit: true,
        show_in_list: true,
        foreign_key_filter: {
          depends_on_field: "organization_id",
          filter_type: "fixtures_without_setup",
        },
      },
      {
        field_name: "home_team_jersey_id" satisfies keyof FixtureDetailsSetup,
        display_name: "Home Team Jersey",
        field_type: "foreign_key",
        foreign_key_entity: "jerseycolor",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
        foreign_key_filter: {
          depends_on_field: "fixture_id",
          filter_type: "team_jersey_from_fixture",
          team_side: "home",
        },
      },
      {
        field_name: "away_team_jersey_id" satisfies keyof FixtureDetailsSetup,
        display_name: "Away Team Jersey",
        field_type: "foreign_key",
        foreign_key_entity: "jerseycolor",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
        foreign_key_filter: {
          depends_on_field: "fixture_id",
          filter_type: "team_jersey_from_fixture",
          team_side: "away",
        },
      },
      {
        field_name: "official_jersey_id" satisfies keyof FixtureDetailsSetup,
        display_name: "Official Jersey",
        field_type: "foreign_key",
        foreign_key_entity: "jerseycolor",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
        foreign_key_filter: {
          depends_on_field: "fixture_id",
          filter_type: "official_jersey_from_competition",
        },
      },
      {
        field_name: "assigned_officials" satisfies keyof FixtureDetailsSetup,
        display_name: "Assigned Officials",
        field_type: "official_assignment_array",
        is_required: true,
        is_read_only: false,
        show_in_list: false,
      },
      {
        field_name: "assignment_notes" satisfies keyof FixtureDetailsSetup,
        display_name: "Assignment Notes",
        field_type: "string",
        is_required: false,
        is_read_only: false,
        show_in_list: false,
      },
    ],
  });
  return metadata_map;
}
