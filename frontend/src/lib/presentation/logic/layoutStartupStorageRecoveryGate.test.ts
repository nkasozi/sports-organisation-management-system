import { describe, expect, it, vi } from "vitest";

import type { StorageBackupSummary } from "$lib/infrastructure/backup/storageBackupContracts";

import { create_startup_storage_recovery_choice_gate } from "./layoutStartupStorageRecoveryGate";
import type { VisibleStartupStorageRecoveryPromptState } from "./layoutStorageRecovery";

const summary: StorageBackupSummary = {
  created_at: "2026-05-17T12:00:00.000Z",
  source: "device_automatic",
  total_tables: 37,
  tables_with_records: 1,
  total_records: 4,
  session_sync_marker_state: { status: "missing" },
};

const prompt_state: VisibleStartupStorageRecoveryPromptState = {
  status: "visible",
  mode: "available",
  summary,
};

describe("create_startup_storage_recovery_choice_gate", () => {
  it("shows the prompt, resolves the user choice, then hides the prompt", async () => {
    const on_prompt_state_change = vi.fn(() => true);
    const gate = create_startup_storage_recovery_choice_gate(
      on_prompt_state_change,
    );

    const choice_promise = gate.wait_for_choice(prompt_state);

    expect(on_prompt_state_change).toHaveBeenLastCalledWith(prompt_state);
    expect(gate.resolve_choice("restore")).toBe(true);
    expect(await choice_promise).toBe("restore");
    expect(on_prompt_state_change).toHaveBeenLastCalledWith({
      status: "hidden",
    });
  });

  it("ignores a choice when no prompt is waiting", () => {
    const gate = create_startup_storage_recovery_choice_gate(() => true);

    expect(gate.resolve_choice("continue")).toBe(false);
  });

  it("only resolves a waiting prompt once", async () => {
    const gate = create_startup_storage_recovery_choice_gate(() => true);

    const choice_promise = gate.wait_for_choice(prompt_state);
    gate.resolve_choice("continue");

    expect(gate.resolve_choice("restore")).toBe(false);
    expect(await choice_promise).toBe("continue");
  });
});
