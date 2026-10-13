export const ORGANIZATION_A_ID = "org_a";
export const ORGANIZATION_B_ID = "org_b";
export const GLOBAL_SCOPE_ID = "*";

export const SUPER_ADMIN_EMAIL = "root@example.com";
const SECOND_SUPER_ADMIN_EMAIL = "root.two@example.com";
export const ORGANIZATION_A_ADMIN_EMAIL = "admin.a@example.com";
export const ORGANIZATION_B_ADMIN_EMAIL = "admin.b@example.com";
export const ORGANIZATION_A_PLAYER_EMAIL = "player.a@example.com";
const ORGANIZATION_A_TEAM_MANAGER_EMAIL = "manager.a@example.com";
export const UNSCOPED_USER_EMAIL = "nobody@example.com";
export const STRANGER_EMAIL = "stranger@example.com";

const SUPER_ADMIN_USER = {
  local_id: "user_root",
  email: SUPER_ADMIN_EMAIL,
  role: "super_admin",
  organization_id: GLOBAL_SCOPE_ID,
  status: "active",
  synced_at: "2024-01-01T00:00:00.000Z",
  version: 1,
};

export const SECOND_SUPER_ADMIN_USER = {
  ...SUPER_ADMIN_USER,
  local_id: "user_root_two",
  email: SECOND_SUPER_ADMIN_EMAIL,
};

const ORGANIZATION_A_ADMIN_USER = {
  local_id: "user_admin_a",
  email: ORGANIZATION_A_ADMIN_EMAIL,
  role: "org_admin",
  organization_id: ORGANIZATION_A_ID,
  status: "active",
  synced_at: "2024-01-01T00:00:00.000Z",
  version: 1,
};

const ORGANIZATION_B_ADMIN_USER = {
  ...ORGANIZATION_A_ADMIN_USER,
  local_id: "user_admin_b",
  email: ORGANIZATION_B_ADMIN_EMAIL,
  organization_id: ORGANIZATION_B_ID,
};

const ORGANIZATION_A_PLAYER_USER = {
  ...ORGANIZATION_A_ADMIN_USER,
  local_id: "user_player_a",
  email: ORGANIZATION_A_PLAYER_EMAIL,
  role: "player",
};

const ORGANIZATION_A_TEAM_MANAGER_USER = {
  ...ORGANIZATION_A_ADMIN_USER,
  local_id: "user_manager_a",
  email: ORGANIZATION_A_TEAM_MANAGER_EMAIL,
  role: "team_manager",
};

const UNSCOPED_ORG_ADMIN_USER = {
  local_id: "user_nobody",
  email: UNSCOPED_USER_EMAIL,
  role: "org_admin",
  status: "active",
  synced_at: "2024-01-01T00:00:00.000Z",
  version: 1,
};

export const ALL_FIXTURE_USERS = [
  SUPER_ADMIN_USER,
  ORGANIZATION_A_ADMIN_USER,
  ORGANIZATION_B_ADMIN_USER,
  ORGANIZATION_A_PLAYER_USER,
  ORGANIZATION_A_TEAM_MANAGER_USER,
  UNSCOPED_ORG_ADMIN_USER,
];

export function build_team_record(
  local_id: string,
  organization_id: string,
  version: number,
): Record<string, unknown> {
  return {
    local_id,
    organization_id,
    name: `Team ${local_id}`,
    synced_at: "2024-01-01T00:00:00.000Z",
    version,
  };
}

export function build_player_record(
  local_id: string,
  organization_id: string,
): Record<string, unknown> {
  return {
    local_id,
    organization_id,
    first_name: "Pat",
    last_name: "Keeper",
    email: "pat.keeper@example.com",
    phone: "+256700000000",
    date_of_birth: "2001-02-03",
    emergency_contact_name: "Sam Keeper",
    emergency_contact_phone: "+256700000001",
    medical_notes: "asthma",
    nationality: "UG",
    status: "active",
    synced_at: "2024-01-01T00:00:00.000Z",
    version: 1,
  };
}
