import type { Clerk } from "@clerk/clerk-js";

import type { Option } from "$lib/core/types/Option";
import {
  create_none_option,
  create_some_option,
  OptionStatus,
} from "$lib/core/types/Option";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  CLERK_ERROR_CODE,
  CLERK_LOG_EVENT,
  CLERK_MESSAGE,
} from "./clerkAuthConstants";

const MAX_WAIT_MS = 10000;
const POLL_INTERVAL_MS = 100;

type LoadableClerk = Clerk & { loaded?: boolean };

const CLERK_LOAD_STATUS = {
  LOADED: "loaded",
  STILL_LOADING: "still_loading",
} as const;

export type ClerkLoadOutcome =
  | { status: typeof CLERK_LOAD_STATUS.LOADED; clerk: Clerk }
  | { status: typeof CLERK_LOAD_STATUS.STILL_LOADING; clerk: Clerk };

interface PollOutcome {
  is_ready: boolean;
  elapsed_ms: number;
}

async function poll_until(
  is_ready: () => boolean,
  starting_elapsed_ms: number,
): Promise<PollOutcome> {
  let elapsed_ms = starting_elapsed_ms;
  while (!is_ready() && elapsed_ms < MAX_WAIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    elapsed_ms += POLL_INTERVAL_MS;
  }
  return { is_ready: is_ready(), elapsed_ms };
}

async function wait_for_pending_session(
  clerk: LoadableClerk,
  elapsed_ms: number,
): Promise<boolean> {
  console.log("[Clerk] User exists, waiting for session", {
    event: CLERK_LOG_EVENT.SESSION_PENDING,
  });
  const outcome = await poll_until(() => Boolean(clerk.session), elapsed_ms);
  if (!outcome.is_ready) {
    console.warn("[Clerk] Session did not become available in time", {
      event: CLERK_LOG_EVENT.SESSION_PENDING_TIMED_OUT,
      waited_ms: outcome.elapsed_ms,
    });
    return false;
  }
  console.log("[Clerk] Session now available", {
    event: CLERK_LOG_EVENT.SESSION_READY,
  });
  return true;
}

function read_window_clerk(): Option<LoadableClerk> {
  const window_clerk = window.Clerk as unknown as LoadableClerk;
  return window_clerk ? create_some_option(window_clerk) : create_none_option();
}

export async function wait_for_loaded_clerk(): Promise<
  Result<ClerkLoadOutcome>
> {
  const clerk_poll = await poll_until(
    () => read_window_clerk().status === OptionStatus.SOME,
    0,
  );
  const clerk_option = read_window_clerk();
  if (clerk_option.status !== OptionStatus.SOME) {
    console.error("[Clerk] ClerkProvider did not load Clerk in time", {
      event: CLERK_LOG_EVENT.LOAD_TIMED_OUT,
      error_code: CLERK_ERROR_CODE.LOAD_TIMED_OUT,
      waited_ms: clerk_poll.elapsed_ms,
    });
    return create_failure_result(CLERK_MESSAGE.LOAD_TIMED_OUT);
  }
  const clerk = clerk_option.value;
  const load_poll = await poll_until(
    () => Boolean(clerk.loaded),
    clerk_poll.elapsed_ms,
  );
  if (clerk.user && !clerk.session)
    await wait_for_pending_session(clerk, load_poll.elapsed_ms);
  if (load_poll.is_ready)
    return create_success_result({ status: CLERK_LOAD_STATUS.LOADED, clerk });
  console.warn("[Clerk] Clerk is still loading; state will sync later", {
    event: CLERK_LOG_EVENT.LOAD_INCOMPLETE,
    waited_ms: load_poll.elapsed_ms,
  });
  return create_success_result({
    status: CLERK_LOAD_STATUS.STILL_LOADING,
    clerk,
  });
}
