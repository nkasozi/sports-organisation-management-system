import type { Result } from "$lib/core/types/Result";

import {
  generate_token_for_profile,
  load_saved_profile_id,
  save_token,
} from "./authHelpers";
import {
  type OfflineVerifiedSessionRequest,
  restore_offline_verified_session,
} from "./authOfflineVerifiedSessionRestore";
import { verify_saved_token } from "./authSavedTokenVerification";
import type { ResolvedAuthSession } from "./authSignedInSessionResolution";

export function restore_offline_verified_session_from_device(
  request: OfflineVerifiedSessionRequest,
): Promise<Result<ResolvedAuthSession>> {
  return restore_offline_verified_session(
    {
      verify_saved_token,
      load_saved_profile_id,
      generate_token_for_profile,
      save_token,
    },
    request,
  );
}
