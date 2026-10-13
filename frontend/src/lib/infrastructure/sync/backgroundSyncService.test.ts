import { writable } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChangeTrackingGate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";

import {
  create_orchestrator,
  flush_async_work,
  PENDING_ENTRY,
  stub_browser_globals,
  SUCCESSFUL_PUSH_RESULT,
} from "./backgroundSyncService.test_support";
import { DEBOUNCE_DELAY_MS } from "./backgroundSyncSharedState";
import type { create_fake_sync_database } from "./syncFakeDatabase.test_support";

const harness = vi.hoisted(() => ({
  signed_in: { value: true },
  fake: { current: undefined as unknown },
}));

vi.mock("$lib/adapters/iam/clerkAuthService", () => ({
  is_signed_in: {
    subscribe: (listener: (value: boolean) => void) =>
      writable(harness.signed_in.value).subscribe(listener),
  },
}));

vi.mock("$lib/adapters/repositories/database", async () => {
  const fake_module = await import("./syncFakeDatabase.test_support");
  const fake = fake_module.create_fake_sync_database();
  harness.fake.current = fake;
  return { get_database: () => fake.database };
});

vi.mock("../backup/storageBackupScheduler", () => ({
  schedule_automatic_device_backup_write: vi.fn(() => true),
  cancel_automatic_device_backup_write: vi.fn(() => true),
}));

type FakeDatabase = ReturnType<typeof create_fake_sync_database>;

interface LoadedService {
  service: typeof import("./backgroundSyncService");
  gate: ChangeTrackingGate;
  notify_local_change(): boolean;
  fake: FakeDatabase;
}

async function load_service(): Promise<LoadedService> {
  vi.resetModules();
  const service = await import("./backgroundSyncService");
  const gate_module =
    await import("$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate");
  const notifier_module =
    await import("$lib/adapters/repositories/syncOutbox/syncLocalChangeNotifier");
  return {
    service,
    gate: gate_module.sync_change_tracking_gate,
    notify_local_change: () =>
      notifier_module.sync_local_change_notifier.notify("teams", 1),
    fake: harness.fake.current as FakeDatabase,
  };
}

describe("backgroundSyncService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    harness.signed_in.value = true;
    stub_browser_globals();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts and stops exactly once", async () => {
    const { service } = await load_service();
    expect(service.start_background_sync()).toBe(true);
    expect(service.start_background_sync()).toBe(false);
    expect(service.stop_background_sync()).toBe(true);
    expect(service.stop_background_sync()).toBe(false);
  });

  it("keeps its configuration across stop and start so restores and logins can sync again", async () => {
    const { service, notify_local_change } = await load_service();
    const orchestrator = create_orchestrator();
    service.configure_orchestrator(orchestrator);
    service.start_background_sync();
    service.stop_background_sync();
    service.start_background_sync();
    notify_local_change();
    await vi.advanceTimersByTimeAsync(DEBOUNCE_DELAY_MS);
    expect(orchestrator.sync_now).toHaveBeenCalledWith("push");
  });

  it("keeps tracking local edits while sync is stopped or suspended", async () => {
    const { service, gate } = await load_service();
    const user_transaction = { id: "user_edit" };
    expect(gate.should_track_write(user_transaction)).toBe(true);
    service.start_background_sync();
    service.set_pulling_from_remote(true);
    expect(gate.should_track_write(user_transaction)).toBe(true);
    expect(service.get_background_sync_status().is_running).toBe(true);
    service.stop_background_sync();
    expect(gate.should_track_write(user_transaction)).toBe(true);
  });

  it("reports pending changes from the durable outbox", async () => {
    const { service, fake } = await load_service();
    fake.seed("sync_outbox", [PENDING_ENTRY]);
    expect(await service.get_unsynced_local_change_count()).toEqual({
      success: true,
      data: 1,
    });
    expect(service.has_pending_unsynced_changes()).toBe(true);
  });

  it("flushes pending changes through a push run and fails when the push fails", async () => {
    const { service, fake } = await load_service();
    service.configure_orchestrator(create_orchestrator(false));
    service.start_background_sync();
    fake.seed("sync_outbox", [PENDING_ENTRY]);
    const warmed_count = await service.get_unsynced_local_change_count();
    expect(warmed_count.success).toBe(true);
    const flush = service.flush_pending_changes();
    await flush_async_work();
    expect(await flush).toEqual({
      success: false,
      error: "Flush failed — check logs for push sync errors",
    });
  });

  it("flushes changes found in the live outbox even when the cached summary is stale", async () => {
    const { service, fake } = await load_service();
    const orchestrator = create_orchestrator();
    orchestrator.sync_now.mockImplementation(async () => {
      await fake.database.table("sync_outbox").delete(["teams", "team_a"]);
      return SUCCESSFUL_PUSH_RESULT;
    });
    service.configure_orchestrator(orchestrator);
    service.start_background_sync();
    fake.seed("sync_outbox", [PENDING_ENTRY]);
    const flush = service.flush_pending_changes();
    await flush_async_work();
    expect(await flush).toEqual({
      success: true,
      data: { skipped_offline: false },
    });
    expect(orchestrator.sync_now).toHaveBeenCalledWith("push");
  });

  it("does not push when the live outbox is empty even if the cached summary still counts changes", async () => {
    const { service, fake } = await load_service();
    const orchestrator = create_orchestrator();
    service.configure_orchestrator(orchestrator);
    service.start_background_sync();
    fake.seed("sync_outbox", [PENDING_ENTRY]);
    const warmed_count = await service.get_unsynced_local_change_count();
    expect(warmed_count).toEqual({ success: true, data: 1 });
    await fake.database.table("sync_outbox").delete(["teams", "team_a"]);
    orchestrator.sync_now.mockClear();
    expect(await service.flush_pending_changes()).toEqual({
      success: true,
      data: { skipped_offline: false },
    });
    expect(orchestrator.sync_now).not.toHaveBeenCalled();
  });

  it("skips flushing while offline", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    const { service, fake } = await load_service();
    service.start_background_sync();
    fake.seed("sync_outbox", [PENDING_ENTRY]);
    const live_count = await service.get_unsynced_local_change_count();
    expect(live_count).toEqual({ success: true, data: 1 });
    expect(await service.flush_pending_changes()).toEqual({
      success: true,
      data: { skipped_offline: true },
    });
  });
});
