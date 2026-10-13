import { get_authentication_adapter } from "$lib/adapters/iam/LocalAuthenticationAdapter";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import type { AuthToken } from "$lib/core/interfaces/ports";

import {
  AUTH_TOKEN_SEGMENT_SEPARATOR,
  AUTH_TOKEN_SIGNATURE_SEGMENT_INDEX,
  SAVED_TOKEN_VERIFICATION_STATUS,
} from "./authStoreConstants";

export type SavedTokenVerificationState =
  | {
      status: typeof SAVED_TOKEN_VERIFICATION_STATUS.VERIFIED;
      payload: AuthToken["payload"];
    }
  | { status: typeof SAVED_TOKEN_VERIFICATION_STATUS.INVALID };

export async function verify_saved_token(
  saved_token_raw: string,
): Promise<SavedTokenVerificationState> {
  const auth_adapter = get_authentication_adapter(get_system_user_repository());
  const verify_result = await auth_adapter.verify_token(saved_token_raw);
  if (
    !verify_result.success ||
    !verify_result.data.is_valid ||
    !verify_result.data.payload
  ) {
    return { status: SAVED_TOKEN_VERIFICATION_STATUS.INVALID };
  }
  return {
    status: SAVED_TOKEN_VERIFICATION_STATUS.VERIFIED,
    payload: verify_result.data.payload,
  };
}

export function build_restored_auth_token(
  payload: AuthToken["payload"],
  saved_token_raw: string,
): AuthToken {
  return {
    payload,
    signature: saved_token_raw.split(AUTH_TOKEN_SEGMENT_SEPARATOR)[
      AUTH_TOKEN_SIGNATURE_SEGMENT_INDEX
    ],
    raw_token: saved_token_raw,
  };
}
