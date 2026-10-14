import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type RepositoryWriteOrigin,
  RepositoryWriteOriginKind,
} from "$lib/adapters/repositories/InBrowserRepositoryWriteOrigin";
import { UntrackedWriteReason } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";
import { UntrackedWriteScopeStatus } from "$lib/adapters/repositories/syncOutbox/untrackedWriteScopeToken";
import {
  enqueue_all_local_records_for_push,
  pause_remote_change_subscriptions,
  reset_local_sync_bookkeeping,
  resume_remote_change_subscriptions,
  start_background_sync,
} from "$lib/infrastructure/sync/backgroundSyncService";
import { clear_all_demo_data_in_convex } from "$lib/infrastructure/sync/convexSyncService";
import { sync_store } from "$lib/presentation/stores/syncStore";

import { reset_all_local_repositories } from "./dataResetRepositoryResets";
import { reset_all_data } from "./dataResetService";
import {
  prepare_reset_test,
  reset_test_state,
} from "./dataResetService.test_support";
import { seed_all_data_if_needed } from "./seedingService";

vi.mock("./dataResetRepositoryResets", () => ({
  reset_all_local_repositories: vi.fn().mockResolvedValue(true),
}));
vi.mock("./seedingService", () => ({
  seed_all_data_if_needed: vi.fn().mockResolvedValue({
    success: true,
    data: true,
  }),
}));
vi.mock("$lib/infrastructure/sync/convexSyncService", () => ({
  clear_all_demo_data_in_convex: vi.fn().mockResolvedValue(true),
}));
vi.mock("$lib/infrastructure/sync/backgroundSyncService", async () =>
  (
    await import("./dataResetService.test_support")
  ).create_background_sync_mock(),
);
vi.mock("$lib/infrastructure/sync/syncSessionQuiesce", async () =>
  (
    await import("./dataResetService.test_support")
  ).create_session_quiesce_mock(),
);
vi.mock("$lib/presentation/stores/syncStore", () => ({
  sync_store: { sync_now: vi.fn().mockResolvedValue({ success: true }) },
}));
vi.mock("$lib/presentation/stores/initialSyncStore", () => ({
  clear_session_sync_flag: vi.fn(),
}));
vi.mock("$lib/adapters/iam/clerkAuthService", async () =>
  (await import("./dataResetService.test_support")).create_signed_in_mock(),
);
vi.mock("$lib/infrastructure/container", async () =>
  (await import("./dataResetService.test_support")).create_container_mock(),
);

const ignore_progress = (): boolean => true;

describe("reset_all_data sync interaction", () => {
  beforeEach(() => prepare_reset_test());

  it("clears the server data when user is signed in", async () => {
    reset_test_state.is_signed_in = true;

    await reset_all_data(ignore_progress);

    expect(clear_all_demo_data_in_convex).toHaveBeenCalledOnce();
  });

  it("skips clearing server data when user is not signed in", async () => {
    reset_test_state.is_signed_in = false;

    await reset_all_data(ignore_progress);

    expect(clear_all_demo_data_in_convex).not.toHaveBeenCalled();
  });

  it("starts background sync after reset when user is signed in", async () => {
    reset_test_state.is_signed_in = true;

    await reset_all_data(ignore_progress);

    expect(start_background_sync).toHaveBeenCalledOnce();
  });

  it("does not start background sync when user is not signed in", async () => {
    reset_test_state.is_signed_in = false;

    await reset_all_data(ignore_progress);

    expect(start_background_sync).not.toHaveBeenCalled();
  });

  it("resets sync bookkeeping and never enqueues server deletes for cleared tables", async () => {
    await reset_all_data(ignore_progress);

    expect(reset_local_sync_bookkeeping).toHaveBeenCalledOnce();
    expect(enqueue_all_local_records_for_push).not.toHaveBeenCalled();
  });

  it("rebuilds local data through an explicit data-reset write origin that closes afterwards", async () => {
    const received_origins: RepositoryWriteOrigin[] = [];
    const statuses_during_reset: string[] = [];
    vi.mocked(reset_all_local_repositories).mockImplementationOnce(
      async (origin: RepositoryWriteOrigin) => {
        received_origins.push(origin);
        if (origin.kind === RepositoryWriteOriginKind.SYSTEM)
          statuses_during_reset.push(origin.scope.read_status());
        return true;
      },
    );

    expect(await reset_all_data(ignore_progress)).toBe(true);

    const [origin] = received_origins;
    expect(origin.kind).toBe(RepositoryWriteOriginKind.SYSTEM);
    if (origin.kind !== RepositoryWriteOriginKind.SYSTEM) return;
    expect(origin.scope.reason).toBe(UntrackedWriteReason.DATA_RESET);
    expect(statuses_during_reset).toEqual([UntrackedWriteScopeStatus.OPEN]);
    expect(origin.scope.read_status()).toBe(UntrackedWriteScopeStatus.CLOSED);
    expect(seed_all_data_if_needed).toHaveBeenCalledOnce();
  });

  it("aborts before touching local data when the server clear fails", async () => {
    reset_test_state.is_signed_in = true;
    vi.mocked(clear_all_demo_data_in_convex).mockResolvedValueOnce(false);

    expect(await reset_all_data(ignore_progress)).toBe(false);
    expect(reset_all_local_repositories).not.toHaveBeenCalled();
    expect(resume_remote_change_subscriptions).toHaveBeenCalledOnce();
  });

  it("reports failure when pushing the reseeded data fails", async () => {
    reset_test_state.is_signed_in = true;
    vi.mocked(sync_store.sync_now).mockResolvedValueOnce({
      success: false,
    } as never);

    expect(await reset_all_data(ignore_progress)).toBe(false);
  });

  it("pauses realtime pulls for the whole reset and resumes them afterwards", async () => {
    reset_test_state.is_signed_in = true;
    vi.mocked(reset_all_local_repositories).mockImplementationOnce(async () => {
      expect(pause_remote_change_subscriptions).toHaveBeenCalledOnce();
      expect(resume_remote_change_subscriptions).not.toHaveBeenCalled();
      return true;
    });

    expect(await reset_all_data(ignore_progress)).toBe(true);
    expect(resume_remote_change_subscriptions).toHaveBeenCalledOnce();
  });

  it("explicitly enqueues the reseeded data before pushing when signed in", async () => {
    reset_test_state.is_signed_in = true;

    await reset_all_data(ignore_progress);

    expect(enqueue_all_local_records_for_push).toHaveBeenCalledOnce();
  });

  it("fails without pushing when the local rebuild fails", async () => {
    reset_test_state.is_signed_in = true;
    vi.mocked(reset_all_local_repositories).mockRejectedValueOnce(
      new Error("quota exceeded"),
    );

    expect(await reset_all_data(ignore_progress)).toBe(false);
    expect(enqueue_all_local_records_for_push).not.toHaveBeenCalled();
    expect(start_background_sync).not.toHaveBeenCalled();
  });
});
