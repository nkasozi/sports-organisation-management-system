import type {
  IsoDateTimeString,
  ScalarInput,
} from "$lib/core/types/DomainScalars";

import type { AccessDeniedPayload, UserContext } from "./EventBusTypes";

enum USER_CONTEXT_STATUS {
  MISSING = "missing",
  PRESENT = "present",
}

type UserContextState =
  | { status: USER_CONTEXT_STATUS.MISSING }
  | { status: USER_CONTEXT_STATUS.PRESENT; context: UserContext };

type AccessDeniedRole = NonNullable<
  AccessDeniedPayload["user_context"]
>["role"];

let current_user_context_state: UserContextState = {
  status: USER_CONTEXT_STATUS.MISSING,
};

export function create_event_timestamp(): IsoDateTimeString {
  return new Date().toISOString() as IsoDateTimeString;
}

export function set_user_context(
  context: UserContext | ScalarInput<UserContext> | undefined,
): void {
  current_user_context_state = context
    ? { status: USER_CONTEXT_STATUS.PRESENT, context: context as UserContext }
    : { status: USER_CONTEXT_STATUS.MISSING };
}

export function clear_user_context(): void {
  current_user_context_state = { status: USER_CONTEXT_STATUS.MISSING };
}

export function build_user_context_fields(): { user_context?: UserContext } {
  switch (current_user_context_state.status) {
    case USER_CONTEXT_STATUS.PRESENT:
      return { user_context: current_user_context_state.context };
    case USER_CONTEXT_STATUS.MISSING:
      return {};
  }
}

export function build_role_user_context_fields(role: AccessDeniedRole): {
  user_context?: UserContext & { role: AccessDeniedRole };
} {
  switch (current_user_context_state.status) {
    case USER_CONTEXT_STATUS.PRESENT:
      return { user_context: { ...current_user_context_state.context, role } };
    case USER_CONTEXT_STATUS.MISSING:
      return {};
  }
}
