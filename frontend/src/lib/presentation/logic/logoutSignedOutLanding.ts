import type { AsyncResult } from "$lib/core/types/Result";

export interface SignedOutLandingCommand {
  sign_out(): AsyncResult<true>;
  seed_signed_out_demo_data(): AsyncResult<boolean>;
  mark_anonymous_demo_session(): Promise<boolean>;
  mark_pending_clerk_sign_out(): Promise<boolean>;
}

const CLERK_SIGN_OUT_STATUS = {
  SIGNED_OUT: "signed_out",
  DEFERRED: "deferred",
} as const;

type ClerkSignOutStatus =
  (typeof CLERK_SIGN_OUT_STATUS)[keyof typeof CLERK_SIGN_OUT_STATUS];

const SIGNED_OUT_LANDING_EVENT = {
  CLERK_SIGN_OUT_DEFERRED: "logout_clerk_sign_out_deferred",
  DEMO_SEED_FAILED: "logout_demo_seed_failed",
  DEMO_READY: "logout_demo_ready",
} as const;

async function sign_out_of_clerk_when_reachable(
  command: SignedOutLandingCommand,
): Promise<ClerkSignOutStatus> {
  const sign_out_result = await command.sign_out();
  if (sign_out_result.success) return CLERK_SIGN_OUT_STATUS.SIGNED_OUT;
  console.warn("[Logout] Clerk could not be signed out; device was cleared", {
    event: SIGNED_OUT_LANDING_EVENT.CLERK_SIGN_OUT_DEFERRED,
    error: sign_out_result.error,
  });
  return CLERK_SIGN_OUT_STATUS.DEFERRED;
}

async function prepare_demo_experience(
  command: SignedOutLandingCommand,
): Promise<boolean> {
  const seed_result = await command.seed_signed_out_demo_data();
  if (!seed_result.success) {
    console.error("[Logout] Demo data could not be seeded after sign-out", {
      event: SIGNED_OUT_LANDING_EVENT.DEMO_SEED_FAILED,
      error: seed_result.error,
    });
    return false;
  }
  await command.mark_anonymous_demo_session();
  console.log("[Logout] Signed-out demo data ready", {
    event: SIGNED_OUT_LANDING_EVENT.DEMO_READY,
  });
  return true;
}

async function remember_deferred_clerk_sign_out(
  clerk_sign_out_status: ClerkSignOutStatus,
  command: SignedOutLandingCommand,
): Promise<boolean> {
  switch (clerk_sign_out_status) {
    case CLERK_SIGN_OUT_STATUS.SIGNED_OUT:
      return false;
    case CLERK_SIGN_OUT_STATUS.DEFERRED:
      return command.mark_pending_clerk_sign_out();
  }
}

export async function land_in_signed_out_demo(
  command: SignedOutLandingCommand,
): Promise<boolean> {
  const clerk_sign_out_status = await sign_out_of_clerk_when_reachable(command);
  const demo_ready = await prepare_demo_experience(command);
  await remember_deferred_clerk_sign_out(clerk_sign_out_status, command);
  return demo_ready;
}
