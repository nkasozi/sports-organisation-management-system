import { get, type Readable } from "svelte/store";

import {
  initialize_app_data,
  reset_initialization,
} from "$lib/adapters/initialization/appInitializer";
import type { AsyncResult } from "$lib/core/types/Result";
import { auth_store } from "$lib/presentation/stores/auth";
import type { AuthState } from "$lib/presentation/stores/authTypes";
import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";
import { mark_session_synced } from "$lib/presentation/stores/initialSyncStore";

import { PRESENCE_STATUS } from "./presenceStatus";

const NO_PROFILE_ID = "";
const DEMO_PROFILE_RESTORED_EVENT = "demo_profile_restored_after_reset";

interface DemoProfileStore extends Readable<AuthState> {
  switch_profile(profile_id: string): Promise<boolean>;
}

export function read_demo_profile_id(state: AuthState): string {
  return state.current_profile.status === PRESENCE_STATUS.PRESENT
    ? state.current_profile.profile.id
    : NO_PROFILE_ID;
}

export async function restore_demo_profile_after_reset(
  previous_profile_id: string,
  store: DemoProfileStore,
): Promise<boolean> {
  if (previous_profile_id === NO_PROFILE_ID) return false;
  const state = get(store);
  const still_available = state.available_profiles.some(
    (profile) => profile.id === previous_profile_id,
  );
  if (!still_available) return false;
  console.log("[Dashboard] Keeping the demo profile after resetting data", {
    event: DEMO_PROFILE_RESTORED_EVENT,
  });
  return store.switch_profile(previous_profile_id);
}

interface DemoResetFinishDependencies {
  store: DemoProfileStore;
  mark_device_set_up(): AsyncResult<boolean>;
}

const DEMO_RESET_MARKER_FAILED_EVENT = "demo_reset_setup_marker_not_saved";

export async function finish_demo_reset(
  previous_profile_id: string,
  dependencies: DemoResetFinishDependencies,
): Promise<boolean> {
  const marked = await dependencies.mark_device_set_up();
  if (!marked.success)
    console.warn("[Dashboard] Could not mark the device as set up", {
      event: DEMO_RESET_MARKER_FAILED_EVENT,
      error: marked.error,
    });
  return restore_demo_profile_after_reset(
    previous_profile_id,
    dependencies.store,
  );
}

export async function finish_dashboard_demo_reset(
  previous_profile_id: string,
  current_path: string,
): Promise<void> {
  await finish_demo_reset(previous_profile_id, {
    store: auth_store,
    mark_device_set_up: mark_session_synced,
  });
  first_time_setup_store.reset();
  reset_initialization();
  await initialize_app_data({ current_path, session_already_synced: false });
}
