export const BULK_PLAYER_ASSIGNMENT_PAGE_TEXT = {
  access_denied:
    "Access denied: Your role does not have permission to assign players to teams. Please contact your organization administrator if you believe this is an error.",
  created_path: "/player-team-memberships/bulk-assign",
  failed_summary:
    "Assigned {success_count} player(s), but {error_count} failed. Some players may already be on this team.",
  success_summary:
    "Successfully assigned {success_count} player(s) to {team_name}",
  title: "Bulk Assign Players to Team - Sports Management",
  memberships_path: "/player-team-memberships",
  available_status: "Available",
  currently_on_prefix: "Currently on: ",
} as const;

export const BULK_PLAYER_ASSIGNMENT_SECTION_VARIANT = {
  AVAILABLE: "available",
  ASSIGNED: "assigned",
} as const;

export type BulkPlayerAssignmentSectionVariant =
  (typeof BULK_PLAYER_ASSIGNMENT_SECTION_VARIANT)[keyof typeof BULK_PLAYER_ASSIGNMENT_SECTION_VARIANT];

export const PLAYER_ASSIGNMENT_TEAM_STATUS = {
  UNASSIGNED: "unassigned",
  ASSIGNED: "assigned",
} as const;

export const BULK_PLAYER_ASSIGNMENT_SECTION_TEXT = {
  unassigned_title: "Players Without a Team",
  unassigned_description:
    "These players are not currently assigned to any team",
  unassigned_empty_search: "No unassigned players match your search.",
  unassigned_empty_default: "All players are currently assigned to a team.",
  assigned_title: "Players Already on Other Teams",
  assigned_description:
    "Selecting these will create an additional team membership",
  assigned_empty_search: "No players on other teams match your search.",
  assigned_empty_default: "No players are currently on other teams.",
  select_team_prompt: "Select a team above to see available players",
} as const;
