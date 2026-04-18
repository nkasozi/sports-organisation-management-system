import type { EntityMetadata } from "../../core/entities/BaseEntity";
import {
  register_competition_constraint_metadata,
  register_competition_format_metadata,
} from "./constraintFormatMetadata";
import {
  register_fixture_details_setup_metadata,
  register_fixture_lineup_metadata,
} from "./fixtureLineupDetailsMetadata";
import { register_fixture_metadata } from "./fixtureMetadata";
import {
  register_active_game_metadata,
  register_game_assignment_metadata,
} from "./gameAssignmentActiveMetadata";
import { register_game_event_log_metadata } from "./gameEventLogMetadata";
import {
  register_identification_metadata,
  register_jersey_color_metadata,
} from "./identificationJerseyMetadata";
import { register_live_game_log_metadata } from "./liveGameLogMetadata";
import { register_official_metadata } from "./officialMetadata";
import {
  register_game_official_role_metadata,
  register_team_staff_role_metadata,
} from "./officialRoleStaffRoleMetadata";
import {
  register_official_associated_team_metadata,
  register_official_performance_rating_metadata,
} from "./officialTeamPerformanceMetadata";
import {
  register_competition_metadata,
  register_organization_metadata,
} from "./organizationCompetitionMetadata";
import {
  register_player_team_membership_metadata,
  register_player_team_transfer_history_metadata,
} from "./playerMembershipTransferMetadata";
import { register_player_metadata } from "./playerMetadata";
import {
  register_audit_log_metadata,
  register_profile_link_metadata,
} from "./profileLinkAuditMetadata";
import {
  register_player_profile_metadata,
  register_team_profile_metadata,
} from "./profileMetadata";
import {
  register_player_position_metadata,
  register_qualification_metadata,
} from "./qualificationPositionMetadata";
import {
  register_competition_stage_metadata,
  register_gender_metadata,
  register_identification_type_metadata,
} from "./referenceEntityMetadata";
import {
  register_game_event_type_metadata,
  register_sport_metadata,
} from "./sportEventTypeMetadata";
import { register_system_user_metadata } from "./systemUserMetadata";
import { register_team_metadata } from "./teamMetadata";
import { register_team_staff_metadata } from "./teamStaffMetadata";
import { register_venue_metadata } from "./venueMetadata";

class EntityMetadataRegistry {
  private metadata_map: Map<string, EntityMetadata> = new Map();

  constructor() {
    this.initialize_all_entity_metadata();
  }

  get_entity_metadata(entity_type: string): EntityMetadata | false {
    return this.metadata_map.get(entity_type) || false;
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
    register_qualification_metadata(this.metadata_map);
    register_organization_metadata(this.metadata_map);
    register_competition_metadata(this.metadata_map);
    register_competition_constraint_metadata(this.metadata_map);
    register_team_metadata(this.metadata_map);
    register_player_metadata(this.metadata_map);
    register_player_team_membership_metadata(this.metadata_map);
    register_player_team_transfer_history_metadata(this.metadata_map);
    register_player_position_metadata(this.metadata_map);
    register_official_metadata(this.metadata_map);
    register_fixture_metadata(this.metadata_map);
    register_game_assignment_metadata(this.metadata_map);
    register_active_game_metadata(this.metadata_map);
    register_sport_metadata(this.metadata_map);
    register_fixture_lineup_metadata(this.metadata_map);
    register_fixture_details_setup_metadata(this.metadata_map);
    register_competition_format_metadata(this.metadata_map);
    register_competition_stage_metadata(this.metadata_map);
    register_game_event_type_metadata(this.metadata_map);
    register_game_official_role_metadata(this.metadata_map);
    register_team_staff_role_metadata(this.metadata_map);
    register_team_staff_metadata(this.metadata_map);
    register_venue_metadata(this.metadata_map);
    register_identification_type_metadata(this.metadata_map);
    register_gender_metadata(this.metadata_map);
    register_identification_metadata(this.metadata_map);
    register_jersey_color_metadata(this.metadata_map);
    register_system_user_metadata(this.metadata_map);
    register_audit_log_metadata(this.metadata_map);
    register_player_profile_metadata(this.metadata_map);
    register_team_profile_metadata(this.metadata_map);
    register_profile_link_metadata(this.metadata_map);
    register_official_associated_team_metadata(this.metadata_map);
    register_live_game_log_metadata(this.metadata_map);
    register_game_event_log_metadata(this.metadata_map);
    register_official_performance_rating_metadata(this.metadata_map);
  }
}

export const entityMetadataRegistry = new EntityMetadataRegistry();
