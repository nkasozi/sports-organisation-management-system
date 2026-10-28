import { expect, type Locator, type Page } from "@playwright/test";

import { E2E_WORLD } from "./world";

const REASON_REQUIRED =
  "Say why you're changing this event. The reason is shown in the match log.";
export const FIRST_REASON = "Umpire confirmed the goal came in the 12th minute";
export const SECOND_REASON = "Goal disallowed after the umpires conferred";
export const THIRD_REASON = "Video check put the goal at 13 minutes";
const ALL_REASONS = [FIRST_REASON, SECOND_REASON, THIRD_REASON];

const EVENT_ACTION = { EDIT: "Edit", DELETE: "Delete" } as const;
type EventAction = (typeof EVENT_ACTION)[keyof typeof EVENT_ACTION];

export function edit_allowance(page: Page): Locator {
  return page.getByText(/event edits/).first();
}

export function corrections_heading(page: Page, count: number): Locator {
  return page.getByText(`Corrections (${count})`);
}

export function event_action_buttons(page: Page): Locator {
  return page.getByRole("button", { name: /^(Edit|Delete) Goal/ });
}

function event_button(
  page: Page,
  action: EventAction,
  scorer: string,
): Locator {
  return page.getByRole("button", {
    name: new RegExp(`^${action} Goal .* ${scorer}$`),
  });
}

export async function record_home_goal(
  page: Page,
  scorer: string,
): Promise<void> {
  await page
    .getByRole("button", {
      name: `Goal for ${E2E_WORLD.home_team}`,
      exact: true,
    })
    .click();
  await page.locator("#searchable-select-event_player").click();
  await page
    .getByRole("option", { name: new RegExp(scorer) })
    .first()
    .dispatchEvent("mousedown");
  await page.getByRole("button", { name: /Record Event/ }).click();
  await expect(page.getByRole("button", { name: /Record Event/ })).toBeHidden();
}

export async function edit_goal_minute(
  page: Page,
  command: { scorer: string; minute: number; reason: string },
): Promise<void> {
  await event_button(page, EVENT_ACTION.EDIT, command.scorer).click();
  const dialog = page.getByRole("dialog", { name: "Edit event" });
  await dialog.locator("#edit_event_minute").fill(String(command.minute));
  await dialog.locator("#correction_reason").fill(command.reason);
  await dialog.getByRole("button", { name: /Save Changes/ }).click();
  await expect(dialog).toBeHidden();
}

export async function expect_reason_is_required(
  page: Page,
  scorer: string,
): Promise<void> {
  await event_button(page, EVENT_ACTION.EDIT, scorer).click();
  const dialog = page.getByRole("dialog", { name: "Edit event" });
  await expect(
    dialog.getByText(/uses 1 of your 3 remaining edits/),
  ).toBeVisible();
  await dialog.locator("#edit_event_minute").fill("12");
  await dialog.getByRole("button", { name: /Save Changes/ }).click();
  await expect(dialog.getByText(REASON_REQUIRED)).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
}

export async function delete_goal(
  page: Page,
  command: { scorer: string; reason: string },
): Promise<void> {
  await event_button(page, EVENT_ACTION.DELETE, command.scorer).click();
  const dialog = page.getByRole("dialog", { name: "Delete event" });
  await dialog.locator("#correction_reason").fill(command.reason);
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(dialog).toBeHidden();
}

export async function reset_game_edits(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Reset edits" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reset edits" })
    .click();
}

export async function expect_all_reasons_visible(page: Page): Promise<void> {
  await expect(corrections_heading(page, 4)).toBeVisible();
  for (const reason of ALL_REASONS)
    await expect(page.getByText(reason).first()).toBeVisible();
}

export async function expand_all_audit_entries(page: Page): Promise<void> {
  const show_all = page.getByRole("button", { name: /^Show all changes/ });
  await expect(show_all.first()).toBeVisible();
  while ((await show_all.count()) > 0) await show_all.first().click();
}
