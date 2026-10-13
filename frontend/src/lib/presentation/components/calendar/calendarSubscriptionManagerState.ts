import { type Option, OptionStatus } from "$lib/core/types/Option";

export const CALENDAR_SUBSCRIPTION_LOAD_STATUS = {
  LOADING: "loading",
  FAILED: "failed",
  READY: "ready",
} as const;

export type CalendarSubscriptionLoadState =
  | { status: typeof CALENDAR_SUBSCRIPTION_LOAD_STATUS.LOADING }
  | { status: typeof CALENDAR_SUBSCRIPTION_LOAD_STATUS.FAILED; message: string }
  | { status: typeof CALENDAR_SUBSCRIPTION_LOAD_STATUS.READY };

export function is_copy_success_for_token(
  copy_success_token: Option<string>,
  token: string,
): boolean {
  switch (copy_success_token.status) {
    case OptionStatus.SOME:
      return copy_success_token.value === token;
    case OptionStatus.NONE:
      return false;
  }
}

export const CALENDAR_SUBSCRIPTION_LOADING_STATE: CalendarSubscriptionLoadState =
  { status: CALENDAR_SUBSCRIPTION_LOAD_STATUS.LOADING };
