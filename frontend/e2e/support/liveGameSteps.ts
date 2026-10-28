import { expect, type Page } from "@playwright/test";

import {
  find_server_record,
  list_server_records,
  type ServerRecord,
  wait_for_server_record,
} from "./convexAdmin";
import {
  choose_option,
  create_entity_through_form,
  open_create_form,
  open_from_sidebar,
} from "./ui";
import { E2E_WORLD } from "./world";

const FIXTURE_STATUS = {
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

const MATCHUP = `${E2E_WORLD.home_team} vs ${E2E_WORLD.away_team}`;
const ANY_OPTION = /./;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function read_todays_fixture(): ServerRecord {
  const fixture = list_server_records("fixtures").find(
    (record) => record.scheduled_date === today(),
  );
  expect(fixture, "today's e2e fixture should be on the server").toBeTruthy();
  return fixture as ServerRecord;
}

export function wait_for_todays_fixture(
  matches: (fixture: ServerRecord) => boolean,
  description: string,
): Promise<ServerRecord> {
  return wait_for_server_record(
    "fixtures",
    (record) => record.scheduled_date === today() && matches(record),
    description,
  );
}

export async function schedule_todays_game(page: Page): Promise<void> {
  await create_entity_through_form(page, {
    sidebar_link: "Fixtures",
    submit_label: "Create Fixture",
    options: {
      organization_id: E2E_WORLD.organization_name,
      competition_id: E2E_WORLD.competition_name,
      stage_id: ANY_OPTION,
      home_team_id: E2E_WORLD.home_team,
      away_team_id: E2E_WORLD.away_team,
      scheduled_time: ANY_OPTION,
      venue: E2E_WORLD.venue_name,
    },
    fields: { scheduled_date: today() },
  });
  await wait_for_todays_fixture(() => true, `today's fixture ${MATCHUP}`);
}

async function assign_official(
  page: Page,
  slot: number,
  official_name: string,
  role_name: string,
): Promise<void> {
  await page.getByRole("button", { name: "Add Official" }).click();
  await choose_option(page, `official_${slot}`, official_name);
  await choose_option(page, `role_${slot}`, role_name);
}

export async function assign_officials_requiring_table_official(
  page: Page,
): Promise<void> {
  await open_from_sidebar(page, "Assign Fixture Officials & Colors");
  await open_create_form(page);
  await choose_option(page, "organization_id", E2E_WORLD.organization_name);
  await choose_option(page, "competition_id", E2E_WORLD.competition_name);
  await choose_option(page, "fixture_id", new RegExp(MATCHUP));
  await assign_official(page, 0, E2E_WORLD.field_official, "Main Umpire");
  const save = page.getByRole("button", {
    name: "Create Fixture Details Setup",
  });
  await save.click();
  await expect(
    page.getByText(/Assign a table official to this game/).first(),
  ).toBeVisible();
  await expect(save).toBeVisible();
  await assign_official(page, 1, E2E_WORLD.table_official, "Table Official");
  await save.click();
  await expect(save).toBeHidden();
  const fixture = read_todays_fixture();
  await wait_for_server_record(
    "fixture_details_setups",
    (setup) => setup.fixture_id === fixture.local_id,
    "the officials assigned to today's game",
  );
}

export async function start_todays_game(page: Page): Promise<void> {
  await open_from_sidebar(page, "Live Games");
  await page.getByRole("button", { name: "Start Game" }).first().click();
  await page.getByRole("button", { name: "Confirm Start" }).click();
  await page.waitForURL(/\/live-games\/.+/);
  const fixture = await wait_for_todays_fixture(
    (record) => record.status === FIXTURE_STATUS.IN_PROGRESS,
    "today's game marked as in progress",
  );
  for (const team_name of [E2E_WORLD.home_team, E2E_WORLD.away_team]) {
    const team = find_server_record("teams", team_name);
    await wait_for_server_record(
      "fixture_lineups",
      (lineup) =>
        lineup.fixture_id === fixture.local_id &&
        lineup.team_id === team?.local_id,
      `the ${team_name} squad generated when the game started`,
    );
  }
}

export async function go_to_game(page: Page): Promise<void> {
  await open_from_sidebar(page, "Live Games");
  await page
    .getByRole("link", { name: /Go to Game|Watch Live/ })
    .first()
    .click();
  await page.waitForURL(/\/live-games\/.+/);
}

export async function end_game(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: /End Game/ })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "End Game" })
    .click();
  await wait_for_todays_fixture(
    (record) => record.status === FIXTURE_STATUS.COMPLETED,
    "the finished game on the server",
  );
}
