// Entity metadata registry - defines all entities and their fields
// Follows coding rules: well-named methods, explicit return types, no nested ifs
import type {
  EntityMetadata,
  BaseEntity,
} from "../../core/entities/BaseEntity";
import { get_country_names_sorted_unique } from "../utils/countries";
import type { Organization } from "../../core/entities/Organization";
import type { Competition } from "../../core/entities/Competition";
import type { Team } from "../../core/entities/Team";
import type { Player } from "../../core/entities/Player";
import type { PlayerTeamMembership } from "../../core/entities/PlayerTeamMembership";
import type { PlayerPosition } from "../../core/entities/PlayerPosition";
import type { Official } from "../../core/entities/Official";
import type { Fixture } from "../../core/entities/Fixture";
import type { Sport } from "../../core/entities/Sport";
import type { FixtureLineup } from "../../core/entities/FixtureLineup";
import type { CompetitionFormat } from "../../core/entities/CompetitionFormat";
import type { GameEventType } from "../../core/entities/GameEventType";
import type { GameOfficialRole } from "../../core/entities/GameOfficialRole";
import type { TeamStaffRole } from "../../core/entities/TeamStaffRole";
import type { TeamStaff } from "../../core/entities/TeamStaff";
import type { Venue } from "../../core/entities/Venue";
import type { Qualification } from "../../core/entities/Qualification";
import type { IdentificationType } from "../../core/entities/IdentificationType";
import type { Identification } from "../../core/entities/Identification";
import type { FixtureDetailsSetup } from "../../core/entities/FixtureDetailsSetup";
import type { SystemUser } from "../../core/entities/SystemUser";
import type { AuditLog } from "../../core/entities/AuditLog";
import type { JerseyColor } from "../../core/entities/JerseyColor";
import type { PlayerProfile } from "../../core/entities/PlayerProfile";
import { PROFILE_VISIBILITY_OPTIONS } from "../../core/entities/PlayerProfile";
import type { TeamProfile } from "../../core/entities/TeamProfile";
import { TEAM_PROFILE_VISIBILITY_OPTIONS } from "../../core/entities/TeamProfile";
import type { ProfileLink } from "../../core/entities/ProfileLink";
import { PROFILE_LINK_PLATFORM_OPTIONS } from "../../core/entities/ProfileLink";

function generate_30_minute_time_intervals(): string[] {
  const intervals: string[] = [];
  for (let hour = 7; hour <= 23; hour++) {
    const hour_string = hour.toString().padStart(2, "0");
    intervals.push(`${hour_string}:00`);
    if (hour < 24) {
      intervals.push(`${hour_string}:30`);
    }
  }
  intervals.push("00:00");
  return intervals;
}

// Registry class that holds all entity metadata
class EntityMetadataRegistry {
  private register_team_staff_metadata(): void {
    this.metadata_map.set("teamstaff", {
      entity_name: "teamstaff",
      display_name: "Team Staff",
      fields: [
        {
          field_name: "first_name" satisfies keyof TeamStaff,
          display_name: "First Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "last_name" satisfies keyof TeamStaff,
          display_name: "Last Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "email" satisfies keyof TeamStaff,
          display_name: "Email",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "phone" satisfies keyof TeamStaff,
          display_name: "Phone",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "date_of_birth" satisfies keyof TeamStaff,
          display_name: "Date of Birth",
          field_type: "date",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "team_id" satisfies keyof TeamStaff,
          display_name: "Team",
          field_type: "foreign_key",
          foreign_key_entity: "team",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "role_id" satisfies keyof TeamStaff,
          display_name: "Staff Role",
          field_type: "foreign_key",
          foreign_key_entity: "teamstaffrole",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "nationality" satisfies keyof TeamStaff,
          display_name: "Nationality",
          field_type: "enum",
          is_required: false,
          is_read_only: false,
          enum_values: get_country_names_sorted_unique(),
        },
        {
          field_name: "profile_image_url" satisfies keyof TeamStaff,
          display_name: "Profile Image",
          field_type: "file",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "employment_start_date" satisfies keyof TeamStaff,
          display_name: "Employment Start Date",
          field_type: "date",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "employment_end_date" satisfies keyof TeamStaff,
          display_name: "Employment End Date",
          field_type: "date",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "emergency_contact_name" satisfies keyof TeamStaff,
          display_name: "Emergency Contact Name",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "emergency_contact_phone" satisfies keyof TeamStaff,
          display_name: "Emergency Contact Phone",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "notes" satisfies keyof TeamStaff,
          display_name: "Notes",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "status" satisfies keyof TeamStaff,
          display_name: "Status",
          field_type: "enum",
          enum_values: ["active", "inactive", "archived"],
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "qualifications",
          display_name: "Qualifications & Certifications",
          field_type: "sub_entity",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
          sub_entity_config: {
            child_entity_type: "qualification",
            foreign_key_field: "holder_id",
            holder_type_field: "holder_type",
            holder_type_value: "team_staff",
          },
        },
        {
          field_name: "identifications",
          display_name: "Identity Documents",
          field_type: "sub_entity",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
          sub_entity_config: {
            child_entity_type: "identification",
            foreign_key_field: "holder_id",
            holder_type_field: "holder_type",
            holder_type_value: "team_staff",
          },
        },
      ],
    });
  }

