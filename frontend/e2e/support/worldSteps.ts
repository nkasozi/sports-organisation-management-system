import { expect, type Page } from "@playwright/test";

import {
  find_server_record,
  list_server_records,
  wait_for_named_record,
  wait_for_server_record,
} from "./convexAdmin";
import {
  choose_option,
  create_entity_through_form,
  expect_no_sync_rejections,
  fill_field,
  open_create_form,
  open_from_sidebar,
} from "./ui";
import { E2E_WORLD } from "./world";

export async function ensure_sport(page: Page): Promise<void> {
  if (find_server_record("sports", E2E_WORLD.sport_name)) return;
  await open_from_sidebar(page, "Sports");
  await open_create_form(page);
  await page.getByRole("button", { name: "Field Hockey Preset" }).click();
  await page.locator("#input-name").fill(E2E_WORLD.sport_name);
  for (const [field, value] of Object.entries(E2E_WORLD.squad_rules))
    await page.locator(`#input-${field}`).fill(String(value));
  await page.getByRole("button", { name: "Create Sport" }).click();
  await wait_for_named_record("sports", E2E_WORLD.sport_name);
  await expect_no_sync_rejections(page);
}

export async function ensure_organization(page: Page): Promise<void> {
  if (find_server_record("organizations", E2E_WORLD.organization_name)) return;
  await open_from_sidebar(page, "Organizations");
  await open_create_form(page);
  await fill_field(page, "name", E2E_WORLD.organization_name);
  await choose_option(page, "sport_id", E2E_WORLD.sport_name);
  await page.getByRole("button", { name: "Create Organization" }).click();
  await wait_for_named_record("organizations", E2E_WORLD.organization_name);
  await expect_no_sync_rejections(page);
}

const ORGANIZATION_OPTION = { organization_id: E2E_WORLD.organization_name };

function split_name(full_name: string): {
  first_name: string;
  last_name: string;
} {
  const [first_name, ...rest] = full_name.split(" ");
  return { first_name, last_name: rest.join(" ") };
}

export async function ensure_venue(page: Page): Promise<void> {
  if (find_server_record("venues", E2E_WORLD.venue_name)) return;
  await create_entity_through_form(page, {
    sidebar_link: "Venues",
    submit_label: "Create Venue",
    options: { ...ORGANIZATION_OPTION, country: "Uganda" },
    fields: { name: E2E_WORLD.venue_name, city: "Kampala" },
  });
  await wait_for_named_record("venues", E2E_WORLD.venue_name);
}

export async function ensure_team(
  page: Page,
  name: string,
  code: string,
): Promise<void> {
  if (find_server_record("teams", name)) return;
  await create_entity_through_form(page, {
    sidebar_link: "Teams",
    submit_label: "Create Team",
    options: {
      ...ORGANIZATION_OPTION,
      gender_id: "Male",
      home_venue_id: E2E_WORLD.venue_name,
    },
    fields: { name, short_name: code },
  });
  await wait_for_named_record("teams", name);
}

export async function ensure_official(
  page: Page,
  full_name: string,
): Promise<void> {
  if (find_server_record("officials", full_name)) return;
  const { first_name, last_name } = split_name(full_name);
  await create_entity_through_form(page, {
    sidebar_link: "Officials",
    submit_label: "Create Official",
    options: { ...ORGANIZATION_OPTION, gender_id: "Male" },
    fields: {
      first_name,
      last_name,
      email: `${first_name.toLowerCase()}.${last_name.toLowerCase()}@example.com`,
    },
  });
  await wait_for_named_record("officials", full_name);
}

async function ensure_player(page: Page, full_name: string): Promise<void> {
  if (find_server_record("players", full_name)) return;
  const { first_name, last_name } = split_name(full_name);
  await create_entity_through_form(page, {
    sidebar_link: "Players",
    submit_label: "Create Player",
    options: {
      ...ORGANIZATION_OPTION,
      gender_id: "Male",
      position_id: /./,
      nationality: "Uganda",
    },
    fields: { first_name, last_name, date_of_birth: "2000-01-15" },
  });
  await wait_for_named_record("players", full_name);
}

async function ensure_membership(
  page: Page,
  player_name: string,
  team_name: string,
  jersey_number: number,
): Promise<void> {
  const player = find_server_record("players", player_name);
  const existing = list_server_records("player_team_memberships").some(
    (membership) => membership.player_id === player?.local_id,
  );
  if (existing) return;
  await create_entity_through_form(page, {
    sidebar_link: "Player Team Memberships",
    submit_label: "Create Player Team Membership",
    options: {
      ...ORGANIZATION_OPTION,
      player_id: player_name,
      team_id: team_name,
    },
    fields: { start_date: "2026-01-01", jersey_number: String(jersey_number) },
  });
  await wait_for_server_record(
    "player_team_memberships",
    (membership) => membership.player_id === player?.local_id,
    `${player_name}'s membership of ${team_name}`,
  );
}

export async function ensure_squads(page: Page): Promise<void> {
  const squads = [
    { team: E2E_WORLD.home_team, players: E2E_WORLD.home_players },
    { team: E2E_WORLD.away_team, players: E2E_WORLD.away_players },
  ];
  for (const squad of squads)
    for (const [index, player_name] of squad.players.entries()) {
      await ensure_player(page, player_name);
      await ensure_membership(page, player_name, squad.team, index + 1);
    }
}

function days_from_today(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function ensure_competition(page: Page): Promise<void> {
  if (find_server_record("competitions", E2E_WORLD.competition_name)) return;
  await open_from_sidebar(page, "Competitions");
  await open_create_form(page);
  await page.locator("#input-name").fill(E2E_WORLD.competition_name);
  await choose_option(page, "organization_id", E2E_WORLD.organization_name);
  await choose_option(page, "competition_format_id", /./);
  await page.locator("#input-start_date").fill(days_from_today(-7));
  await page.locator("#input-end_date").fill(days_from_today(90));
  await page.locator("#input-max_teams").fill("8");
  await page.getByRole("checkbox", { name: E2E_WORLD.home_team }).check();
  await page.getByRole("checkbox", { name: E2E_WORLD.away_team }).check();
  await expect(page.locator("#max_event_edits_per_game")).toHaveValue(
    String(E2E_WORLD.event_edits_per_game),
  );
  await page.getByRole("button", { name: "Create Competition" }).click();
  const competition = await wait_for_named_record(
    "competitions",
    E2E_WORLD.competition_name,
  );
  for (const team_name of [E2E_WORLD.home_team, E2E_WORLD.away_team]) {
    const team = find_server_record("teams", team_name);
    await wait_for_server_record(
      "competition_teams",
      (entry) =>
        entry.competition_id === competition.local_id &&
        entry.team_id === team?.local_id,
      `${team_name} entered in ${E2E_WORLD.competition_name}`,
    );
  }
}
