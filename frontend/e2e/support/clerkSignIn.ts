import { createClerkClient } from "@clerk/backend";
import { expect, type Page } from "@playwright/test";

import { E2E_BASE_URL, read_clerk_secret_key } from "./environment";
import type { E2eProfile } from "./profiles";

type ClerkClient = ReturnType<typeof createClerkClient>;

function create_dev_clerk_client(): ClerkClient {
  const secret = read_clerk_secret_key();
  expect(secret.success, secret.success ? "" : secret.error).toBe(true);
  return createClerkClient({
    secretKey: secret.success ? secret.secret_key : "",
  });
}

export const E2E_DEVICE_PIN = "e2e-pin-2468";
const APP_READY_TIMEOUT_MS = 120_000;

async function ensure_clerk_user(profile: E2eProfile): Promise<string> {
  const clerk_client = create_dev_clerk_client();
  const existing = await clerk_client.users.getUserList({
    emailAddress: [profile.email],
  });
  const [found] = existing.data;
  if (found) return found.id;
  const created = await clerk_client.users.createUser({
    emailAddress: [profile.email],
    firstName: profile.first_name,
    lastName: profile.last_name,
    skipPasswordRequirement: true,
  });
  return created.id;
}

export async function ensure_clerk_users(
  profiles: E2eProfile[],
): Promise<void> {
  for (const profile of profiles) await ensure_clerk_user(profile);
}

async function create_sign_in_url(
  profile: E2eProfile,
  redirect_path: string,
): Promise<string> {
  const user_id = await ensure_clerk_user(profile);
  const agent_task = await create_dev_clerk_client().agentTasks.create({
    onBehalfOf: { userId: user_id },
    permissions: "*",
    agentName: "sportsync-e2e",
    taskDescription: `e2e sign-in as ${profile.key}`,
    redirectUrl: new URL(redirect_path, E2E_BASE_URL).toString(),
  });
  return agent_task.url;
}

const SIGN_IN_STEP_MS = 10_000;
const PIN_PROMPT_SETTLE_MS = 1_500;

async function choose_device_pin(page: Page): Promise<void> {
  await page.getByLabel("Choose a PIN").fill(E2E_DEVICE_PIN);
  await page.getByLabel("Type the PIN again").fill(E2E_DEVICE_PIN);
  await page.getByRole("button", { name: "Save PIN" }).click();
}

export async function sign_in_as(
  page: Page,
  profile: E2eProfile,
  redirect_path = "/",
): Promise<void> {
  const console_pattern = process.env.E2E_CONSOLE;
  if (console_pattern)
    page.on("console", (message) => {
      const text = message.text();
      if (new RegExp(console_pattern, "i").test(text))
        console.log("[e2e] Browser console message", {
          event: "e2e_browser_console",
          type: message.type(),
          text: text.slice(0, 500),
        });
    });
  await page.goto(await create_sign_in_url(profile, redirect_path));
  const pin_field = page.getByLabel("Choose a PIN");
  const signed_in_menu = page
    .getByRole("button", { name: "User menu" })
    .filter({ hasText: `${profile.first_name} ${profile.last_name}` });
  await expect(async () => {
    if (await pin_field.isVisible()) await choose_device_pin(page);
    await expect(signed_in_menu).toBeVisible({ timeout: SIGN_IN_STEP_MS });
    await page.waitForTimeout(PIN_PROMPT_SETTLE_MS);
    await expect(pin_field).toBeHidden({ timeout: 0 });
  }).toPass({ timeout: APP_READY_TIMEOUT_MS });
  await expect(
    page.getByText("Please wait while we sync your data"),
  ).toBeHidden({ timeout: APP_READY_TIMEOUT_MS });
}
