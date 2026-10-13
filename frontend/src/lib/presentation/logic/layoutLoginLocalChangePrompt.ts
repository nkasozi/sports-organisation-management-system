import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

export const LOGIN_LOCAL_CHANGE_PROMPT_STATUS = {
  HIDDEN: "hidden",
  AWAITING_CHOICE: "awaiting_choice",
  RESOLVED: "resolved",
} as const;

export const LOGIN_LOCAL_CHANGE_PROMPT_CHOICE = {
  DISCARD_AND_CONTINUE: "discard_and_continue",
  KEEP_AND_SIGN_OUT: "keep_and_sign_out",
} as const;

export const LOGIN_LOCAL_CHANGE_PROMPT_EVENT = {
  CHOICE_REQUESTED: "choice_requested",
  CHOICE_MADE: "choice_made",
} as const;

export const LOGIN_LOCAL_CHANGE_PROMPT_KEY_COMMAND = {
  KEEP_LOCAL_CHANGES: "keep_local_changes",
  TRAP_FOCUS: "trap_focus",
  NONE: "none",
} as const;

const STATUS = LOGIN_LOCAL_CHANGE_PROMPT_STATUS;
const EVENT = LOGIN_LOCAL_CHANGE_PROMPT_EVENT;
const KEY_COMMAND = LOGIN_LOCAL_CHANGE_PROMPT_KEY_COMMAND;

const ESCAPE_KEY = "Escape";
const TAB_KEY = "Tab";
const PROMPT_ALREADY_AWAITING_ERROR =
  "A local change prompt is already awaiting a choice";
const PROMPT_NOT_AWAITING_ERROR = "No local change prompt is awaiting a choice";
const PROMPT_WITHOUT_CHANGES_ERROR =
  "A local change prompt requires at least one unsynced change";
const SINGLE_CHANGE_PHRASE = "local change that has not been synced";
const MULTIPLE_CHANGES_PHRASE = "local changes that have not been synced";
const PROMPT_MESSAGE_PREFIX = "This device has";
const PROMPT_MESSAGE_SUFFIX =
  "Signing in replaces the data on this device with your account's data, so these changes will be lost.";

export type LoginLocalChangePromptChoice =
  (typeof LOGIN_LOCAL_CHANGE_PROMPT_CHOICE)[keyof typeof LOGIN_LOCAL_CHANGE_PROMPT_CHOICE];

type LoginLocalChangePromptKeyCommand =
  (typeof LOGIN_LOCAL_CHANGE_PROMPT_KEY_COMMAND)[keyof typeof LOGIN_LOCAL_CHANGE_PROMPT_KEY_COMMAND];

export type AwaitingLoginLocalChangePromptState = {
  status: typeof STATUS.AWAITING_CHOICE;
  unsynced_count: number;
};

export type LoginLocalChangePromptState =
  | { status: typeof STATUS.HIDDEN }
  | AwaitingLoginLocalChangePromptState
  | {
      status: typeof STATUS.RESOLVED;
      unsynced_count: number;
      choice: LoginLocalChangePromptChoice;
    };

type LoginLocalChangePromptEvent =
  | { type: typeof EVENT.CHOICE_REQUESTED; unsynced_count: number }
  | { type: typeof EVENT.CHOICE_MADE; choice: LoginLocalChangePromptChoice };

export function create_hidden_login_local_change_prompt_state(): LoginLocalChangePromptState {
  return { status: STATUS.HIDDEN };
}

function request_choice(
  current_state: LoginLocalChangePromptState,
  unsynced_count: number,
): Result<LoginLocalChangePromptState> {
  if (current_state.status === STATUS.AWAITING_CHOICE)
    return create_failure_result(PROMPT_ALREADY_AWAITING_ERROR);
  if (unsynced_count <= 0)
    return create_failure_result(PROMPT_WITHOUT_CHANGES_ERROR);
  return create_success_result({
    status: STATUS.AWAITING_CHOICE,
    unsynced_count,
  });
}

function record_choice(
  current_state: LoginLocalChangePromptState,
  choice: LoginLocalChangePromptChoice,
): Result<LoginLocalChangePromptState> {
  if (current_state.status !== STATUS.AWAITING_CHOICE)
    return create_failure_result(PROMPT_NOT_AWAITING_ERROR);
  return create_success_result({
    status: STATUS.RESOLVED,
    unsynced_count: current_state.unsynced_count,
    choice,
  });
}

export function transition_login_local_change_prompt_state(
  current_state: LoginLocalChangePromptState,
  event: LoginLocalChangePromptEvent,
): Result<LoginLocalChangePromptState> {
  switch (event.type) {
    case EVENT.CHOICE_REQUESTED:
      return request_choice(current_state, event.unsynced_count);
    case EVENT.CHOICE_MADE:
      return record_choice(current_state, event.choice);
  }
}

export function is_discard_login_local_change_choice(
  choice: LoginLocalChangePromptChoice,
): boolean {
  switch (choice) {
    case LOGIN_LOCAL_CHANGE_PROMPT_CHOICE.DISCARD_AND_CONTINUE:
      return true;
    case LOGIN_LOCAL_CHANGE_PROMPT_CHOICE.KEEP_AND_SIGN_OUT:
      return false;
  }
}

export function build_login_local_change_prompt_message(
  unsynced_count: number,
): string {
  const change_phrase =
    unsynced_count === 1 ? SINGLE_CHANGE_PHRASE : MULTIPLE_CHANGES_PHRASE;
  return `${PROMPT_MESSAGE_PREFIX} ${unsynced_count} ${change_phrase}. ${PROMPT_MESSAGE_SUFFIX}`;
}

export function resolve_login_local_change_prompt_key_command(
  key: string,
): LoginLocalChangePromptKeyCommand {
  switch (key) {
    case ESCAPE_KEY:
      return KEY_COMMAND.KEEP_LOCAL_CHANGES;
    case TAB_KEY:
      return KEY_COMMAND.TRAP_FOCUS;
    default:
      return KEY_COMMAND.NONE;
  }
}
