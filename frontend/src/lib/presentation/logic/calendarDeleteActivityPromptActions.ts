import {
  CALENDAR_DELETE_ACTIVITY_PROMPT_EVENT,
  type CalendarDeleteActivityPromptCommand,
  type CalendarDeleteActivityPromptEvent,
  confirm_calendar_delete_activity,
  log_calendar_delete_activity_prompt_transition_rejected,
  transition_calendar_delete_activity_prompt_state,
} from "./calendarDeleteActivityPrompt";

interface CalendarDeleteActivityPromptActions {
  request_choice: () => boolean;
  cancel: () => boolean;
  confirm: () => Promise<boolean>;
}

function apply_prompt_event(
  command: CalendarDeleteActivityPromptCommand,
  event: CalendarDeleteActivityPromptEvent,
): boolean {
  const current_state = command.get_prompt_state();
  const result = transition_calendar_delete_activity_prompt_state(
    current_state,
    event,
  );
  if (!result.success) {
    log_calendar_delete_activity_prompt_transition_rejected(
      current_state,
      event,
      result.error,
    );
    return false;
  }
  command.set_prompt_state(result.data);
  return true;
}

export function create_calendar_delete_activity_prompt_actions(
  command: CalendarDeleteActivityPromptCommand,
): CalendarDeleteActivityPromptActions {
  return {
    request_choice: () =>
      apply_prompt_event(command, {
        type: CALENDAR_DELETE_ACTIVITY_PROMPT_EVENT.CHOICE_REQUESTED,
      }),
    cancel: () =>
      apply_prompt_event(command, {
        type: CALENDAR_DELETE_ACTIVITY_PROMPT_EVENT.CANCELLED,
      }),
    confirm: () => confirm_calendar_delete_activity(command),
  };
}
