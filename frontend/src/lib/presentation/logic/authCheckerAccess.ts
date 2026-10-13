import type { AsyncResult } from "$lib/core/types/Result";
import {
  is_object_value,
  is_string_value,
} from "$lib/presentation/logic/runtimeTypeGuards";

export const AuthCheckerAccessStatus = {
  GRANTED: "granted",
  DENIED: "denied",
  CHECK_FAILED: "check_failed",
} as const;

type AuthCheckerAccessOutcome =
  | { status: typeof AuthCheckerAccessStatus.GRANTED }
  | { status: typeof AuthCheckerAccessStatus.DENIED; message: string }
  | { status: typeof AuthCheckerAccessStatus.CHECK_FAILED; error: string };

interface AuthCheckerAccessDependencies {
  get_session_token: () => AsyncResult<string>;
  query_current_user_profile: (session_token: string) => Promise<unknown>;
}

export const CURRENT_USER_PROFILE_QUERY =
  "authorization:get_current_user_profile";
const GENERIC_ACCESS_DENIED_MESSAGE = "Access denied";

function read_profile_response(response: unknown): AuthCheckerAccessOutcome {
  if (!is_object_value(response))
    return {
      status: AuthCheckerAccessStatus.DENIED,
      message: GENERIC_ACCESS_DENIED_MESSAGE,
    };
  if (Reflect.get(response, "success") === true)
    return { status: AuthCheckerAccessStatus.GRANTED };
  const error = Reflect.get(response, "error");
  return {
    status: AuthCheckerAccessStatus.DENIED,
    message:
      is_string_value(error) && error ? error : GENERIC_ACCESS_DENIED_MESSAGE,
  };
}

export async function verify_signed_in_user_access(
  dependencies: AuthCheckerAccessDependencies,
): Promise<AuthCheckerAccessOutcome> {
  const token_result = await dependencies.get_session_token();
  if (!token_result.success) {
    console.warn("[AuthChecker] Session token unavailable", {
      event: "auth_checker_session_token_unavailable",
      error: token_result.error,
    });
    return {
      status: AuthCheckerAccessStatus.CHECK_FAILED,
      error: token_result.error,
    };
  }
  return query_signed_in_user_access(dependencies, token_result.data);
}

async function query_signed_in_user_access(
  dependencies: AuthCheckerAccessDependencies,
  session_token: string,
): Promise<AuthCheckerAccessOutcome> {
  try {
    const outcome = read_profile_response(
      await dependencies.query_current_user_profile(session_token),
    );
    console.log("[AuthChecker] Access verified", {
      event: "auth_checker_access_verified",
      status: outcome.status,
    });
    return outcome;
  } catch (error) {
    console.error("[AuthChecker] Access verification failed", {
      event: "auth_checker_access_check_failed",
      error: String(error),
    });
    return {
      status: AuthCheckerAccessStatus.CHECK_FAILED,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
