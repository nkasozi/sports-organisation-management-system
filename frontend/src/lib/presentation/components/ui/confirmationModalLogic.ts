export const CONFIRMATION_MODAL_DISMISS_TRIGGER = {
  BACKDROP_CLICK: "backdrop_click",
  KEY_PRESS: "key_press",
} as const;

const CONFIRMATION_MODAL_DISMISS_KEY = "Escape";

export const CONFIRMATION_MODAL_DEFAULT_TEXT = {
  TITLE: "Confirm Action",
  MESSAGE: "Are you sure you want to proceed?",
  CONFIRM: "Confirm",
  CANCEL: "Cancel",
  PROCESSING: "Processing...",
} as const;

type ConfirmationModalDismissTrigger =
  | {
      kind: typeof CONFIRMATION_MODAL_DISMISS_TRIGGER.BACKDROP_CLICK;
      target_is_backdrop: boolean;
    }
  | {
      kind: typeof CONFIRMATION_MODAL_DISMISS_TRIGGER.KEY_PRESS;
      key: string;
    };

interface ConfirmationModalDismissQuery {
  trigger: ConfirmationModalDismissTrigger;
  is_processing: boolean;
}

function is_dismiss_gesture(trigger: ConfirmationModalDismissTrigger): boolean {
  switch (trigger.kind) {
    case CONFIRMATION_MODAL_DISMISS_TRIGGER.BACKDROP_CLICK:
      return trigger.target_is_backdrop;
    case CONFIRMATION_MODAL_DISMISS_TRIGGER.KEY_PRESS:
      return trigger.key === CONFIRMATION_MODAL_DISMISS_KEY;
  }
}

export function should_dismiss_confirmation_modal(
  query: ConfirmationModalDismissQuery,
): boolean {
  if (query.is_processing) return false;
  return is_dismiss_gesture(query.trigger);
}