  private register_venue_metadata(): void {
    this.metadata_map.set("venue", {
      entity_name: "venue",
      display_name: "Venue",
      fields: [
        {
          field_name: "name" satisfies keyof Venue,
          display_name: "Venue Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 2,
              error_message: "Name must be at least 2 characters",
            },
          ],
        },
        {
          field_name: "short_name" satisfies keyof Venue,
          display_name: "Short Name",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "address" satisfies keyof Venue,
          display_name: "Address",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "city" satisfies keyof Venue,
          display_name: "City",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "country" satisfies keyof Venue,
          display_name: "Country",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: get_country_names_sorted_unique(),
          show_in_list: true,
        },
        {
          field_name: "capacity" satisfies keyof Venue,
          display_name: "Capacity",
          field_type: "number",
          is_required: false,
          is_read_only: false,
          show_in_list: true,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 0,
              error_message: "Capacity cannot be negative",
            },
          ],
        },
        {
          field_name: "surface_type" satisfies keyof Venue,
          display_name: "Surface Type",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: [
            "grass",
            "artificial_turf",
            "indoor",
            "clay",
            "concrete",
            "other",
          ],
          show_in_list: false,
        },
        {
          field_name: "has_lighting" satisfies keyof Venue,
          display_name: "Has Lighting",
          field_type: "boolean",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "has_parking" satisfies keyof Venue,
          display_name: "Has Parking",
          field_type: "boolean",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "contact_email" satisfies keyof Venue,
          display_name: "Contact Email",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "pattern",
              rule_value: "^[^@]+@[^@]+\\.[^@]+$",
              error_message: "Must be a valid email",
            },
          ],
        },
        {
          field_name: "contact_phone" satisfies keyof Venue,
          display_name: "Contact Phone",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "website" satisfies keyof Venue,
          display_name: "Website",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "image_url" satisfies keyof Venue,
          display_name: "Venue Image",
          field_type: "file",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "status" satisfies keyof Venue,
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["active", "inactive", "archived"],
          show_in_list: true,
        },
      ],
    });
  }

  private register_player_position_metadata(): void {
    this.metadata_map.set("playerposition", {
      entity_name: "playerposition",
      display_name: "Player Position",
      fields: [
        {
          field_name: "name" satisfies keyof PlayerPosition,
          display_name: "Position Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "code" satisfies keyof PlayerPosition,
          display_name: "Code",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "description" satisfies keyof PlayerPosition,
          display_name: "Description",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "category" satisfies keyof PlayerPosition,
          display_name: "Category",
          field_type: "enum",
          enum_values: ["offense", "defense", "goalkeeper", "utility", "other"],
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "display_order" satisfies keyof PlayerPosition,
          display_name: "Display Order",
          field_type: "number",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "status" satisfies keyof PlayerPosition,
          display_name: "Status",
          field_type: "enum",
          enum_values: ["active", "inactive", "archived"],
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
      ],
    });
  }

  private register_qualification_metadata(): void {
    this.metadata_map.set("qualification", {
      entity_name: "qualification",
      display_name: "Qualification",
      fields: [
        {
          field_name: "holder_type" satisfies keyof Qualification,
          display_name: "Holder Type",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          enum_values: ["official", "team_staff"],
        },
        {
          field_name: "holder_id" satisfies keyof Qualification,
          display_name: "Holder ID",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "certification_name" satisfies keyof Qualification,
          display_name: "Certification Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "certification_level" satisfies keyof Qualification,
          display_name: "Certification Level",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          enum_values: [
            "trainee",
            "local",
            "regional",
            "national",
            "international",
            "fifa",
            "other",
          ],
        },
        {
          field_name: "certification_number" satisfies keyof Qualification,
          display_name: "Certification Number",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "issuing_authority" satisfies keyof Qualification,
          display_name: "Issuing Authority",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "issue_date" satisfies keyof Qualification,
          display_name: "Issue Date",
          field_type: "date",
          is_required: true,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "expiry_date" satisfies keyof Qualification,
          display_name: "Expiry Date",
          field_type: "date",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "specializations" satisfies keyof Qualification,
          display_name: "Specializations",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "notes" satisfies keyof Qualification,
          display_name: "Notes",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "status" satisfies keyof Qualification,
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["active", "inactive"],
          show_in_list: true,
        },
      ],
    });
  }

  private metadata_map: Map<string, EntityMetadata> = new Map();

  constructor() {
    this.initialize_all_entity_metadata();
  }

  get_entity_metadata(entity_type: string): EntityMetadata | null {
    return this.metadata_map.get(entity_type) || null;
  }

  get_all_entity_types(): string[] {
    return Array.from(this.metadata_map.keys());
  }

  get_entities_with_foreign_key_to(target_entity_type: string): string[] {
    const related_entities: string[] = [];

    for (const [entity_type, metadata] of this.metadata_map) {
      const has_foreign_key = metadata.fields.some(
        (field) =>
          field.field_type === "foreign_key" &&
          field.foreign_key_entity === target_entity_type,
      );

      if (has_foreign_key) {
        related_entities.push(entity_type);
      }
    }

    return related_entities;
  }

  private initialize_all_entity_metadata(): void {
    this.register_qualification_metadata();
    this.register_organization_metadata();
    this.register_competition_metadata();
    this.register_competition_constraint_metadata();
    this.register_team_metadata();
    this.register_player_metadata();
    this.register_player_team_membership_metadata();
    this.register_player_position_metadata();
    this.register_official_metadata();
    this.register_fixture_metadata();
    this.register_game_assignment_metadata();
    this.register_active_game_metadata();
    this.register_sport_metadata();
    this.register_fixture_lineup_metadata();
    this.register_fixture_details_setup_metadata();
    this.register_competition_format_metadata();
    this.register_game_event_type_metadata();
    this.register_game_official_role_metadata();
    this.register_team_staff_role_metadata();
    this.register_team_staff_metadata();
    this.register_venue_metadata();
    this.register_identification_type_metadata();
    this.register_identification_metadata();
    this.register_jersey_color_metadata();
    this.register_system_user_metadata();
    this.register_audit_log_metadata();
    this.register_player_profile_metadata();
    this.register_team_profile_metadata();
    this.register_profile_link_metadata();
  }

  private register_organization_metadata(): void {
    this.metadata_map.set("organization", {
      entity_name: "organization",
      display_name: "Organization",
      fields: [
        {
          field_name: "name" satisfies keyof Organization,
          display_name: "Organization Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 2,
              error_message: "Name must be at least 2 characters",
            },
          ],
        },
        {
          field_name: "description" satisfies keyof Organization,
          display_name: "Description",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "sport_id" satisfies keyof Organization,
          display_name: "Sport",
          field_type: "foreign_key",
          foreign_key_entity: "sport",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "founded_date" satisfies keyof Organization,
          display_name: "Founded Date",
          field_type: "date",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "contact_email" satisfies keyof Organization,
          display_name: "Contact Email",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: true,
          validation_rules: [
            {
              rule_type: "pattern",
              rule_value: "^[^@]+@[^@]+\\.[^@]+$",
              error_message: "Must be a valid email",
            },
          ],
        },
        {
          field_name: "contact_phone" satisfies keyof Organization,
          display_name: "Contact Phone",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "address" satisfies keyof Organization,
          display_name: "Address",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "website" satisfies keyof Organization,
          display_name: "Website",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "status" satisfies keyof Organization,
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["active", "inactive", "suspended"],
          show_in_list: true,
        },
      ],
    });
  }

  private register_competition_metadata(): void {
    this.metadata_map.set("competition", {
      entity_name: "competition",
      display_name: "Competition",
      fields: [
        {
          field_name: "name" satisfies keyof Competition,
          display_name: "Competition Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 2,
              error_message: "Name must be at least 2 characters",
            },
          ],
        },
        {
          field_name: "description" satisfies keyof Competition,
          display_name: "Description",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "organization_id" satisfies keyof Competition,
          display_name: "Organization",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          foreign_key_entity: "organization",
          show_in_list: true,
        },
        {
          field_name: "start_date" satisfies keyof Competition,
          display_name: "Start Date",
          field_type: "date",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "end_date" satisfies keyof Competition,
          display_name: "End Date",
          field_type: "date",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "max_teams" satisfies keyof Competition,
          display_name: "Maximum Teams",
          field_type: "number",
          is_required: true,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 2,
              error_message: "Must allow at least 2 teams",
            },
          ],
        },
        {
          field_name: "registration_deadline" satisfies keyof Competition,
          display_name: "Registration Deadline",
          field_type: "date",
          is_required: true,
          is_read_only: false,
        },
        {
          field_name: "official_jersey_colors",
          display_name: "Official Jersey Colors",
          field_type: "sub_entity",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
          sub_entity_config: {
            child_entity_type: "jerseycolor",
            foreign_key_field: "holder_id",
            holder_type_field: "holder_type",
            holder_type_value: "competition_official",
          },
        },
      ],
    });
  }

  private register_competition_constraint_metadata(): void {
    this.metadata_map.set("competition_constraint", {
      entity_name: "competition_constraint",
      display_name: "Competition Constraint",
      fields: [
        {
          field_name: "competition_id",
          display_name: "Competition",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          foreign_key_entity: "competition",
          show_in_list: true,
        },
        {
          field_name: "constraint_type",
          display_name: "Constraint Type",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["game", "player", "team", "match"],
          show_in_list: true,
        },
        {
          field_name: "name",
          display_name: "Constraint Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "description",
          display_name: "Description",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "value_type",
          display_name: "Value Type",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["number", "string", "boolean"],
        },
        {
          field_name: "value",
          display_name: "Value",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "is_mandatory",
          display_name: "Is Mandatory",
          field_type: "boolean",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "applies_to",
          display_name: "Applies To",
          field_type: "string",
          is_required: true,
          is_read_only: false,
        },
      ],
    });
  }

  private register_team_metadata(): void {
    this.metadata_map.set("team", {
      entity_name: "team",
      display_name: "Team",
      fields: [
        {
          field_name: "name" satisfies keyof Team,
          display_name: "Team Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 2,
              error_message: "Name must be at least 2 characters",
            },
          ],
        },
        {
          field_name: "organization_id" satisfies keyof Team,
          display_name: "Organization",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          foreign_key_entity: "organization",
          show_in_list: true,
        },
        {
          field_name: "short_name" satisfies keyof Team,
          display_name: "Team Code",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 2,
              error_message: "Team code must be at least 2 characters",
            },
          ],
        },
        {
          field_name: "founded_year" satisfies keyof Team,
          display_name: "Established Year",
          field_type: "number",
          is_required: false,
          is_read_only: false,
          show_in_list: true,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 1800,
              error_message: "Year must be realistic",
            },
          ],
        },
        {
          field_name: "home_venue_id" satisfies keyof Team,
          display_name: "Home Venue",
          field_type: "foreign_key",
          foreign_key_entity: "venue",
          is_required: false,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "primary_color" satisfies keyof Team,
          display_name: "Team Color",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "logo_url" satisfies keyof Team,
          display_name: "Team Logo",
          field_type: "file",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "status" satisfies keyof Team,
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["active", "inactive", "disqualified"],
          show_in_list: true,
        },
        {
          field_name: "jersey_colors",
          display_name: "Jersey Colors",
          field_type: "sub_entity",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
          sub_entity_config: {
            child_entity_type: "jerseycolor",
            foreign_key_field: "holder_id",
            holder_type_field: "holder_type",
            holder_type_value: "team",
          },
        },
        {
          field_name: "team_profile",
          display_name: "Public Profile",
          field_type: "sub_entity",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
          sub_entity_config: {
            child_entity_type: "teamprofile",
            foreign_key_field: "team_id",
          },
        },
      ],
    });
  }

  private register_player_metadata(): void {
    this.metadata_map.set("player", {
      entity_name: "player",
      display_name: "Player",
      fields: [
        {
          field_name: "first_name" satisfies keyof Player,
          display_name: "First Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 1,
              error_message: "First name is required",
            },
          ],
        },
        {
          field_name: "last_name" satisfies keyof Player,
          display_name: "Last Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 1,
              error_message: "Last name is required",
            },
          ],
        },
        {
          field_name: "position_id" satisfies keyof Player,
          display_name: "Position",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          foreign_key_entity: "playerposition",
          show_in_list: true,
        },
        {
          field_name: "date_of_birth" satisfies keyof Player,
          display_name: "Date of Birth",
          field_type: "date",
          is_required: true,
          is_read_only: false,
        },
        {
          field_name: "nationality" satisfies keyof Player,
          display_name: "Nationality",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: get_country_names_sorted_unique(),
          show_in_list: true,
        },
        {
          field_name: "email" satisfies keyof Player,
          display_name: "Email",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "pattern",
              rule_value: "^[^@]+@[^@]+\\.[^@]+$",
              error_message: "Must be a valid email",
            },
          ],
        },
        {
          field_name: "phone" satisfies keyof Player,
          display_name: "Phone",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "height_cm" satisfies keyof Player,
          display_name: "Height (cm)",
          field_type: "number",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "weight_kg" satisfies keyof Player,
          display_name: "Weight (kg)",
          field_type: "number",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "profile_image_url" satisfies keyof Player,
          display_name: "Profile Picture",
          field_type: "file",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "emergency_contact_name" satisfies keyof Player,
          display_name: "Emergency Contact Name",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "emergency_contact_phone" satisfies keyof Player,
          display_name: "Emergency Contact Phone",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "medical_notes" satisfies keyof Player,
          display_name: "Medical Notes",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "status" satisfies keyof Player,
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["active", "inactive", "injured", "suspended"],
          show_in_list: true,
        },
        {
          field_name: "identifications",
          display_name: "Identity Documents",
          field_type: "sub_entity",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
          sub_entity_config: {
            child_entity_type: "identification",
            foreign_key_field: "holder_id",
            holder_type_field: "holder_type",
            holder_type_value: "player",
          },
        },
      ],
    });
  }

  private register_player_team_membership_metadata(): void {
    this.metadata_map.set("playerteammembership", {
      entity_name: "playerteammembership",
      display_name: "Player Team Membership",
      fields: [
        {
          field_name: "player_id" satisfies keyof PlayerTeamMembership,
          display_name: "Player",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          is_read_only_on_edit: true,
          foreign_key_entity: "player",
          show_in_list: true,
        },
        {
          field_name: "team_id" satisfies keyof PlayerTeamMembership,
          display_name: "Team",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          is_read_only_on_edit: true,
          foreign_key_entity: "team",
          show_in_list: true,
        },
        {
          field_name: "start_date" satisfies keyof PlayerTeamMembership,
          display_name: "Start Date",
          field_type: "date",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "jersey_number" satisfies keyof PlayerTeamMembership,
          display_name: "Jersey Number",
          field_type: "number",
          is_required: false,
          is_read_only: false,
          show_in_list: true,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 1,
              error_message: "Jersey number must be positive",
            },
            {
              rule_type: "max_value",
              rule_value: 99,
              error_message: "Jersey number must be under 100",
            },
          ],
        },
        {
          field_name: "status" satisfies keyof PlayerTeamMembership,
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["active", "inactive", "ended"],
          show_in_list: true,
        },
      ],
    });
  }

  private register_official_metadata(): void {
    this.metadata_map.set("official", {
      entity_name: "official",
      display_name: "Official",
      fields: [
        {
          field_name: "first_name" satisfies keyof Official,
          display_name: "First Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,

          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 1,
              error_message: "First name is required",
            },
          ],
        },
        {
          field_name: "last_name" satisfies keyof Official,
          display_name: "Last Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 1,
              error_message: "Last name is required",
            },
          ],
        },
        {
          field_name: "email" satisfies keyof Official,
          display_name: "Email",
          field_type: "string",
          show_in_list: false,
          is_required: true,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "pattern",
              rule_value: "^[^@]+@[^@]+\\.[^@]+$",
              error_message: "Must be a valid email",
            },
          ],
        },
        {
          field_name: "phone" satisfies keyof Official,
          display_name: "Phone",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "years_of_experience" satisfies keyof Official,
          display_name: "Years Experience",
          field_type: "number",
          is_required: false,
          show_in_list: false,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 0,
              error_message: "Experience cannot be negative",
            },
          ],
        },
        {
          field_name: "emergency_contact_name" satisfies keyof Official,
          display_name: "Emergency Contact",
          field_type: "string",
          is_required: false,
          show_in_list: false,
          is_read_only: false,
        },
        {
          field_name: "emergency_contact_phone" satisfies keyof Official,
          display_name: "Emergency Contact Phone",
          field_type: "string",
          is_required: false,
          show_in_list: false,
          is_read_only: false,
        },
        {
          field_name: "date_of_birth" satisfies keyof Official,
          display_name: "Date of Birth",
          field_type: "date",
          is_required: false,
          show_in_list: false,
          is_read_only: false,
        },
        {
          field_name: "status" satisfies keyof Official,
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          show_in_list: true,
          is_read_only: false,
          enum_values: ["active", "inactive"],
        },
        {
          field_name: "qualifications",
          display_name: "Qualifications & Certifications",
          field_type: "sub_entity",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
          sub_entity_config: {
            child_entity_type: "qualification",
            foreign_key_field: "holder_id",
            holder_type_field: "holder_type",
            holder_type_value: "official",
          },
        },
        {
          field_name: "identifications",
          display_name: "Identity Documents",
          field_type: "sub_entity",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
          sub_entity_config: {
            child_entity_type: "identification",
            foreign_key_field: "holder_id",
            holder_type_field: "holder_type",
            holder_type_value: "official",
          },
        },
      ],
    });
  }

  private register_fixture_metadata(): void {
    this.metadata_map.set("fixture", {
      entity_name: "fixture",
      display_name: "Fixture",
      fields: [
        {
          field_name: "competition_id" satisfies keyof Fixture,
          display_name: "Competition",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          foreign_key_entity: "competition",
        },
        {
          field_name: "home_team_id" satisfies keyof Fixture,
          display_name: "Home Team",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          foreign_key_entity: "team",
          show_in_list: true,
          foreign_key_filter: {
            depends_on_field: "competition_id",
            filter_type: "teams_from_competition",
            exclude_field: "away_team_id",
          },
        },
        {
          field_name: "away_team_id" satisfies keyof Fixture,
          display_name: "Away Team",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          foreign_key_entity: "team",
          show_in_list: true,
          foreign_key_filter: {
            depends_on_field: "competition_id",
            filter_type: "teams_from_competition",
            exclude_field: "home_team_id",
          },
        },
        {
          field_name: "scheduled_date" satisfies keyof Fixture,
          display_name: "Scheduled Date",
          field_type: "date",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "scheduled_time" satisfies keyof Fixture,
          display_name: "Scheduled Time",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          enum_values: generate_30_minute_time_intervals(),
        },
        {
          field_name: "venue" satisfies keyof Fixture,
          display_name: "Venue",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "status" satisfies keyof Fixture,
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: [
            "scheduled",
            "in_progress",
            "paused",
            "completed",
            "cancelled",
            "postponed",
          ],
          show_in_list: true,
        },
        {
          field_name: "home_team_score" satisfies keyof Fixture,
          display_name: "Home Team Score",
          field_type: "number",
          is_required: false,
          is_read_only: false,
          hide_on_create: true,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 0,
              error_message: "Score cannot be negative",
            },
          ],
        },
        {
          field_name: "away_team_score" satisfies keyof Fixture,
          display_name: "Away Team Score",
          field_type: "number",
          is_required: false,
          is_read_only: false,
          hide_on_create: true,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 0,
              error_message: "Score cannot be negative",
            },
          ],
        },
        {
          field_name: "actual_start_time",
          display_name: "Actual Start Time",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          hide_on_create: true,
        },
        {
          field_name: "actual_end_time",
          display_name: "Actual End Time",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          hide_on_create: true,
        },
      ],
    });
  }

  private register_game_assignment_metadata(): void {
    this.metadata_map.set("game_assignment", {
      entity_name: "game_assignment",
      display_name: "Game Assignment",
      fields: [
        {
          field_name: "game_id",
          display_name: "Game",
          field_type: "foreign_key",
          foreign_key_entity: "game",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "official_id",
          display_name: "Official",
          field_type: "foreign_key",
          foreign_key_entity: "official",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "assignment_role",
          display_name: "Role",
          field_type: "enum",
          enum_values: [
            "referee",
            "assistant_referee",
            "fourth_official",
            "timekeeper",
            "scorekeeper",
          ],
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "confirmed",
          display_name: "Confirmed",
          field_type: "boolean",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "assigned_at",
          display_name: "Assigned At",
          field_type: "date",
          is_required: true,
          is_read_only: true,
          show_in_list: true,
        },
        {
          field_name: "assigned_by_user_id",
          display_name: "Assigned By User",
          field_type: "string",
          is_required: true,
          is_read_only: true,
        },
        {
          field_name: "notes",
          display_name: "Notes",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
      ],
    });
  }

  private register_active_game_metadata(): void {
    this.metadata_map.set("active_game", {
      entity_name: "active_game",
      display_name: "Active Game",
      fields: [
        {
          field_name: "game_id",
          display_name: "Game",
          field_type: "foreign_key",
          foreign_key_entity: "game",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "current_status",
          display_name: "Current Status",
          field_type: "enum",
          enum_values: [
            "pre_game",
            "first_half",
            "half_time",
            "second_half",
            "extra_time",
            "penalty_shootout",
            "finished",
          ],
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "current_minute",
          display_name: "Current Minute",
          field_type: "number",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "stoppage_time_minutes",
          display_name: "Stoppage Time (Minutes)",
          field_type: "number",
          is_required: true,
          is_read_only: false,
        },
        {
          field_name: "home_team_score",
          display_name: "Home Team Score",
          field_type: "number",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "away_team_score",
          display_name: "Away Team Score",
          field_type: "number",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "last_event_timestamp",
          display_name: "Last Event Time",
          field_type: "date",
          is_required: true,
          is_read_only: true,
        },
        {
          field_name: "game_started_by_user_id",
          display_name: "Started By User",
          field_type: "string",
          is_required: true,
          is_read_only: true,
        },
      ],
    });
  }

  private register_sport_metadata(): void {
    this.metadata_map.set("sport", {
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
  }

  private register_fixture_lineup_metadata(): void {
    this.metadata_map.set("fixturelineup", {
      entity_name: "fixturelineup",
      display_name: "Fixture Lineup",
      fields: [
        {
          field_name: "fixture_id" satisfies keyof FixtureLineup,
          display_name: "Fixture",
          field_type: "foreign_key",
          foreign_key_entity: "fixture",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "team_id" satisfies keyof FixtureLineup,
          display_name: "Team",
          field_type: "foreign_key",
          foreign_key_entity: "team",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
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
  }

  private register_fixture_details_setup_metadata(): void {
    this.metadata_map.set("fixturedetailssetup", {
      entity_name: "fixturedetailssetup",
      display_name: "Fixture Details Setup",
      fields: [
        {
          field_name: "fixture_id" satisfies keyof FixtureDetailsSetup,
          display_name: "Fixture",
          field_type: "foreign_key",
          foreign_key_entity: "fixture",
          is_required: true,
          is_read_only: false,
          is_read_only_on_edit: true,
          show_in_list: true,
        },
        {
          field_name: "official_id" satisfies keyof FixtureDetailsSetup,
          display_name: "Official",
          field_type: "foreign_key",
          foreign_key_entity: "official",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "role_id" satisfies keyof FixtureDetailsSetup,
          display_name: "Official Role",
          field_type: "foreign_key",
          foreign_key_entity: "gameofficialrole",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
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
          field_name: "assignment_notes" satisfies keyof FixtureDetailsSetup,
          display_name: "Assignment Notes",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
        },
      ],
    });
  }

  private register_competition_format_metadata(): void {
    this.metadata_map.set("competitionformat", {
      entity_name: "competitionformat",
      display_name: "Competition Format",
      fields: [
        {
          field_name: "name" satisfies keyof CompetitionFormat,
          display_name: "Format Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "code" satisfies keyof CompetitionFormat,
          display_name: "Code",
          field_type: "string",
          is_required: true,
          is_read_only: false,
        },
        {
          field_name: "description" satisfies keyof CompetitionFormat,
          display_name: "Description",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "format_type" satisfies keyof CompetitionFormat,
          display_name: "Format Type",
          field_type: "enum",
          enum_values: [
            "league",
            "round_robin",
            "groups_knockout",
            "straight_knockout",
            "groups_playoffs",
            "double_elimination",
            "swiss",
            "custom",
          ],
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "min_teams_required" satisfies keyof CompetitionFormat,
          display_name: "Min Teams Required",
          field_type: "number",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "max_teams_allowed" satisfies keyof CompetitionFormat,
          display_name: "Max Teams Allowed",
          field_type: "number",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "status" satisfies keyof CompetitionFormat,
          display_name: "Status",
          field_type: "enum",
          enum_values: ["active", "inactive", "archived"],
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
      ],
    });
  }

  private register_game_event_type_metadata(): void {
    this.metadata_map.set("gameeventtype", {
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
      ],
    });
  }

  private register_game_official_role_metadata(): void {
    this.metadata_map.set("gameofficialrole", {
      entity_name: "gameofficialrole",
      display_name: "Game Official Role",
      fields: [
        {
          field_name: "name" satisfies keyof GameOfficialRole,
          display_name: "Role Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "code" satisfies keyof GameOfficialRole,
          display_name: "Code",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "description" satisfies keyof GameOfficialRole,
          display_name: "Description",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "sport_id" satisfies keyof GameOfficialRole,
          display_name: "Sport",
          field_type: "foreign_key",
          foreign_key_entity: "sport",
          is_required: false,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "is_on_field" satisfies keyof GameOfficialRole,
          display_name: "Is On Field",
          field_type: "boolean",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "is_head_official" satisfies keyof GameOfficialRole,
          display_name: "Is Head Official",
          field_type: "boolean",
          is_required: true,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "display_order" satisfies keyof GameOfficialRole,
          display_name: "Display Order",
          field_type: "number",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "status" satisfies keyof GameOfficialRole,
          display_name: "Status",
          field_type: "enum",
          enum_values: ["active", "inactive", "archived"],
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
      ],
    });
  }

  private register_team_staff_role_metadata(): void {
    this.metadata_map.set("teamstaffrole", {
      entity_name: "teamstaffrole",
      display_name: "Team Staff Role",
      fields: [
        {
          field_name: "name" satisfies keyof TeamStaffRole,
          display_name: "Role Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "code" satisfies keyof TeamStaffRole,
          display_name: "Code",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "description" satisfies keyof TeamStaffRole,
          display_name: "Description",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "category" satisfies keyof TeamStaffRole,
          display_name: "Category",
          field_type: "enum",
          enum_values: [
            "coaching",
            "medical",
            "administrative",
            "technical",
            "other",
          ],
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "is_primary_contact" satisfies keyof TeamStaffRole,
          display_name: "Is Primary Contact",
          field_type: "boolean",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "display_order" satisfies keyof TeamStaffRole,
          display_name: "Display Order",
          field_type: "number",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "status" satisfies keyof TeamStaffRole,
          display_name: "Status",
          field_type: "enum",
          enum_values: ["active", "inactive", "archived"],
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
      ],
    });
  }

  private register_identification_type_metadata(): void {
    this.metadata_map.set("identificationtype", {
      entity_name: "identificationtype",
      display_name: "Identification Type",
      fields: [
        {
          field_name: "name" satisfies keyof IdentificationType,
          display_name: "Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 2,
              error_message: "Name must be at least 2 characters",
            },
          ],
        },
        {
          field_name:
            "identifier_field_label" satisfies keyof IdentificationType,
          display_name: "Identifier Field Label",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 2,
              error_message:
                "Identifier field label must be at least 2 characters",
            },
          ],
        },
        {
          field_name: "description" satisfies keyof IdentificationType,
          display_name: "Description",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "status" satisfies keyof IdentificationType,
          display_name: "Status",
          field_type: "enum",
          enum_values: ["active", "inactive"],
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
      ],
    });
  }

  private register_identification_metadata(): void {
    this.metadata_map.set("identification", {
      entity_name: "identification",
      display_name: "Identification",
      fields: [
        {
          field_name: "holder_type" satisfies keyof Identification,
          display_name: "Holder Type",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          enum_values: ["player", "team_staff", "official"],
        },
        {
          field_name: "holder_id" satisfies keyof Identification,
          display_name: "Holder ID",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "identification_type_id" satisfies keyof Identification,
          display_name: "Identification Type",
          field_type: "foreign_key",
          foreign_key_entity: "identificationtype",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "identifier_value" satisfies keyof Identification,
          display_name: "ID Number",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "document_image_url" satisfies keyof Identification,
          display_name: "Document Image",
          field_type: "file",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "issue_date" satisfies keyof Identification,
          display_name: "Issue Date",
          field_type: "date",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "expiry_date" satisfies keyof Identification,
          display_name: "Expiry Date",
          field_type: "date",
          is_required: false,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "notes" satisfies keyof Identification,
          display_name: "Notes",
          field_type: "string",
          is_required: false,
          is_read_only: false,
        },
        {
          field_name: "status" satisfies keyof Identification,
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["active", "inactive"],
          show_in_list: true,
        },
      ],
    });
  }

  private register_system_user_metadata(): void {
    this.metadata_map.set("systemuser", {
      entity_name: "systemuser",
      display_name: "System User",
      fields: [
        {
          field_name: "email" satisfies keyof SystemUser,
          display_name: "Email",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "first_name" satisfies keyof SystemUser,
          display_name: "First Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "last_name" satisfies keyof SystemUser,
          display_name: "Last Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "role" satisfies keyof SystemUser,
          display_name: "Role",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["super_admin", "admin", "manager", "user"],
          show_in_list: true,
        },
        {
          field_name: "status" satisfies keyof SystemUser,
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["active", "inactive", "pending"],
          show_in_list: true,
        },
      ],
    });
  }

  private register_audit_log_metadata(): void {
    this.metadata_map.set("auditlog", {
      entity_name: "auditlog",
      display_name: "Audit Log",
      fields: [
        {
          field_name: "timestamp" satisfies keyof AuditLog,
          display_name: "Timestamp",
          field_type: "date",
          is_required: true,
          is_read_only: true,
          show_in_list: true,
        },
        {
          field_name: "entity_type" satisfies keyof AuditLog,
          display_name: "Entity Type",
          field_type: "string",
          is_required: true,
          is_read_only: true,
          show_in_list: true,
        },
        {
          field_name: "entity_display_name" satisfies keyof AuditLog,
          display_name: "Entity Name",
          field_type: "string",
          is_required: true,
          is_read_only: true,
          show_in_list: true,
        },
        {
          field_name: "action" satisfies keyof AuditLog,
          display_name: "Action",
          field_type: "enum",
          is_required: true,
          is_read_only: true,
          enum_values: ["create", "update", "delete"],
          show_in_list: true,
        },
        {
          field_name: "user_display_name" satisfies keyof AuditLog,
          display_name: "User",
          field_type: "string",
          is_required: true,
          is_read_only: true,
          show_in_list: true,
        },
        {
          field_name: "user_email" satisfies keyof AuditLog,
          display_name: "User Email",
          field_type: "string",
          is_required: true,
          is_read_only: true,
          show_in_list: false,
        },
        {
          field_name: "entity_id" satisfies keyof AuditLog,
          display_name: "Entity ID",
          field_type: "string",
          is_required: true,
          is_read_only: true,
          show_in_list: false,
        },
        {
          field_name: "user_id" satisfies keyof AuditLog,
          display_name: "User ID",
          field_type: "string",
          is_required: true,
          is_read_only: true,
          show_in_list: false,
        },
        {
          field_name: "ip_address" satisfies keyof AuditLog,
          display_name: "IP Address",
          field_type: "string",
          is_required: false,
          is_read_only: true,
          show_in_list: false,
        },
      ],
    });
  }

  private register_jersey_color_metadata(): void {
    this.metadata_map.set("jerseycolor", {
      entity_name: "jerseycolor",
      display_name: "Jersey Color",
      fields: [
        {
          field_name: "holder_type" satisfies keyof JerseyColor,
          display_name: "Holder Type",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          show_in_list: false,
          enum_values: ["team", "official"],
        },
        {
          field_name: "holder_id" satisfies keyof JerseyColor,
          display_name: "Holder ID",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "nickname" satisfies keyof JerseyColor,
          display_name: "Jersey Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "main_color" satisfies keyof JerseyColor,
          display_name: "Main Color",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "secondary_color" satisfies keyof JerseyColor,
          display_name: "Secondary Color",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: true,
        },
        {
          field_name: "tertiary_color" satisfies keyof JerseyColor,
          display_name: "Tertiary Color",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "status" satisfies keyof JerseyColor,
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["active", "inactive"],
          show_in_list: true,
        },
      ],
    });
  }

  private register_player_profile_metadata(): void {
    this.metadata_map.set("playerprofile", {
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
          field_name: "featured_image_url" satisfies keyof PlayerProfile,
          display_name: "Featured Image URL",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
          placeholder: "https://example.com/image.jpg",
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
  }

  private register_team_profile_metadata(): void {
    this.metadata_map.set("teamprofile", {
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
          field_name: "featured_image_url" satisfies keyof TeamProfile,
          display_name: "Featured Image URL",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
          placeholder: "https://example.com/image.jpg",
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
  }

  private register_profile_link_metadata(): void {
    this.metadata_map.set("profilelink", {
      entity_name: "profilelink",
      display_name: "Profile Link",
      fields: [
        {
          field_name: "profile_id" satisfies keyof ProfileLink,
          display_name: "Profile",
          field_type: "foreign_key",
          foreign_key_entity: "playerprofile",
          is_required: true,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "platform" satisfies keyof ProfileLink,
          display_name: "Platform",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          enum_options: PROFILE_LINK_PLATFORM_OPTIONS,
        },
        {
          field_name: "title" satisfies keyof ProfileLink,
          display_name: "Title",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          placeholder: "Link title or description",
        },
        {
          field_name: "url" satisfies keyof ProfileLink,
          display_name: "URL",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          show_in_list: true,
          placeholder: "https://...",
        },
        {
          field_name: "display_order" satisfies keyof ProfileLink,
          display_name: "Display Order",
          field_type: "number",
          is_required: false,
          is_read_only: false,
          show_in_list: false,
        },
        {
          field_name: "status" satisfies keyof ProfileLink,
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["active", "inactive"],
          show_in_list: true,
        },
      ],
    });
  }
}

// Export the registry instance
export const entityMetadataRegistry = new EntityMetadataRegistry();
