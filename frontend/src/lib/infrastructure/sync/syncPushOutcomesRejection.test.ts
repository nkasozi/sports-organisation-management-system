import { describe, expect, it, vi } from "vitest";

import type { SyncOutboxEntry } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";

import { PushOutcomeKind, settle_upsert_result } from "./syncPushOutcomes";
import type { RemoteApplyDependencies } from "./syncRemoteApply";

const outbox_updates = vi.hoisted(() => ({
  mark_outbox_entry_rejected: vi.fn(async () => true),
}));

vi.mock("./syncOutboxEntryUpdates", () => ({
  confirm_outbox_entry: vi.fn(),
  mark_outbox_entry_conflicted: vi.fn(),
  mark_outbox_entry_rejected: outbox_updates.mark_outbox_entry_rejected,
}));

const ENTRY = {
  table_name: "players",
  local_id: "player_1",
} as SyncOutboxEntry;
const DEPENDENCIES = { database: {} } as RemoteApplyDependencies;
const FIELD_REASON =
  "Please check your entries: Phone should be a phone number with 7 to 15 digits, e.g. +256 700 123456.";

async function settle_rejection(
  extra: Record<string, unknown>,
): Promise<{ code: string; message: string }> {
  outbox_updates.mark_outbox_entry_rejected.mockClear();
  const outcome = await settle_upsert_result(DEPENDENCIES, ENTRY, {
    local_id: "player_1",
    success: false,
    server_version: 0,
    ...extra,
  } as never);
  expect(outcome).toBe(PushOutcomeKind.REJECTED);
  const calls = outbox_updates.mark_outbox_entry_rejected.mock
    .calls as unknown as Array<
    [unknown, unknown, { code: string; message: string }]
  >;
  return calls[0][2];
}

describe("a record the server refuses", () => {
  it("is parked with the server's own field message so the user knows what to fix", async () => {
    const rejection = await settle_rejection({
      action: "rejected_invalid_field",
      rejection_reason: FIELD_REASON,
    });
    expect(rejection).toEqual({
      code: "rejected_invalid_field",
      message: FIELD_REASON,
    });
  });

  it("falls back to the standard message for any other kind of refusal", async () => {
    const rejection = await settle_rejection({
      action: "rejected_wrong_organization",
      rejection_reason: "internal detail that must not be shown",
    });
    expect(rejection.message).toBe(
      "Record organization does not match caller organization",
    );
  });
});
