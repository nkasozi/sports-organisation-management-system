import { expect, test as setup } from "@playwright/test";

import { ensure_clerk_users, sign_in_as } from "./support/clerkSignIn";
import { find_server_record, register_profile } from "./support/convexAdmin";
import { E2E_PROFILES } from "./support/profiles";
import { expect_no_sync_rejections } from "./support/ui";
import { E2E_WORLD } from "./support/world";
import {
  ensure_competition,
  ensure_official,
  ensure_organization,
  ensure_sport,
  ensure_squads,
  ensure_team,
  ensure_venue,
} from "./support/worldSteps";

function server_id(
  table: "teams" | "officials" | "players",
  label: string,
): string {
  const record = find_server_record(table, label);
  expect(record, `the e2e world should have ${table} "${label}"`).toBeTruthy();
  return record?.local_id ?? "";
}

function register_role_profiles(): void {
  const organization = find_server_record(
    "organizations",
    E2E_WORLD.organization_name,
  );
  expect(organization, "the e2e organization should be saved").toBeTruthy();
  const organization_id = organization?.local_id ?? "";
  register_profile(E2E_PROFILES.org_admin, { organization_id });
  register_profile(E2E_PROFILES.officials_manager, { organization_id });
  register_profile(E2E_PROFILES.team_manager, {
    organization_id,
    team_id: server_id("teams", E2E_WORLD.home_team),
  });
  register_profile(E2E_PROFILES.table_official, {
    organization_id,
    official_id: server_id("officials", E2E_WORLD.table_official),
  });
  register_profile(E2E_PROFILES.field_official, {
    organization_id,
    official_id: server_id("officials", E2E_WORLD.field_official),
  });
  register_profile(E2E_PROFILES.player, {
    organization_id,
    player_id: server_id("players", E2E_WORLD.home_players[0]),
  });
}

setup("build the e2e world through the app", async ({ page }) => {
  setup.setTimeout(15 * 60_000);
  await ensure_clerk_users(Object.values(E2E_PROFILES));
  register_profile(E2E_PROFILES.super_admin, { organization_id: "*" });
  await sign_in_as(page, E2E_PROFILES.super_admin);
  await ensure_sport(page);
  await ensure_organization(page);
  await ensure_venue(page);
  await ensure_team(page, E2E_WORLD.home_team, "LIO");
  await ensure_team(page, E2E_WORLD.away_team, "TIG");
  await ensure_official(page, E2E_WORLD.table_official);
  await ensure_official(page, E2E_WORLD.field_official);
  await ensure_squads(page);
  await ensure_competition(page);
  register_role_profiles();
  await expect_no_sync_rejections(page);
});
