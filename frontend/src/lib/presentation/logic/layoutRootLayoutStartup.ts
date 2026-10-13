import {
  DEVICE_SESSION_STATUS,
  type DeviceSessionState,
} from "$lib/presentation/stores/deviceSessionState";

import {
  determine_session_action,
  SESSION_ACTION,
  type SessionAction,
} from "./layoutLogic";
import {
  PENDING_CLERK_SIGN_OUT_OUTCOME,
  type PendingClerkSignOutOutcome,
} from "./pendingClerkSignOutCompletion";

export const ROOT_LAYOUT_STARTUP_OUTCOME = {
  READY: "ready",
  SERVER_UNAVAILABLE: "server_unavailable",
} as const;

const REDIRECT_TO_LOGIN_INIT_RESULT = "redirect_to_login";
const ROOT_LAYOUT_SESSION_ACTION_EVENT = "root_layout_session_action_selected";
const ROOT_LAYOUT_SESSION_ENDED_EVENT = "root_layout_verified_session_ended";

type RootLayoutStartupOutcome =
  (typeof ROOT_LAYOUT_STARTUP_OUTCOME)[keyof typeof ROOT_LAYOUT_STARTUP_OUTCOME];

export interface RootLayoutSessionHandlers {
  login_sync(): Promise<unknown>;
  verified_page_reload(): Promise<unknown>;
  first_time_anonymous(): Promise<unknown>;
  returning_anonymous(): Promise<unknown>;
  session_ended(): Promise<unknown>;
}

interface RootLayoutStartupCommand {
  current_path: string;
  run_startup_storage_recovery(): Promise<unknown>;
  initialize_stores(): Promise<unknown>;
  subscribe_layout_state(): boolean;
  has_session_been_synced(): Promise<boolean>;
  resolve_current_device_session(): Promise<DeviceSessionState>;
  complete_pending_clerk_sign_out(): Promise<PendingClerkSignOutOutcome>;
  initialize_app_data(options: {
    current_path: string;
    session_already_synced: boolean;
  }): Promise<string>;
  is_signed_in(): boolean;
  session_handlers: RootLayoutSessionHandlers;
}

export async function run_root_layout_session_action(
  session_action: SessionAction,
  handlers: RootLayoutSessionHandlers,
): Promise<unknown> {
  console.log("[Layout] Session action selected", {
    event: ROOT_LAYOUT_SESSION_ACTION_EVENT,
    session_action,
  });
  switch (session_action) {
    case SESSION_ACTION.LOGIN_SYNC:
      return handlers.login_sync();
    case SESSION_ACTION.VERIFIED_PAGE_RELOAD:
      return handlers.verified_page_reload();
    case SESSION_ACTION.FIRST_TIME_ANONYMOUS:
      return handlers.first_time_anonymous();
    case SESSION_ACTION.RETURNING_ANONYMOUS:
      return handlers.returning_anonymous();
  }
}

async function has_verified_session_ended(
  command: RootLayoutStartupCommand,
): Promise<boolean> {
  if (command.is_signed_in()) return false;
  const device_session = await command.resolve_current_device_session();
  return device_session.status === DEVICE_SESSION_STATUS.SESSION_ENDED;
}

async function has_finished_deferred_sign_out(
  command: RootLayoutStartupCommand,
): Promise<boolean> {
  if (!command.is_signed_in()) return false;
  const outcome = await command.complete_pending_clerk_sign_out();
  return outcome !== PENDING_CLERK_SIGN_OUT_OUTCOME.NONE_PENDING;
}

export async function run_root_layout_startup(
  command: RootLayoutStartupCommand,
): Promise<RootLayoutStartupOutcome> {
  await command.run_startup_storage_recovery();
  await command.initialize_stores();
  command.subscribe_layout_state();
  const session_already_synced = await command.has_session_been_synced();
  const init_result = await command.initialize_app_data({
    current_path: command.current_path,
    session_already_synced,
  });
  if (init_result === REDIRECT_TO_LOGIN_INIT_RESULT)
    return ROOT_LAYOUT_STARTUP_OUTCOME.SERVER_UNAVAILABLE;
  if (await has_verified_session_ended(command)) {
    console.warn("[Layout] Signed-in data found after the session ended", {
      event: ROOT_LAYOUT_SESSION_ENDED_EVENT,
    });
    await command.session_handlers.session_ended();
    return ROOT_LAYOUT_STARTUP_OUTCOME.READY;
  }
  if (await has_finished_deferred_sign_out(command)) {
    await command.session_handlers.returning_anonymous();
    return ROOT_LAYOUT_STARTUP_OUTCOME.READY;
  }
  await run_root_layout_session_action(
    determine_session_action(command.is_signed_in(), session_already_synced),
    command.session_handlers,
  );
  return ROOT_LAYOUT_STARTUP_OUTCOME.READY;
}
