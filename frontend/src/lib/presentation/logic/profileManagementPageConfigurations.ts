import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type { Player } from "$lib/core/entities/Player";
import type { PlayerProfile } from "$lib/core/entities/PlayerProfile";
import type { Team } from "$lib/core/entities/Team";
import type { TeamProfile } from "$lib/core/entities/TeamProfile";
import {
  get_player_profile_use_cases,
  get_player_use_cases,
  get_team_profile_use_cases,
  get_team_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

import {
  build_profile_management_preview_path,
  type ProfileManagementConfiguration,
  type ProfileManagementEntity,
} from "./profileManagementPageState";

function get_team_label(entity: BaseEntity): string {
  return (entity as Team).name;
}

function get_player_label(entity: BaseEntity): string {
  const current_player = entity as Player;
  return `${current_player.first_name} ${current_player.last_name}`.trim();
}

export const team_profile_management_configuration: ProfileManagementConfiguration =
  {
    page_head_title: "Team Profiles - Sports Management",
    entity_type: "TeamProfile",
    normalized_entity_type: "teamprofile",
    subject_column_label: "Team",
    list_title: "Team Profile List",
    create_title: "Create Team Profile",
    edit_title: "Edit Team Profile",
    empty_title: "No team profiles yet",
    empty_message: "Create your first team profile to get started.",
    create_button_label: "Create New",
    back_button_label: "Back to List",
    preview_button_label: "Preview",
    preview_panel_label: "Profile URL",
    preview_panel_action_label: "Preview in New Tab",
    show_edit_preview: false,
    access_denial_path: "/team-profiles",
    access_denial_message:
      "Access denied: Your role does not have permission to view Team Profiles.",
    create_denied_message:
      "You do not have permission to create team profiles.",
    edit_denied_message: "You do not have permission to edit team profiles.",
    delete_denied_message:
      "You do not have permission to delete team profiles.",
    delete_confirmation_message:
      "Are you sure you want to delete this team profile?",
    authorization_filter_fields: ["team_id", "organization_id"],
    profile_use_cases:
      get_team_profile_use_cases() as unknown as ProfileManagementConfiguration["profile_use_cases"],
    related_entity_use_cases:
      get_team_use_cases() as unknown as ProfileManagementConfiguration["related_entity_use_cases"],
    get_related_entity_label: get_team_label,
    get_profile_related_entity_id: (profile: ProfileManagementEntity) =>
      (profile as TeamProfile).team_id,
    get_profile_preview_path: (profile: ProfileManagementEntity) =>
      build_profile_management_preview_path(
        "/team-profile",
        (profile as TeamProfile).profile_slug,
      ),
  };

export const player_profile_management_configuration: ProfileManagementConfiguration =
  {
    page_head_title: "Player Profiles - Sports Management",
    entity_type: "PlayerProfile",
    normalized_entity_type: "playerprofile",
    subject_column_label: "Player",
    list_title: "Player Profile List",
    create_title: "Create New Profile",
    edit_title: "Edit Profile",
    empty_title: "No profiles yet",
    empty_message: "Create your first player profile to get started.",
    create_button_label: "Create New",
    back_button_label: "Back to List",
    preview_button_label: "Preview",
    preview_panel_label: "Profile URL",
    preview_panel_action_label: "Preview in New Tab",
    show_edit_preview: true,
    access_denial_path: "/player-profiles",
    access_denial_message:
      "Access denied: Your role does not have permission to view Player Profiles.",
    create_denied_message:
      "You do not have permission to create player profiles.",
    edit_denied_message: "You do not have permission to edit player profiles.",
    delete_denied_message:
      "You do not have permission to delete player profiles.",
    delete_confirmation_message:
      "Are you sure you want to delete this profile?",
    authorization_filter_fields: ["player_id", "organization_id", "team_id"],
    profile_use_cases:
      get_player_profile_use_cases() as unknown as ProfileManagementConfiguration["profile_use_cases"],
    related_entity_use_cases:
      get_player_use_cases() as unknown as ProfileManagementConfiguration["related_entity_use_cases"],
    get_related_entity_label: get_player_label,
    get_profile_related_entity_id: (profile: ProfileManagementEntity) =>
      (profile as PlayerProfile).player_id,
    get_profile_preview_path: (profile: ProfileManagementEntity) =>
      build_profile_management_preview_path(
        "/profile",
        (profile as PlayerProfile).profile_slug,
      ),
  };
