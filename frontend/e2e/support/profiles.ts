export const E2E_ROLE = {
  SUPER_ADMIN: "super_admin",
  ORG_ADMIN: "org_admin",
  OFFICIALS_MANAGER: "officials_manager",
  TEAM_MANAGER: "team_manager",
  TABLE_OFFICIAL: "table_official",
  FIELD_OFFICIAL: "field_official",
  PLAYER: "player",
} as const;

export type E2eRole = (typeof E2E_ROLE)[keyof typeof E2E_ROLE];

export type AppRole =
  | "super_admin"
  | "org_admin"
  | "officials_manager"
  | "team_manager"
  | "official"
  | "player";

export interface E2eProfile {
  key: E2eRole;
  app_role: AppRole;
  email: string;
  first_name: string;
  last_name: string;
}

function build_profile(
  key: E2eRole,
  app_role: AppRole,
  first_name: string,
  last_name: string,
): E2eProfile {
  return {
    key,
    app_role,
    email: `e2e-${key.replace(/_/g, "-")}+clerk_test@example.com`,
    first_name,
    last_name,
  };
}

export const E2E_PROFILES: Record<E2eRole, E2eProfile> = {
  super_admin: build_profile("super_admin", "super_admin", "E2E", "SuperAdmin"),
  org_admin: build_profile("org_admin", "org_admin", "Olivia", "Admin"),
  officials_manager: build_profile(
    "officials_manager",
    "officials_manager",
    "Moses",
    "Okello",
  ),
  team_manager: build_profile("team_manager", "team_manager", "Tina", "Coach"),
  table_official: build_profile(
    "table_official",
    "official",
    "Grace",
    "Akello",
  ),
  field_official: build_profile(
    "field_official",
    "official",
    "Peter",
    "Mukasa",
  ),
  player: build_profile("player", "player", "Robert", "Kizza"),
};
