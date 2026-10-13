import type { UserProfile } from "./auth";

const ORGANISATION_ID = "org_1";
const ORGANISATION_NAME = "Test Organisation";
const ALL_SCOPE = "*";

const SUPER_ADMIN_PROFILE = {
  id: "test-super-admin",
  display_name: "Super Admin",
  email: "admin@test.com",
  role: "super_admin",
  organization_id: ALL_SCOPE,
  organization_name: "All Organisations",
  team_id: ALL_SCOPE,
};

const ORG_ADMIN_PROFILE = {
  id: "test-org-admin",
  display_name: "Organisation Admin",
  email: "orgadmin@test.com",
  role: "org_admin",
  organization_id: ORGANISATION_ID,
  organization_name: ORGANISATION_NAME,
  team_id: ALL_SCOPE,
};

const OFFICIALS_MANAGER_PROFILE = {
  id: "test-officials-manager",
  display_name: "Officials Manager",
  email: "officials@test.com",
  role: "officials_manager",
  organization_id: ORGANISATION_ID,
  organization_name: ORGANISATION_NAME,
  team_id: ALL_SCOPE,
};

const TEAM_MANAGER_PROFILE = {
  id: "test-team-manager",
  display_name: "Team Manager",
  email: "manager@test.com",
  role: "team_manager",
  organization_id: ORGANISATION_ID,
  organization_name: ORGANISATION_NAME,
  team_id: "team_1",
};

const OFFICIAL_PROFILE = {
  id: "test-official",
  display_name: "Michael Anderson",
  email: "michael@test.com",
  role: "official",
  organization_id: ORGANISATION_ID,
  organization_name: ORGANISATION_NAME,
  team_id: ALL_SCOPE,
  official_id: "official_1",
};

const PLAYER_PROFILE = {
  id: "test-player",
  display_name: "Denis Onyango",
  email: "denis@test.com",
  role: "player",
  organization_id: ORGANISATION_ID,
  organization_name: ORGANISATION_NAME,
  team_id: "team_1",
  player_id: "player_1",
};

export function create_test_profiles(): UserProfile[] {
  return [
    { ...SUPER_ADMIN_PROFILE },
    { ...ORG_ADMIN_PROFILE },
    { ...OFFICIALS_MANAGER_PROFILE },
    { ...TEAM_MANAGER_PROFILE },
    { ...OFFICIAL_PROFILE },
    { ...PLAYER_PROFILE },
  ] as UserProfile[];
}
