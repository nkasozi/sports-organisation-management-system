import { writable } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { create_success_result } from "$lib/core/types/Result";

import {
  create_orchestrator,
  stub_browser_globals,
} from "./backgroundSyncService.test_support";

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

async function load_service(): Promise<{
  service: typeof import("./backgroundSyncService");
}> {
  vi.resetModules();
  return { service: await import("./backgroundSyncService") };
}

describe("backgroundSyncService runs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    harness.signed_in.value = true;
    stub_browser_globals();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps realtime subscriptions running during a full page-reload sync", async () => {
    const { service } = await load_service();
    const orchestrator = create_orchestrator();
    const handlers = {
      stop_remote_sync: vi.fn(() => create_success_result(true)),
      start_remote_sync: vi.fn(() => create_success_result(true)),
    };
    service.configure_orchestrator(orchestrator);
    service.configure_restoration_handlers(handlers);
    service.configure_remote_subscriber({
      start: () => create_success_result(true),
      stop: () => create_success_result(true),
      is_running: () => true,
      get_cached_table_timestamps: () => ({}),
    });
    service.start_background_sync();
    await service.trigger_full_sync_on_page_reload();
    expect(orchestrator.sync_now).toHaveBeenCalledWith("bidirectional", {
      use_fresh_timestamps: true,
    });
    expect(handlers.stop_remote_sync).not.toHaveBeenCalled();
    expect(handlers.start_remote_sync).not.toHaveBeenCalled();
  });

  it("never stays stuck syncing when the orchestrator throws", async () => {
    const { service } = await load_service();
    const sync_now = vi.fn(() => Promise.reject(new Error("boom")));
    service.configure_orchestrator({ sync_now, is_configured: () => true });
    service.start_background_sync();
    await service.trigger_full_sync_on_page_reload();
    await service.trigger_full_sync_on_page_reload();
    expect(sync_now).toHaveBeenCalledTimes(2);
  });

  it("skips runs for signed-out users without failing", async () => {
    harness.signed_in.value = false;
    const { service } = await load_service();
    const orchestrator = create_orchestrator();
    service.configure_orchestrator(orchestrator);
    service.start_background_sync();
    await service.trigger_full_sync_on_page_reload();
    expect(orchestrator.sync_now).not.toHaveBeenCalled();
  });

  it("accepts only the allowed scheduled sync intervals", async () => {
    const { service } = await load_service();
    expect(service.configure_scheduled_interval(0).success).toBe(false);
    expect(service.configure_scheduled_interval(3_600_000).success).toBe(true);
  });
});
