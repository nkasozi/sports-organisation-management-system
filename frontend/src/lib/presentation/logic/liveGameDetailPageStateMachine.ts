import type {
  LiveGameDetailModalState,
  LiveGameDetailPageState,
} from "./liveGameDetailPageState";

export const LIVE_GAME_DETAIL_PAGE_STATUS = {
  LOADING: "loading",
  LOAD_FAILED: "load_failed",
  READY: "ready",
  UPDATING: "updating",
} as const;

type LiveGameDetailPageStatus =
  | { status: typeof LIVE_GAME_DETAIL_PAGE_STATUS.LOADING }
  | {
      status: typeof LIVE_GAME_DETAIL_PAGE_STATUS.LOAD_FAILED;
      error_message: string;
    }
  | { status: typeof LIVE_GAME_DETAIL_PAGE_STATUS.READY }
  | { status: typeof LIVE_GAME_DETAIL_PAGE_STATUS.UPDATING };

export const LIVE_GAME_DETAIL_MODAL = {
  NONE: "none",
  START: "start",
  END: "end",
  PERIOD: "period",
  EXTRA_TIME: "extra_time",
} as const;

export type LiveGameDetailModal =
  (typeof LIVE_GAME_DETAIL_MODAL)[keyof typeof LIVE_GAME_DETAIL_MODAL];

export function derive_live_game_detail_page_status(
  state: LiveGameDetailPageState,
): LiveGameDetailPageStatus {
  if (state.is_loading) return { status: LIVE_GAME_DETAIL_PAGE_STATUS.LOADING };
  if (state.error_message) {
    return {
      status: LIVE_GAME_DETAIL_PAGE_STATUS.LOAD_FAILED,
      error_message: state.error_message,
    };
  }
  return state.is_updating
    ? { status: LIVE_GAME_DETAIL_PAGE_STATUS.UPDATING }
    : { status: LIVE_GAME_DETAIL_PAGE_STATUS.READY };
}

export function begin_live_game_detail_load(
  state: LiveGameDetailPageState,
): LiveGameDetailPageState {
  return { ...state, is_loading: true, error_message: "" };
}

export function finish_live_game_detail_load(
  state: LiveGameDetailPageState,
): LiveGameDetailPageState {
  return { ...state, is_loading: false };
}

export function fail_live_game_detail_load(
  state: LiveGameDetailPageState,
  error_message: string,
): LiveGameDetailPageState {
  return { ...state, is_loading: false, error_message };
}

export function build_live_game_detail_modal_state(
  modal: LiveGameDetailModal,
): LiveGameDetailModalState {
  return {
    show_start_modal: modal === LIVE_GAME_DETAIL_MODAL.START,
    show_end_modal: modal === LIVE_GAME_DETAIL_MODAL.END,
    show_period_modal: modal === LIVE_GAME_DETAIL_MODAL.PERIOD,
    show_extra_time_modal: modal === LIVE_GAME_DETAIL_MODAL.EXTRA_TIME,
  };
}

export function derive_live_game_detail_open_modal(
  modal_state: LiveGameDetailModalState,
): LiveGameDetailModal {
  if (modal_state.show_start_modal) return LIVE_GAME_DETAIL_MODAL.START;
  if (modal_state.show_end_modal) return LIVE_GAME_DETAIL_MODAL.END;
  if (modal_state.show_period_modal) return LIVE_GAME_DETAIL_MODAL.PERIOD;
  return modal_state.show_extra_time_modal
    ? LIVE_GAME_DETAIL_MODAL.EXTRA_TIME
    : LIVE_GAME_DETAIL_MODAL.NONE;
}
