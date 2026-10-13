import { CALENDAR_TOKEN_LOG_SCOPE } from "./CalendarTokenConstants";
import { create_log_target_builder } from "./FailureRelay";

export const calendar_token_log_target = create_log_target_builder(
  CALENDAR_TOKEN_LOG_SCOPE,
);
