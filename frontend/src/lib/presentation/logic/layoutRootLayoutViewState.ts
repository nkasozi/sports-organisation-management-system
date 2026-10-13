import type { FirstTimeSetupState } from "$lib/presentation/stores/firstTimeSetup";
import type { InitialSyncState } from "$lib/presentation/stores/initialSyncStore";

export interface RootLayoutViewState {
  show_first_time_setup: boolean;
  show_initial_sync: boolean;
  app_ready: boolean;
  clerk_ready: boolean;
  current_path: string;
  setup_status_message: string;
  setup_progress_percentage: number;
  sync_status_message: string;
  sync_progress_percentage: number;
}

interface SignedInTransitionTracker {
  should_trigger_login_sync(signed_in: boolean, app_ready: boolean): boolean;
}

export function create_initial_root_layout_view_state(
  current_path: string,
): RootLayoutViewState {
  return {
    show_first_time_setup: false,
    show_initial_sync: false,
    app_ready: false,
    clerk_ready: false,
    current_path,
    setup_status_message: "",
    setup_progress_percentage: 0,
    sync_status_message: "",
    sync_progress_percentage: 0,
  };
}

export function apply_root_layout_setup_change(
  view_state: RootLayoutViewState,
  setup_state: FirstTimeSetupState,
): RootLayoutViewState {
  return {
    ...view_state,
    setup_status_message: setup_state.status_message,
    setup_progress_percentage: setup_state.progress_percentage,
    show_first_time_setup:
      setup_state.is_first_time &&
      setup_state.is_setting_up &&
      !setup_state.setup_complete,
  };
}

export function apply_root_layout_sync_change(
  view_state: RootLayoutViewState,
  sync_state: InitialSyncState,
): RootLayoutViewState {
  return {
    ...view_state,
    sync_status_message: sync_state.status_message,
    sync_progress_percentage: sync_state.progress_percentage,
    show_initial_sync: sync_state.is_syncing,
  };
}

export function apply_root_layout_restore_progress(
  view_state: RootLayoutViewState,
  message: string,
  percentage: number,
): RootLayoutViewState {
  return {
    ...view_state,
    show_initial_sync: true,
    sync_status_message: message,
    sync_progress_percentage: percentage,
  };
}

export function hide_root_layout_restore_progress(
  view_state: RootLayoutViewState,
): RootLayoutViewState {
  return {
    ...view_state,
    show_initial_sync: false,
    sync_status_message: "",
    sync_progress_percentage: 0,
  };
}

export function mark_root_layout_ready(
  view_state: RootLayoutViewState,
): RootLayoutViewState {
  return { ...view_state, app_ready: true };
}

export function mark_root_layout_redirected(
  view_state: RootLayoutViewState,
): RootLayoutViewState {
  return { ...view_state, app_ready: true, clerk_ready: true };
}

export function create_signed_in_transition_tracker(): SignedInTransitionTracker {
  const tracker_state = { previous_signed_in: false };
  return {
    should_trigger_login_sync: (
      signed_in: boolean,
      app_ready: boolean,
    ): boolean => {
      const user_just_signed_in =
        signed_in && !tracker_state.previous_signed_in;
      tracker_state.previous_signed_in = signed_in;
      return user_just_signed_in && app_ready;
    },
  };
}
