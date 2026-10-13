import { describe, expect, it, vi } from "vitest";

import type { StorageBackupRestoreState } from "$lib/infrastructure/backup/storageBackupRestoreTypes";

import {
  begin_storage_backup_import,
  confirm_storage_backup_import,
} from "./settingsDataManagementLogic";
import {
  awaiting_state,
  prepared_restore,
  summary,
} from "./settingsDataManagementTestFixtures";

interface StateHolder {
  state: StorageBackupRestoreState;
  published_statuses: string[];
  publish_state: (next_state: StorageBackupRestoreState) => boolean;
}

function create_state_holder(
  initial_state: StorageBackupRestoreState,
): StateHolder {
  const holder: StateHolder = {
    state: initial_state,
    published_statuses: [],
    publish_state: (next_state: StorageBackupRestoreState): boolean => {
      holder.state = next_state;
      holder.published_statuses.push(next_state.status);
      return true;
    },
  };
  return holder;
}

describe("storage backup import busy states", () => {
  it("publishes the validating state before the backup file is read", async () => {
    const holder = create_state_holder({ status: "idle" });
    const statuses_seen_while_loading: string[] = [];

    await begin_storage_backup_import({
      current_state: holder.state,
      publish_state: holder.publish_state,
      load_serialized_backup: async () => {
        statuses_seen_while_loading.push(holder.state.status);
        return "{}";
      },
      prepare_backup_restore: async () => ({
        type: "validation_passed",
        prepared_restore,
      }),
    });

    expect(statuses_seen_while_loading).toEqual(["validating"]);
    expect(holder.published_statuses).toEqual([
      "validating",
      "awaiting_confirmation",
    ]);
  });

  it("publishes the restoring state first and rejects a second confirmation", async () => {
    const holder = create_state_holder(awaiting_state);
    const restore_prepared_backup = vi.fn(async () => ({
      type: "restore_succeeded" as const,
      summary,
    }));
    const command = {
      publish_state: holder.publish_state,
      restore_prepared_backup,
      show_toast: vi.fn(),
      refresh_page: vi.fn(),
    };

    const first_confirmation = confirm_storage_backup_import({
      ...command,
      current_state: holder.state,
    });
    const second_confirmation = confirm_storage_backup_import({
      ...command,
      current_state: holder.state,
    });
    await Promise.all([first_confirmation, second_confirmation]);

    expect(restore_prepared_backup).toHaveBeenCalledTimes(1);
    expect(holder.published_statuses).toEqual(["restoring", "succeeded"]);
  });
});
