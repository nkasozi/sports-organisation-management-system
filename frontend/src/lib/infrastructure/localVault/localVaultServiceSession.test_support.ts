import { expect } from "vitest";

import type { PendingLocalVaultKey } from "./localVaultContracts";
import {
  create_local_vault_test_harness,
  expect_success,
  type LocalVaultTestHarness,
  TEST_NOW,
} from "./localVaultService.test_support";

const MINUTE = 60 * 1000;
export const TEST_PIN = "246810";

export function move_clock(
  harness: LocalVaultTestHarness,
  minutes: number,
): boolean {
  harness.clock.now = new Date(TEST_NOW.getTime() + minutes * MINUTE);
  return true;
}

export function reload_page(
  harness: LocalVaultTestHarness,
): LocalVaultTestHarness {
  return create_local_vault_test_harness(
    {},
    harness.database_name,
    harness.clock,
  );
}

export async function activate_pin_vault(
  harness: LocalVaultTestHarness,
): Promise<PendingLocalVaultKey> {
  const pending = await harness.service.create_pin_unlock(TEST_PIN);
  if (!pending.success) return expect.unreachable(pending.error);
  await expect_success(harness.service.activate_pending_vault(pending.data));
  return pending.data;
}

export async function read_session_status(
  harness: LocalVaultTestHarness,
): Promise<string> {
  const stored = await harness.unlock_session_storage.read_record();
  if (!stored.success) return expect.unreachable(stored.error);
  return stored.data.status;
}
