import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const DIRECT_SYNCING_STORE_BINDING = "$is_syncing";
const SYNC_STATUS_BUTTON_RADIUS_CLASS = "rounded-[0.175rem]";
const LEGACY_SYNC_STATUS_BUTTON_RADIUS_CLASS = "rounded-lg";
const MANUAL_SYNCING_STORE_SUBSCRIPTION = "is_syncing.subscribe(";
const MANUAL_PERCENTAGE_STORE_SUBSCRIPTION = "sync_percentage.subscribe(";
const MANUAL_PROGRESS_STORE_SUBSCRIPTION = "sync_progress.subscribe(";
const MANUAL_LAST_SYNC_STORE_SUBSCRIPTION = "last_sync_time.subscribe(";
const MANUAL_ERROR_STORE_SUBSCRIPTION = "sync_error.subscribe(";

function read_sync_status_indicator_source(): string {
  return readFileSync(
    new URL("./SyncStatusIndicator.svelte", import.meta.url),
    "utf8",
  );
}

describe("SyncStatusIndicator source contract", () => {
  it("uses direct Svelte store bindings for sync state updates", () => {
    const source = read_sync_status_indicator_source();

    expect(source).toContain(DIRECT_SYNCING_STORE_BINDING);
    expect(source).not.toContain(MANUAL_SYNCING_STORE_SUBSCRIPTION);
    expect(source).not.toContain(MANUAL_PERCENTAGE_STORE_SUBSCRIPTION);
    expect(source).not.toContain(MANUAL_PROGRESS_STORE_SUBSCRIPTION);
    expect(source).not.toContain(MANUAL_LAST_SYNC_STORE_SUBSCRIPTION);
    expect(source).not.toContain(MANUAL_ERROR_STORE_SUBSCRIPTION);
  });

  it("uses the shared glass panel radius on the sync status button", () => {
    const source = read_sync_status_indicator_source();

    expect(source).toContain(SYNC_STATUS_BUTTON_RADIUS_CLASS);
    expect(source).not.toContain(LEGACY_SYNC_STATUS_BUTTON_RADIUS_CLASS);
  });
});
