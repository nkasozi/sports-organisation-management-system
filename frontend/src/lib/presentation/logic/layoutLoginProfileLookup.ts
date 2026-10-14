import type { Result } from "$lib/core/types/Result";
import { AUTH_STORE_MESSAGES } from "$lib/presentation/stores/authStoreConstants";
import type { ConvexUserProfile } from "$lib/presentation/stores/authTypes";

import {
  LOGIN_PROFILE_LOOKUP_STATUS,
  type LoginProfileLookup,
} from "./layoutLoginSyncPorts";
import {
  run_with_timeout,
  SESSION_OPERATION_TIMEOUT_MS,
  TIMED_OPERATION_STATUS,
} from "./layoutSessionTimeouts";

const PROFILE_LOOKUP_UNAVAILABLE_EVENT = "login_profile_lookup_unavailable";
const PROFILE_LOOKUP_TIMED_OUT = "profile_lookup_timed_out";

type ProfileFetcher = () => Promise<Result<ConvexUserProfile>>;

function report_unavailable(error: string): LoginProfileLookup {
  console.warn("[Layout] Profile lookup could not reach the server", {
    event: PROFILE_LOOKUP_UNAVAILABLE_EVENT,
    error,
  });
  return { status: LOGIN_PROFILE_LOOKUP_STATUS.UNAVAILABLE, error };
}

function classify_profile_result(
  profile_result: Result<ConvexUserProfile>,
): LoginProfileLookup {
  if (profile_result.success)
    return {
      status: LOGIN_PROFILE_LOOKUP_STATUS.FOUND,
      profile: profile_result.data,
    };
  return profile_result.error ===
    AUTH_STORE_MESSAGES.CONVEX_PROFILE_LOOKUP_FAILED
    ? report_unavailable(profile_result.error)
    : {
        status: LOGIN_PROFILE_LOOKUP_STATUS.NOT_FOUND,
        error: profile_result.error,
      };
}

export async function look_up_login_profile(
  fetch_profile: ProfileFetcher,
): Promise<LoginProfileLookup> {
  const outcome = await run_with_timeout(
    fetch_profile(),
    SESSION_OPERATION_TIMEOUT_MS.PROFILE_LOOKUP,
  );
  switch (outcome.status) {
    case TIMED_OPERATION_STATUS.COMPLETED:
      return classify_profile_result(outcome.value);
    case TIMED_OPERATION_STATUS.TIMED_OUT:
      return report_unavailable(PROFILE_LOOKUP_TIMED_OUT);
    case TIMED_OPERATION_STATUS.FAILED:
      return report_unavailable(outcome.error);
  }
}
