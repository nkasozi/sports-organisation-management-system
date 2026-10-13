import { SESSION_SYNC_NOTICE_KIND } from "$lib/presentation/stores/sessionSyncNotice";

import type { LayoutLoginSyncDependencies } from "./layoutLoginSyncPorts";
import { LAYOUT_SESSION_EVENT } from "./layoutSessionConstants";

type FailedLoginSignOutDependencies = Pick<
  LayoutLoginSyncDependencies,
  "sign_out_and_tear_down_device" | "show_session_notice"
>;

export async function sign_out_after_failed_login(
  dependencies: FailedLoginSignOutDependencies,
  landing_path: string,
): Promise<boolean> {
  const teardown_result =
    await dependencies.sign_out_and_tear_down_device(landing_path);
  if (teardown_result.success) return true;
  console.error("[Layout] Sign-out after failed login could not finish", {
    event: LAYOUT_SESSION_EVENT.FAILED_LOGIN_TEARDOWN_FAILED,
    landing_path,
    error: teardown_result.error,
  });
  dependencies.show_session_notice(
    SESSION_SYNC_NOTICE_KIND.SIGN_OUT_CLEANUP_FAILED,
  );
  return false;
}
