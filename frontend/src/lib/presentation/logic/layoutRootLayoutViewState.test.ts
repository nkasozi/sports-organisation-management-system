import { describe, expect, it } from "vitest";

import {
  apply_root_layout_restore_progress,
  apply_root_layout_setup_change,
  apply_root_layout_sync_change,
  create_initial_root_layout_view_state,
  create_signed_in_transition_tracker,
  hide_root_layout_restore_progress,
  mark_root_layout_ready,
  mark_root_layout_redirected,
} from "./layoutRootLayoutViewState";

const setup_state = {
  is_first_time: true,
  is_setting_up: true,
  status_message: "Seeding",
  progress_percentage: 40,
  setup_complete: false,
};

describe("root layout view state", () => {
  it("starts with everything hidden and not ready", () => {
    expect(create_initial_root_layout_view_state("/teams")).toEqual({
      show_first_time_setup: false,
      show_initial_sync: false,
      app_ready: false,
      clerk_ready: false,
      current_path: "/teams",
      setup_status_message: "",
      setup_progress_percentage: 0,
      sync_status_message: "",
      sync_progress_percentage: 0,
    });
  });

  it("shows first-time setup while setting up for the first time", () => {
    const next_state = apply_root_layout_setup_change(
      create_initial_root_layout_view_state("/"),
      setup_state,
    );

    expect(next_state.show_first_time_setup).toBe(true);
    expect(next_state.setup_status_message).toBe("Seeding");
    expect(next_state.setup_progress_percentage).toBe(40);
  });

  it("hides first-time setup once setup completes", () => {
    const next_state = apply_root_layout_setup_change(
      create_initial_root_layout_view_state("/"),
      { ...setup_state, setup_complete: true },
    );

    expect(next_state.show_first_time_setup).toBe(false);
  });

  it("mirrors the initial sync store", () => {
    const next_state = apply_root_layout_sync_change(
      create_initial_root_layout_view_state("/"),
      {
        is_syncing: true,
        status_message: "Pulling",
        progress_percentage: 30,
        sync_complete: false,
      },
    );

    expect(next_state.show_initial_sync).toBe(true);
    expect(next_state.sync_status_message).toBe("Pulling");
    expect(next_state.sync_progress_percentage).toBe(30);
  });

  it("shows and hides restore progress", () => {
    const shown = apply_root_layout_restore_progress(
      create_initial_root_layout_view_state("/"),
      "Restoring",
      15,
    );
    const hidden = hide_root_layout_restore_progress(shown);

    expect(shown.show_initial_sync).toBe(true);
    expect(shown.sync_status_message).toBe("Restoring");
    expect(hidden.show_initial_sync).toBe(false);
    expect(hidden.sync_status_message).toBe("");
    expect(hidden.sync_progress_percentage).toBe(0);
  });

  it("marks the app ready without forcing clerk readiness", () => {
    const ready = mark_root_layout_ready(
      create_initial_root_layout_view_state("/"),
    );

    expect(ready.app_ready).toBe(true);
    expect(ready.clerk_ready).toBe(false);
  });

  it("marks both app and clerk ready when redirecting away", () => {
    const redirected = mark_root_layout_redirected(
      create_initial_root_layout_view_state("/"),
    );

    expect(redirected.app_ready).toBe(true);
    expect(redirected.clerk_ready).toBe(true);
  });
});

describe("create_signed_in_transition_tracker", () => {
  it("triggers login sync only on a signed-out to signed-in transition when ready", () => {
    const tracker = create_signed_in_transition_tracker();

    expect(tracker.should_trigger_login_sync(true, false)).toBe(false);
    expect(tracker.should_trigger_login_sync(true, true)).toBe(false);
    expect(tracker.should_trigger_login_sync(false, true)).toBe(false);
    expect(tracker.should_trigger_login_sync(true, true)).toBe(true);
    expect(tracker.should_trigger_login_sync(true, true)).toBe(false);
  });
});
