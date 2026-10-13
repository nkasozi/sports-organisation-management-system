import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

export const CALENDAR_DELETE_ACTIVITY_PROMPT_STATUS = {
  HIDDEN: "hidden",
  AWAITING_CHOICE: "awaiting_choice",
  DELETING: "deleting",
} as const;

export const CALENDAR_DELETE_ACTIVITY_PROMPT_EVENT = {
  CHOICE_REQUESTED: "choice_requested",
  CANCELLED: "cancelled",
  DELETE_CONFIRMED: "delete_confirmed",
  DELETE_SUCCEEDED: "delete_succeeded",
  DELETE_FAILED: "delete_failed",
} as const;

export const CALENDAR_DELETE_ACTIVITY_PROMPT_KEY_COMMAND = {
  CANCEL: "cancel",
  TRAP_FOCUS: "trap_focus",
  NONE: "none",
} as const;

const STATUS = CALENDAR_DELETE_ACTIVITY_PROMPT_STATUS;
const EVENT = CALENDAR_DELETE_ACTIVITY_PROMPT_EVENT;
const KEY_COMMAND = CALENDAR_DELETE_ACTIVITY_PROMPT_KEY_COMMAND;

const ESCAPE_KEY = "Escape";
const TAB_KEY = "Tab";
const TRANSITION_REJECTED_EVENT =
  "calendar_delete_activity_prompt_transition_rejected";

type CalendarDeleteActivityPromptStatus =
  (typeof CALENDAR_DELETE_ACTIVITY_PROMPT_STATUS)[keyof typeof CALENDAR_DELETE_ACTIVITY_PROMPT_STATUS];

type CalendarDeleteActivityPromptEventType =
  (typeof CALENDAR_DELETE_ACTIVITY_PROMPT_EVENT)[keyof typeof CALENDAR_DELETE_ACTIVITY_PROMPT_EVENT];

type CalendarDeleteActivityPromptKeyCommand =
  (typeof CALENDAR_DELETE_ACTIVITY_PROMPT_KEY_COMMAND)[keyof typeof CALENDAR_DELETE_ACTIVITY_PROMPT_KEY_COMMAND];

export interface CalendarDeleteActivityPromptState {
  status: CalendarDeleteActivityPromptStatus;
}

export interface CalendarDeleteActivityPromptEvent {
  type: CalendarDeleteActivityPromptEventType;
}

export interface CalendarDeleteActivityPromptCommand {
  get_prompt_state: () => CalendarDeleteActivityPromptState;
  set_prompt_state: (state: CalendarDeleteActivityPromptState) => void;
  delete_activity: () => Promise<boolean>;
}

export function create_hidden_calendar_delete_activity_prompt_state(): CalendarDeleteActivityPromptState {
  return { status: STATUS.HIDDEN };
}

function resolve_next_status(
  current_status: CalendarDeleteActivityPromptStatus,
  event_type: CalendarDeleteActivityPromptEventType,
): Result<CalendarDeleteActivityPromptStatus> {
  const transition_key = `${current_status}:${event_type}`;
  switch (transition_key) {
    case `${STATUS.HIDDEN}:${EVENT.CHOICE_REQUESTED}`:
      return create_success_result(STATUS.AWAITING_CHOICE);
    case `${STATUS.AWAITING_CHOICE}:${EVENT.CANCELLED}`:
      return create_success_result(STATUS.HIDDEN);
    case `${STATUS.AWAITING_CHOICE}:${EVENT.DELETE_CONFIRMED}`:
      return create_success_result(STATUS.DELETING);
    case `${STATUS.DELETING}:${EVENT.DELETE_SUCCEEDED}`:
      return create_success_result(STATUS.HIDDEN);
    case `${STATUS.DELETING}:${EVENT.DELETE_FAILED}`:
      return create_success_result(STATUS.AWAITING_CHOICE);
    default:
      return create_failure_result(
        `Delete activity prompt cannot handle ${event_type} while ${current_status}`,
      );
  }
}

export function transition_calendar_delete_activity_prompt_state(
  current_state: CalendarDeleteActivityPromptState,
  event: CalendarDeleteActivityPromptEvent,
): Result<CalendarDeleteActivityPromptState> {
  const next_status_result = resolve_next_status(
    current_state.status,
    event.type,
  );
  if (!next_status_result.success) return next_status_result;
  return create_success_result({ status: next_status_result.data });
}

export function log_calendar_delete_activity_prompt_transition_rejected(
  current_state: CalendarDeleteActivityPromptState,
  event: CalendarDeleteActivityPromptEvent,
  error: string,
): boolean {
  console.warn("[CalendarDeleteActivityPrompt] Rejected prompt transition", {
    event: TRANSITION_REJECTED_EVENT,
    current_status: current_state.status,
    prompt_event: event.type,
    error,
  });
  return true;
}

export function advance_calendar_delete_activity_prompt_state(
  current_state: CalendarDeleteActivityPromptState,
  event: CalendarDeleteActivityPromptEvent,
): CalendarDeleteActivityPromptState {
  const result = transition_calendar_delete_activity_prompt_state(
    current_state,
    event,
  );
  if (result.success) return result.data;
  log_calendar_delete_activity_prompt_transition_rejected(
    current_state,
    event,
    result.error,
  );
  return current_state;
}

export function is_calendar_delete_activity_prompt_visible(
  state: CalendarDeleteActivityPromptState,
): boolean {
  return state.status !== STATUS.HIDDEN;
}

export function is_calendar_delete_activity_prompt_busy(
  state: CalendarDeleteActivityPromptState,
): boolean {
  return state.status === STATUS.DELETING;
}

export function resolve_calendar_delete_activity_prompt_key_command(
  key: string,
): CalendarDeleteActivityPromptKeyCommand {
  switch (key) {
    case ESCAPE_KEY:
      return KEY_COMMAND.CANCEL;
    case TAB_KEY:
      return KEY_COMMAND.TRAP_FOCUS;
    default:
      return KEY_COMMAND.NONE;
  }
}

export async function confirm_calendar_delete_activity(
  command: CalendarDeleteActivityPromptCommand,
): Promise<boolean> {
  const current_state = command.get_prompt_state();
  const confirm_event = { type: EVENT.DELETE_CONFIRMED };
  const deleting_result = transition_calendar_delete_activity_prompt_state(
    current_state,
    confirm_event,
  );
  if (!deleting_result.success) {
    log_calendar_delete_activity_prompt_transition_rejected(
      current_state,
      confirm_event,
      deleting_result.error,
    );
    return false;
  }
  command.set_prompt_state(deleting_result.data);
  const delete_succeeded = await command.delete_activity();
  command.set_prompt_state(
    advance_calendar_delete_activity_prompt_state(command.get_prompt_state(), {
      type: delete_succeeded ? EVENT.DELETE_SUCCEEDED : EVENT.DELETE_FAILED,
    }),
  );
  return delete_succeeded;
}
