interface HeaderUserMenuDetailRow {
  label: string;
  value: string;
}

interface BuildHeaderUserMenuDetailsCommand {
  current_profile_email: string;
  current_user_role_display: string;
  current_profile_organization_name: string;
  current_profile_team_id: string;
  current_profile_team_name: string;
}

const DETAIL_LABEL_EMAIL = "Email";
const DETAIL_LABEL_ROLE = "Role";
const DETAIL_LABEL_ORGANIZATION = "Org";
const DETAIL_LABEL_TEAM = "Team";
const TEAM_SCOPE_ALL = "All Teams";
const TEAM_SCOPE_WILDCARD = "*";

function create_header_user_menu_detail_row(
  label: string,
  value: string,
): HeaderUserMenuDetailRow | null {
  const normalized_value = value.trim();
  if (!normalized_value) {
    return null;
  }

  return {
    label,
    value: normalized_value,
  };
}

function format_header_user_menu_team_value(
  current_profile_team_id: string,
  current_profile_team_name: string,
): string {
  const normalized_team_id = current_profile_team_id.trim();
  if (!normalized_team_id) {
    return "";
  }

  if (normalized_team_id === TEAM_SCOPE_WILDCARD) {
    return TEAM_SCOPE_ALL;
  }

  const normalized_team_name = current_profile_team_name.trim();
  if (normalized_team_name) {
    return normalized_team_name;
  }

  return normalized_team_id;
}

export function build_header_user_menu_details(
  command: BuildHeaderUserMenuDetailsCommand,
): HeaderUserMenuDetailRow[] {
  const header_user_menu_detail_rows = [
    create_header_user_menu_detail_row(
      DETAIL_LABEL_EMAIL,
      command.current_profile_email,
    ),
    create_header_user_menu_detail_row(
      DETAIL_LABEL_ROLE,
      command.current_user_role_display,
    ),
    create_header_user_menu_detail_row(
      DETAIL_LABEL_ORGANIZATION,
      command.current_profile_organization_name,
    ),
    create_header_user_menu_detail_row(
      DETAIL_LABEL_TEAM,
      format_header_user_menu_team_value(
        command.current_profile_team_id,
        command.current_profile_team_name,
      ),
    ),
  ];

  return header_user_menu_detail_rows.filter(
    (
      header_user_menu_detail_row,
    ): header_user_menu_detail_row is HeaderUserMenuDetailRow =>
      header_user_menu_detail_row !== null,
  );
}
