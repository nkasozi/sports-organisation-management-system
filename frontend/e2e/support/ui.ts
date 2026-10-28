import { expect, type Locator, type Page } from "@playwright/test";

import { E2E_DEVICE_PIN } from "./clerkSignIn";
import { is_text } from "./convexAdmin";

const PAGE_READY_TIMEOUT_MS = 120_000;
const REQUIRED_MARKER = "*";
const FORM_OPEN_TIMEOUT_MS = 5_000;
const FORM_SETTLE_MS = 2_000;

async function wait_for_app(page: Page): Promise<void> {
  const unlock_field = page.getByLabel(/^(Enter your PIN|PIN)$/);
  const user_menu = page.getByRole("button", { name: "User menu" });
  await expect(unlock_field.or(user_menu).first()).toBeVisible({
    timeout: PAGE_READY_TIMEOUT_MS,
  });
  if (await unlock_field.isVisible()) {
    await unlock_field.fill(E2E_DEVICE_PIN);
    await unlock_field.press("Enter");
  }
  await expect(user_menu).toBeVisible({ timeout: PAGE_READY_TIMEOUT_MS });
  await expect(page.getByText("Verifying access...")).toBeHidden({
    timeout: PAGE_READY_TIMEOUT_MS,
  });
}

export async function open_page(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await wait_for_app(page);
}

function sidebar(page: Page): Locator {
  return page.locator("aside, nav").filter({ hasText: "Dashboard" }).first();
}

export async function open_from_sidebar(
  page: Page,
  link_name: string,
): Promise<void> {
  await sidebar(page)
    .getByRole("link", { name: link_name, exact: true })
    .first()
    .click();
  await expect(page.getByText("Verifying access...")).toBeHidden({
    timeout: PAGE_READY_TIMEOUT_MS,
  });
}

export async function choose_option(
  page: Page,
  field_id: string,
  option_text: string | RegExp,
): Promise<void> {
  const combobox = page.locator(`#searchable-select-${field_id}`);
  const locked_to_option = async (): Promise<boolean> =>
    (await combobox.isDisabled()) &&
    is_text(option_text) &&
    (await combobox.getAttribute("placeholder")) === option_text;
  await expect
    .poll(
      async () => (await combobox.isEnabled()) || (await locked_to_option()),
      {
        message: `waiting for the ${field_id} choices to load`,
      },
    )
    .toBe(true);
  if (await locked_to_option()) return;
  await combobox.click();
  if (is_text(option_text)) await combobox.fill(option_text);
  const option_name = is_text(option_text)
    ? new RegExp(`^${option_text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
    : option_text;
  await page
    .getByRole("option", { name: option_name })
    .first()
    .dispatchEvent("mousedown");
  await expect(page.getByRole("listbox")).toBeHidden();
}

export async function fill_field(
  page: Page,
  field_id: string,
  value: string,
): Promise<void> {
  await page.locator(`#field_${field_id}`).fill(value);
}

export async function open_create_form(page: Page): Promise<void> {
  const create_new = page.getByRole("button", { name: "Create New" });
  const create_first = page.getByRole("button", { name: /^Create First/ });
  const create_button = create_new.or(create_first).first();
  await expect(async () => {
    if (await create_button.isVisible()) await create_button.click();
    await expect(create_button).toBeHidden({ timeout: FORM_OPEN_TIMEOUT_MS });
    await page.waitForTimeout(FORM_SETTLE_MS);
    await expect(create_button).toBeHidden({ timeout: FORM_SETTLE_MS });
  }).toPass({ timeout: PAGE_READY_TIMEOUT_MS });
}

export async function expect_no_sync_rejections(page: Page): Promise<void> {
  await expect(page.getByText("Some changes need your decision")).toBeHidden();
}

interface EntityFormInput {
  sidebar_link: string;
  submit_label: string;
  fields?: Record<string, string>;
  options?: Record<string, string | RegExp>;
}

export async function create_entity_through_form(
  page: Page,
  input: EntityFormInput,
): Promise<void> {
  await open_from_sidebar(page, input.sidebar_link);
  await open_create_form(page);
  for (const [field_id, option] of Object.entries(input.options ?? {}))
    await choose_option(page, field_id, option);
  for (const [field_id, value] of Object.entries(input.fields ?? {}))
    await fill_field(page, field_id, value);
  await page.getByRole("button", { name: input.submit_label }).click();
  const submit_button = page.getByRole("button", { name: input.submit_label });
  const closed = await submit_button
    .waitFor({ state: "hidden", timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  if (closed) return;
  const form_errors = await page
    .locator("main p.text-red-600, main .text-red-500, main [role=alert]")
    .allInnerTexts()
    .then((texts) => texts.filter((text) => text.trim() !== REQUIRED_MARKER));
  expect(form_errors, `"${input.submit_label}" did not save`).toEqual([]);
  expect(closed, `"${input.submit_label}" did not save`).toBe(true);
}

export async function read_sidebar_links(page: Page): Promise<string[]> {
  const links = await sidebar(page).getByRole("link").allInnerTexts();
  return [...new Set(links.map((text) => text.trim()).filter(Boolean))];
}
