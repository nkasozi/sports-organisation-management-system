import type { ManagedGamePageState } from "./managedGamePageControllerState";

export const MANAGED_GAME_PAGE_STATUS = {
  LOADING: "loading",
  LOAD_FAILED: "load_failed",
  READY: "ready",
  UPDATING: "updating",
} as const;

type ManagedGamePageStatus =
  | { status: typeof MANAGED_GAME_PAGE_STATUS.LOADING }
  | {
      status: typeof MANAGED_GAME_PAGE_STATUS.LOAD_FAILED;
      error_message: string;
    }
  | { status: typeof MANAGED_GAME_PAGE_STATUS.READY }
  | { status: typeof MANAGED_GAME_PAGE_STATUS.UPDATING };

export const MANAGED_GAME_MODAL = {
  NONE: "none",
  START: "start",
  END: "end",
  EVENT: "event",
} as const;

export type ManagedGameModal =
  (typeof MANAGED_GAME_MODAL)[keyof typeof MANAGED_GAME_MODAL];

type ManagedGameConfirmationModal =
  | typeof MANAGED_GAME_MODAL.START
  | typeof MANAGED_GAME_MODAL.END;

export function derive_managed_game_page_status(
  state: ManagedGamePageState,
): ManagedGamePageStatus {
  if (state.is_loading) return { status: MANAGED_GAME_PAGE_STATUS.LOADING };
  if (state.error_message) {
    return {
      status: MANAGED_GAME_PAGE_STATUS.LOAD_FAILED,
      error_message: state.error_message,
    };
  }
  return state.is_updating
    ? { status: MANAGED_GAME_PAGE_STATUS.UPDATING }
    : { status: MANAGED_GAME_PAGE_STATUS.READY };
}

export function begin_managed_game_page_load(
  state: ManagedGamePageState,
): ManagedGamePageState {
  return { ...state, is_loading: true, error_message: "" };
}

export function complete_managed_game_page_load(
  state: ManagedGamePageState,
): ManagedGamePageState {
  return { ...state, is_loading: false, error_message: "" };
}

export function fail_managed_game_page_load(
  state: ManagedGamePageState,
  error_message: string,
): ManagedGamePageState {
  return { ...state, is_loading: false, error_message };
}

export function derive_managed_game_open_modal(
  state: ManagedGamePageState,
): ManagedGameModal {
  if (state.show_event_modal) return MANAGED_GAME_MODAL.EVENT;
  if (state.show_start_modal) return MANAGED_GAME_MODAL.START;
  return state.show_end_modal
    ? MANAGED_GAME_MODAL.END
    : MANAGED_GAME_MODAL.NONE;
}

export function close_managed_game_confirmation_modals(
  state: ManagedGamePageState,
): ManagedGamePageState {
  return { ...state, show_start_modal: false, show_end_modal: false };
}

export function open_managed_game_confirmation_modal(
  state: ManagedGamePageState,
  modal: ManagedGameConfirmationModal,
): ManagedGamePageState {
  return {
    ...close_managed_game_confirmation_modals(state),
    show_event_modal: false,
    show_start_modal: modal === MANAGED_GAME_MODAL.START,
    show_end_modal: modal === MANAGED_GAME_MODAL.END,
  };
}
