import type { FirstTimeSetupState } from "$lib/presentation/stores/firstTimeSetup";
import type { InitialSyncState } from "$lib/presentation/stores/initialSyncStore";

import {
  apply_root_layout_restore_progress,
  apply_root_layout_setup_change,
  apply_root_layout_sync_change,
  create_signed_in_transition_tracker,
  hide_root_layout_restore_progress,
  type RootLayoutViewState,
} from "./layoutRootLayoutViewState";
import type { RootLayoutSubscriptionCommand } from "./layoutRouteSubscriptions";

const USER_SIGN_IN_DETECTED_EVENT = "user_sign_in_detected";

type RootLayoutViewStateUpdater = (
  transform: (view_state: RootLayoutViewState) => RootLayoutViewState,
) => boolean;

type RootLayoutSubscriptionCallbacks = Pick<
  RootLayoutSubscriptionCommand,
  | "on_path_change"
  | "on_setup_change"
  | "on_clerk_ready_change"
  | "on_sync_change"
  | "on_signed_in_change"
>;

interface RootLayoutSubscriptionCallbackCommand {
  update_view_state: RootLayoutViewStateUpdater;
  is_app_ready(): boolean;
  on_user_signed_in(): Promise<unknown>;
}

interface RootLayoutRestoreProgressCallbacks {
  show_restore_progress(message: string, percentage: number): boolean;
  hide_restore_progress(): boolean;
}

export function create_root_layout_subscription_callbacks(
  command: RootLayoutSubscriptionCallbackCommand,
): RootLayoutSubscriptionCallbacks {
  const { update_view_state } = command;
  const signed_in_tracker = create_signed_in_transition_tracker();
  return {
    on_path_change: (pathname: string) => {
      update_view_state((state) => ({ ...state, current_path: pathname }));
    },
    on_setup_change: (setup_state: FirstTimeSetupState) => {
      update_view_state((state) =>
        apply_root_layout_setup_change(state, setup_state),
      );
    },
    on_clerk_ready_change: (loaded: boolean) => {
      update_view_state((state) => ({ ...state, clerk_ready: loaded }));
    },
    on_sync_change: (sync_state: InitialSyncState) => {
      update_view_state((state) =>
        apply_root_layout_sync_change(state, sync_state),
      );
    },
    on_signed_in_change: async (signed_in: boolean) => {
      if (
        !signed_in_tracker.should_trigger_login_sync(
          signed_in,
          command.is_app_ready(),
        )
      )
        return;
      console.log(
        "[Layout] User signed in detected, triggering login sync...",
        {
          event: USER_SIGN_IN_DETECTED_EVENT,
        },
      );
      await command.on_user_signed_in();
    },
  };
}

export function create_root_layout_restore_progress_callbacks(
  update_view_state: RootLayoutViewStateUpdater,
): RootLayoutRestoreProgressCallbacks {
  return {
    show_restore_progress: (message: string, percentage: number) =>
      update_view_state((state) =>
        apply_root_layout_restore_progress(state, message, percentage),
      ),
    hide_restore_progress: () =>
      update_view_state(hide_root_layout_restore_progress),
  };
}
