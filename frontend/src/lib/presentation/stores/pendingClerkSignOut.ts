import { get_app_settings_storage } from "$lib/infrastructure/container";

const PENDING_CLERK_SIGN_OUT_KEY = "sports_org_pending_clerk_sign_out";
const PENDING_CLERK_SIGN_OUT_VALUE = "pending";
const PENDING_CLERK_SIGN_OUT_EVENT = {
  MARKED: "pending_clerk_sign_out_marked",
  CLEARED: "pending_clerk_sign_out_cleared",
} as const;

export async function mark_pending_clerk_sign_out(): Promise<boolean> {
  await get_app_settings_storage().set_setting(
    PENDING_CLERK_SIGN_OUT_KEY,
    PENDING_CLERK_SIGN_OUT_VALUE,
  );
  console.warn("[Logout] Clerk sign-out deferred until it is reachable", {
    event: PENDING_CLERK_SIGN_OUT_EVENT.MARKED,
  });
  return true;
}

export async function has_pending_clerk_sign_out(): Promise<boolean> {
  const stored_value = await get_app_settings_storage().get_setting(
    PENDING_CLERK_SIGN_OUT_KEY,
  );
  return stored_value === PENDING_CLERK_SIGN_OUT_VALUE;
}

export async function clear_pending_clerk_sign_out(): Promise<boolean> {
  await get_app_settings_storage().remove_setting(PENDING_CLERK_SIGN_OUT_KEY);
  console.log("[Logout] Deferred Clerk sign-out cleared", {
    event: PENDING_CLERK_SIGN_OUT_EVENT.CLEARED,
  });
  return true;
}
