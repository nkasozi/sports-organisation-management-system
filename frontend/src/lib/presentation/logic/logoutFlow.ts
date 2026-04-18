import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

const LOGOUT_FLOW_FAILED_EVENT = "logout_flow_failed";
const LOGOUT_FLOW_FAILED_MESSAGE = "Logout flow failed";

interface LogoutFlowCommand {
  clear_session_sync_flag(): Promise<unknown>;
  sign_out(): Promise<unknown>;
  before_sign_out?(): Promise<unknown>;
  after_sign_out?(): Promise<unknown>;
}

export async function execute_logout_flow(
  command: LogoutFlowCommand,
): Promise<Result<boolean>> {
  try {
    await command.clear_session_sync_flag();

    if (command.before_sign_out) {
      await command.before_sign_out();
    }

    await command.sign_out();

    if (command.after_sign_out) {
      await command.after_sign_out();
    }

    return create_success_result(true);
  } catch (error) {
    console.error("[LogoutFlow] Logout flow failed", {
      event: LOGOUT_FLOW_FAILED_EVENT,
      error: String(error),
    });

    return create_failure_result(LOGOUT_FLOW_FAILED_MESSAGE);
  }
}
