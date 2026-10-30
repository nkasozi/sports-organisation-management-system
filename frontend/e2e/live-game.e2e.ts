import { expect, test } from "@playwright/test";

import { sign_in_as } from "./support/clerkSignIn";
import { reset_games } from "./support/convexAdmin";
import {
  corrections_heading,
  delete_goal,
  edit_allowance,
  edit_goal_minute,
  event_action_buttons,
  expand_all_audit_entries,
  expect_all_reasons_visible,
  expect_reason_is_required,
  FIRST_REASON,
  record_home_goal,
  reset_game_edits,
  SECOND_REASON,
  THIRD_REASON,
} from "./support/liveGameCorrections";
import {
  assign_officials_requiring_table_official,
  end_game,
  go_to_game,
  read_todays_fixture,
  schedule_todays_game,
  start_todays_game,
  wait_for_todays_fixture,
} from "./support/liveGameSteps";
import { E2E_PROFILES } from "./support/profiles";
import { expect_no_sync_rejections, open_from_sidebar } from "./support/ui";
import { E2E_WORLD } from "./support/world";

test.describe.configure({ mode: "serial" });

const [FIRST_SCORER, SECOND_SCORER] = E2E_WORLD.home_players;

test.beforeAll(() => {
  if (!process.env.E2E_KEEP_GAMES) reset_games(E2E_WORLD.organization_name);
});

test("the org admin schedules today's game", async ({ page }) => {
  await sign_in_as(page, E2E_PROFILES.org_admin);
  await schedule_todays_game(page);
});

test("the officials manager must give the game a table official", async ({
  page,
}) => {
  await sign_in_as(page, E2E_PROFILES.officials_manager);
  await assign_officials_requiring_table_official(page);
});

test("an official who isn't the table official can only watch", async ({
  page,
}) => {
  await sign_in_as(page, E2E_PROFILES.field_official);
  await open_from_sidebar(page, "Live Games");
  await expect(page.getByText(E2E_WORLD.home_team).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Game" })).toHaveCount(0);
});

test("the table official starts the game", async ({ page }) => {
  await sign_in_as(page, E2E_PROFILES.table_official);
  await start_todays_game(page);
  await expect_no_sync_rejections(page);
});

test("the table official fixes mistakes until the game's edits run out", async ({
  page,
}) => {
  await sign_in_as(page, E2E_PROFILES.table_official);
  await go_to_game(page);
  await expect(page.getByTestId("live-audience-bar")).toContainText(/watching/);
  await expect(edit_allowance(page)).toHaveText(/3 of 3 event edits left/);
  await record_home_goal(page, FIRST_SCORER);
  await record_home_goal(page, SECOND_SCORER);
  await expect_reason_is_required(page, FIRST_SCORER);

  const edit = { scorer: FIRST_SCORER, minute: 12, reason: FIRST_REASON };
  await edit_goal_minute(page, edit);
  await expect(edit_allowance(page)).toHaveText(/2 of 3 event edits left/);
  await expect(page.getByText(FIRST_REASON)).toBeVisible();
  await delete_goal(page, { scorer: SECOND_SCORER, reason: SECOND_REASON });
  await expect(edit_allowance(page)).toHaveText(/1 of 3 event edits left/);
  await edit_goal_minute(page, { ...edit, minute: 13, reason: THIRD_REASON });

  await expect(edit_allowance(page)).toHaveText(
    /You've used all 3 event edits for this game/,
  );
  await expect(
    page.getByText(/ask your officials manager to reset this game's edits/),
  ).toBeVisible();
  await expect(event_action_buttons(page)).toHaveCount(0);
  await expect(corrections_heading(page, 3)).toBeVisible();
  await expect(
    page.getByText(new RegExp(`Removed Goal \\d+' ${SECOND_SCORER}`)),
  ).toBeVisible();
  await wait_for_todays_fixture(
    (fixture) => fixture.event_edits_used === 3,
    "the three corrections on the server",
  );
  await expect_no_sync_rejections(page);
});

test("the officials manager sees the used edits and gives the game a fresh set", async ({
  page,
}) => {
  await sign_in_as(page, E2E_PROFILES.officials_manager);
  await go_to_game(page);
  await expect(edit_allowance(page)).toHaveText(
    /The table official has used 3 of 3 event edits in this game/,
  );
  await reset_game_edits(page);
  await expect(edit_allowance(page)).toHaveText(
    /The table official has used 0 of 3 event edits in this game/,
  );
  await expect(corrections_heading(page, 4)).toBeVisible();
  await wait_for_todays_fixture(
    (fixture) => fixture.event_edits_used === 0,
    "the reset on the server",
  );
  await expect_no_sync_rejections(page);
});

test("the table official gets edits back, ends the game and can't change it after", async ({
  page,
}) => {
  await sign_in_as(page, E2E_PROFILES.table_official);
  await go_to_game(page);
  await expect(edit_allowance(page)).toHaveText(/3 of 3 event edits left/);
  await expect(event_action_buttons(page)).toHaveCount(2);
  await end_game(page);
  await page.reload();
  await expect(corrections_heading(page, 4)).toBeVisible();
  await expect(event_action_buttons(page)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: `Goal for ${E2E_WORLD.home_team}` }),
  ).toHaveCount(0);
});

test("the org admin sees the corrections in the match report", async ({
  page,
}) => {
  await sign_in_as(page, E2E_PROFILES.org_admin);
  await page.goto(`/match-report/${read_todays_fixture().local_id}`);
  await expect_all_reasons_visible(page);
  await expect(page.getByTestId("live-viewer-stats")).toContainText(
    /\d+ (person|people) followed live/,
  );
});

test("the org admin finds every correction in the audit trail", async ({
  page,
}) => {
  await sign_in_as(page, E2E_PROFILES.org_admin);
  await open_from_sidebar(page, "Audit Trail");
  await expand_all_audit_entries(page);
  await expect(page.getByText(SECOND_REASON).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page
      .getByText(
        `${E2E_PROFILES.table_official.first_name} ${E2E_PROFILES.table_official.last_name}`,
      )
      .first(),
  ).toBeVisible();
});

test("an official watching the game can read why events were changed", async ({
  page,
}) => {
  await sign_in_as(page, E2E_PROFILES.field_official);
  await page.goto(`/live-games/${read_todays_fixture().local_id}`);
  await expect_all_reasons_visible(page);
  await expect(page.getByRole("button", { name: "Reset edits" })).toHaveCount(
    0,
  );
  await expect(event_action_buttons(page)).toHaveCount(0);
});

test("the public can follow the result and read why events were changed", async ({
  page,
}) => {
  await page.goto("/competition-results");
  const pickers = page.locator("main select");
  await pickers.nth(0).selectOption({ label: E2E_WORLD.organization_name });
  await pickers.nth(1).selectOption({ label: E2E_WORLD.competition_name });
  await page.getByRole("button", { name: /Results/ }).click();
  await expect(page.getByText(E2E_WORLD.home_team).first()).toBeVisible();
  await page.goto(`/match-report/${read_todays_fixture().local_id}`);
  await expect_all_reasons_visible(page);
});
