import { describe, expect, it, vi } from "vitest";

import {
  create_root_layout_restore_progress_callbacks,
  create_root_layout_subscription_callbacks,
} from "./layoutRootLayoutCallbacks";
import {
  create_initial_root_layout_view_state,
  type RootLayoutViewState,
} from "./layoutRootLayoutViewState";

function create_view_state_holder(): {
  holder: { view_state: RootLayoutViewState };
  update_view_state: (
    transform: (view_state: RootLayoutViewState) => RootLayoutViewState,
  ) => boolean;
} {
  const holder = { view_state: create_initial_root_layout_view_state("/") };
  const update_view_state = (
    transform: (view_state: RootLayoutViewState) => RootLayoutViewState,
  ): boolean => {
    holder.view_state = transform(holder.view_state);
    return true;
  };
  return { holder, update_view_state };
}

describe("create_root_layout_subscription_callbacks", () => {
  it("applies path, clerk, setup and sync changes to the view state", () => {
    const { holder, update_view_state } = create_view_state_holder();
    const callbacks = create_root_layout_subscription_callbacks({
      update_view_state,
      is_app_ready: () => holder.view_state.app_ready,
      on_user_signed_in: vi.fn(async () => true),
      on_user_signed_out: vi.fn(async () => true),
    });

    callbacks.on_path_change("/teams");
    callbacks.on_clerk_ready_change(true);
    callbacks.on_sync_change({
      is_syncing: true,
      status_message: "Pulling",
      progress_percentage: 20,
      sync_complete: false,
    });

    expect(holder.view_state.current_path).toBe("/teams");
    expect(holder.view_state.clerk_ready).toBe(true);
    expect(holder.view_state.show_initial_sync).toBe(true);
  });

  it("starts the login sync only when a user signs in after the app is ready", async () => {
    const { holder, update_view_state } = create_view_state_holder();
    const on_user_signed_in = vi.fn(async () => true);
    const log_spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const callbacks = create_root_layout_subscription_callbacks({
      update_view_state,
      is_app_ready: () => holder.view_state.app_ready,
      on_user_signed_in,
      on_user_signed_out: vi.fn(async () => true),
    });

    await callbacks.on_signed_in_change(false);
    holder.view_state = { ...holder.view_state, app_ready: true };
    await callbacks.on_signed_in_change(true);
    await callbacks.on_signed_in_change(true);

    expect(on_user_signed_in).toHaveBeenCalledTimes(1);
    log_spy.mockRestore();
  });
});

describe("create_root_layout_subscription_callbacks sign-out detection", () => {
  it("checks for stale signed-in data only when a signed-in user becomes signed out", async () => {
    const { holder, update_view_state } = create_view_state_holder();
    const on_user_signed_out = vi.fn(async () => true);
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const callbacks = create_root_layout_subscription_callbacks({
      update_view_state,
      is_app_ready: () => holder.view_state.app_ready,
      on_user_signed_in: vi.fn(async () => true),
      on_user_signed_out,
    });

    await callbacks.on_signed_in_change(false);
    expect(on_user_signed_out).not.toHaveBeenCalled();
    await callbacks.on_signed_in_change(true);
    await callbacks.on_signed_in_change(false);
    await callbacks.on_signed_in_change(false);

    expect(on_user_signed_out).toHaveBeenCalledTimes(1);
    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: "user_sign_out_detected" }),
    );
  });
});

describe("create_root_layout_restore_progress_callbacks", () => {
  it("shows and then clears restore progress", () => {
    const { holder, update_view_state } = create_view_state_holder();
    const callbacks =
      create_root_layout_restore_progress_callbacks(update_view_state);

    callbacks.show_restore_progress("Restoring", 15);
    expect(holder.view_state.sync_status_message).toBe("Restoring");
    callbacks.hide_restore_progress();
    expect(holder.view_state.show_initial_sync).toBe(false);
  });
});
