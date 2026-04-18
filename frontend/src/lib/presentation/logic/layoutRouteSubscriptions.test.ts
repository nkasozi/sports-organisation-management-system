import { describe, expect, it, vi } from "vitest";

import type { FirstTimeSetupState } from "$lib/presentation/stores/firstTimeSetup";
import type { InitialSyncState } from "$lib/presentation/stores/initialSyncStore";

import type { RootLayoutSubscriptionCommand } from "./layoutRouteSubscriptions";
import { subscribe_root_layout_state } from "./layoutRouteSubscriptions";

describe("layoutRouteSubscriptions", () => {
  it("subscribes to layout stores, forwards state changes, and tears down all subscriptions", async () => {
    const navigating_unsubscribe = vi.fn();
    const page_unsubscribe = vi.fn();
    const setup_unsubscribe = vi.fn();
    const clerk_unsubscribe = vi.fn();
    const sync_unsubscribe = vi.fn();
    const signed_in_unsubscribe = vi.fn();
    const set_navigating = vi.fn();
    const on_path_change = vi.fn();
    const on_setup_change = vi.fn();
    const on_clerk_ready_change = vi.fn();
    const on_sync_change = vi.fn();
    const on_signed_in_change = vi.fn(async () => {});
    const setup_state = {
      is_first_time: true,
      is_setting_up: false,
      status_message: "Loading...",
      progress_percentage: 0,
      setup_complete: false,
    } as FirstTimeSetupState;
    const sync_state = {
      is_syncing: true,
      status_message: "Syncing",
      progress_percentage: 50,
      sync_complete: false,
    } as InitialSyncState;

    const command = {
      navigating_store: {
        subscribe: (callback: (value: boolean) => void) => {
          callback(true);
          return navigating_unsubscribe;
        },
      },
      page_store: {
        subscribe: (
          callback: (value: { url: { pathname: string } }) => void,
        ) => {
          callback({ url: { pathname: "/dashboard" } });
          return page_unsubscribe;
        },
      },
      first_time_setup_store: {
        subscribe: (callback: (value: FirstTimeSetupState) => void) => {
          callback(setup_state);
          return setup_unsubscribe;
        },
      },
      clerk_loaded_store: {
        subscribe: (callback: (value: boolean) => void) => {
          callback(true);
          return clerk_unsubscribe;
        },
      },
      initial_sync_store: {
        subscribe: (callback: (value: InitialSyncState) => void) => {
          callback(sync_state);
          return sync_unsubscribe;
        },
      },
      signed_in_store: {
        subscribe: (callback: (value: boolean) => void) => {
          callback(true);
          return signed_in_unsubscribe;
        },
      },
      set_navigating,
      on_path_change,
      on_setup_change,
      on_clerk_ready_change,
      on_sync_change,
      on_signed_in_change,
    } as RootLayoutSubscriptionCommand;
    const unsubscribe = subscribe_root_layout_state(command);

    expect(set_navigating).toHaveBeenCalledWith(true);
    expect(on_path_change).toHaveBeenCalledWith("/dashboard");
    expect(on_setup_change).toHaveBeenCalledWith(setup_state);
    expect(on_clerk_ready_change).toHaveBeenCalledWith(true);
    expect(on_sync_change).toHaveBeenCalledWith(sync_state);
    expect(on_signed_in_change).toHaveBeenCalledWith(true);

    unsubscribe();

    expect(navigating_unsubscribe).toHaveBeenCalledTimes(1);
    expect(page_unsubscribe).toHaveBeenCalledTimes(1);
    expect(setup_unsubscribe).toHaveBeenCalledTimes(1);
    expect(clerk_unsubscribe).toHaveBeenCalledTimes(1);
    expect(sync_unsubscribe).toHaveBeenCalledTimes(1);
    expect(signed_in_unsubscribe).toHaveBeenCalledTimes(1);
  });
});
