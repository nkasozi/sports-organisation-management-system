import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";

import { FIXTURE_LINEUP_DETAIL_PAGE_TEXT } from "./fixtureLineupDetailMessages";

export const FIXTURE_LINEUP_DETAIL_PAGE_STATUS = {
  LOADING: "loading",
  LOAD_FAILED: "load_failed",
  READY: "ready",
  SAVING: "saving",
} as const;

export const FIXTURE_LINEUP_DETAIL_ACTION = {
  NONE: "none",
  SAVE: "save",
  SUBMIT: "submit",
} as const;

export type FixtureLineupDetailAction =
  (typeof FIXTURE_LINEUP_DETAIL_ACTION)[keyof typeof FIXTURE_LINEUP_DETAIL_ACTION];

export type FixtureLineupDetailPageStatusState =
  | { status: typeof FIXTURE_LINEUP_DETAIL_PAGE_STATUS.LOADING }
  | {
      status: typeof FIXTURE_LINEUP_DETAIL_PAGE_STATUS.LOAD_FAILED;
      message: string;
    }
  | {
      status: typeof FIXTURE_LINEUP_DETAIL_PAGE_STATUS.READY;
      last_action: FixtureLineupDetailAction;
    }
  | {
      status: typeof FIXTURE_LINEUP_DETAIL_PAGE_STATUS.SAVING;
      action: FixtureLineupDetailAction;
    };

interface FixtureLineupDetailErrorOutcome {
  state: FixtureLineupDetailPageStatusState;
  toast_message: Option<string>;
}

export const FIXTURE_LINEUP_DETAIL_INITIAL_STATE: FixtureLineupDetailPageStatusState =
  { status: FIXTURE_LINEUP_DETAIL_PAGE_STATUS.LOADING };

export function request_fixture_lineup_detail_action(
  action: FixtureLineupDetailAction,
): FixtureLineupDetailPageStatusState {
  return {
    status: FIXTURE_LINEUP_DETAIL_PAGE_STATUS.READY,
    last_action: action,
  };
}

export function apply_fixture_lineup_detail_loading_flag(
  current_state: FixtureLineupDetailPageStatusState,
  is_loading: boolean,
): FixtureLineupDetailPageStatusState {
  if (is_loading) return FIXTURE_LINEUP_DETAIL_INITIAL_STATE;
  if (current_state.status !== FIXTURE_LINEUP_DETAIL_PAGE_STATUS.LOADING) {
    return current_state;
  }
  return request_fixture_lineup_detail_action(
    FIXTURE_LINEUP_DETAIL_ACTION.NONE,
  );
}

export function apply_fixture_lineup_detail_saving_flag(
  current_state: FixtureLineupDetailPageStatusState,
  is_saving: boolean,
): FixtureLineupDetailPageStatusState {
  switch (current_state.status) {
    case FIXTURE_LINEUP_DETAIL_PAGE_STATUS.READY:
      return is_saving
        ? {
            status: FIXTURE_LINEUP_DETAIL_PAGE_STATUS.SAVING,
            action: current_state.last_action,
          }
        : current_state;
    case FIXTURE_LINEUP_DETAIL_PAGE_STATUS.SAVING:
      return is_saving
        ? current_state
        : request_fixture_lineup_detail_action(current_state.action);
    case FIXTURE_LINEUP_DETAIL_PAGE_STATUS.LOADING:
    case FIXTURE_LINEUP_DETAIL_PAGE_STATUS.LOAD_FAILED:
      return current_state;
  }
}

function get_action_failure_message(action: FixtureLineupDetailAction): string {
  switch (action) {
    case FIXTURE_LINEUP_DETAIL_ACTION.SUBMIT:
      return FIXTURE_LINEUP_DETAIL_PAGE_TEXT.SUBMIT_FAILED;
    case FIXTURE_LINEUP_DETAIL_ACTION.SAVE:
    case FIXTURE_LINEUP_DETAIL_ACTION.NONE:
      return FIXTURE_LINEUP_DETAIL_PAGE_TEXT.UPDATE_FAILED;
  }
}

function get_load_failure_message(message: string): string {
  return message === FIXTURE_LINEUP_DETAIL_PAGE_TEXT.ACCESS_CHECK_FAILED
    ? message
    : FIXTURE_LINEUP_DETAIL_PAGE_TEXT.LOAD_FAILED;
}

export function apply_fixture_lineup_detail_error(
  current_state: FixtureLineupDetailPageStatusState,
  message: string,
): FixtureLineupDetailErrorOutcome {
  if (!message) {
    return { state: current_state, toast_message: create_none_option() };
  }
  switch (current_state.status) {
    case FIXTURE_LINEUP_DETAIL_PAGE_STATUS.LOADING:
    case FIXTURE_LINEUP_DETAIL_PAGE_STATUS.LOAD_FAILED:
      return {
        state: {
          status: FIXTURE_LINEUP_DETAIL_PAGE_STATUS.LOAD_FAILED,
          message: get_load_failure_message(message),
        },
        toast_message: create_none_option(),
      };
    case FIXTURE_LINEUP_DETAIL_PAGE_STATUS.READY:
      return {
        state: current_state,
        toast_message: create_some_option(
          get_action_failure_message(current_state.last_action),
        ),
      };
    case FIXTURE_LINEUP_DETAIL_PAGE_STATUS.SAVING:
      return {
        state: request_fixture_lineup_detail_action(current_state.action),
        toast_message: create_some_option(
          get_action_failure_message(current_state.action),
        ),
      };
  }
}
