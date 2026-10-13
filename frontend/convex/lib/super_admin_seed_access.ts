import type { MutationCtx } from "../_generated/server";
import type { ConvexResult } from "./auth_middleware";
import {
  BOOTSTRAP_ALLOWLIST_NOT_CONFIGURED_MESSAGE,
  type BootstrapAllowlist,
  read_bootstrap_allowlist_from_environment,
} from "./bootstrap_allowlist";
import {
  decide_super_admin_seed,
  resolve_bootstrap_state,
  type SeedCaller,
  SeedCallerKind,
  SeedDecisionStatus,
  SeedRejection,
  type SeedRejectionValue,
} from "./bootstrap_gate";
import {
  build_convex_failure,
  ConvexErrorCode,
  type ConvexFailure,
} from "./convex_errors";
import { schedule_security_audit } from "./security_audit_scheduler";
import { SecurityEventType } from "./security_event_types";
import {
  SYSTEM_USER_EMAIL_INDEX_NAME,
  SYSTEM_USER_ENTITY_TYPE,
  SYSTEM_USERS_TABLE_NAME,
} from "./system_user_constants";
import { load_system_user_census } from "./system_user_policy_context";
import { is_object_record, is_string } from "./value_guards";

const EMPTY_FIELD_VALUE = "";
const SEED_BLOCKED_EVENT = "super_admin_seed_blocked";
const EMAIL_VERIFIED_CLAIM_NAME = "emailVerified";

function read_identity_email(identity: unknown): string {
  if (!is_object_record(identity)) return EMPTY_FIELD_VALUE;
  const email = identity.email;
  return is_string(email) ? email.trim().toLowerCase() : EMPTY_FIELD_VALUE;
}

function read_identity_email_verified(identity: unknown): boolean {
  return (
    is_object_record(identity) && identity[EMAIL_VERIFIED_CLAIM_NAME] === true
  );
}

function build_seed_rejection_failure(
  rejection: SeedRejectionValue,
): ConvexFailure {
  const failure = build_convex_failure(ConvexErrorCode.ACCESS_DENIED);
  return rejection === SeedRejection.BOOTSTRAP_ALLOWLIST_NOT_CONFIGURED
    ? { ...failure, error: BOOTSTRAP_ALLOWLIST_NOT_CONFIGURED_MESSAGE }
    : failure;
}

async function resolve_seed_caller(ctx: MutationCtx): Promise<SeedCaller> {
  const identity = await ctx.auth.getUserIdentity();
  const caller_email = read_identity_email(identity);
  if (!caller_email) return { kind: SeedCallerKind.ANONYMOUS };
  const registered_user = await ctx.db
    .query(SYSTEM_USERS_TABLE_NAME)
    .withIndex(SYSTEM_USER_EMAIL_INDEX_NAME, (query) =>
      query.eq("email", caller_email),
    )
    .first();
  if (!registered_user)
    return {
      kind: SeedCallerKind.UNREGISTERED,
      email: caller_email,
      email_verified: read_identity_email_verified(identity),
    };
  return {
    kind: SeedCallerKind.REGISTERED,
    email: caller_email,
    role: registered_user.role,
    organization_id: registered_user.organization_id ?? EMPTY_FIELD_VALUE,
    status: registered_user.status ?? EMPTY_FIELD_VALUE,
  };
}

async function audit_blocked_seed(
  ctx: MutationCtx,
  caller: SeedCaller,
  reason: string,
): Promise<boolean> {
  return schedule_security_audit(ctx, {
    event_type: SecurityEventType.SEED_ADMIN_BLOCKED,
    entity_type: SYSTEM_USER_ENTITY_TYPE,
    entity_id: EMPTY_FIELD_VALUE,
    user_email:
      caller.kind === SeedCallerKind.ANONYMOUS
        ? EMPTY_FIELD_VALUE
        : caller.email,
    organization_id:
      caller.kind === SeedCallerKind.REGISTERED
        ? caller.organization_id
        : EMPTY_FIELD_VALUE,
    details: `Super admin seed blocked: ${reason}`,
  });
}

export async function authorize_super_admin_seed(
  ctx: MutationCtx,
  target_email: string,
  read_bootstrap_allowlist: () => BootstrapAllowlist = read_bootstrap_allowlist_from_environment,
): Promise<ConvexResult<true>> {
  const caller = await resolve_seed_caller(ctx);
  const bootstrap = resolve_bootstrap_state(await load_system_user_census(ctx));
  const decision = decide_super_admin_seed({
    bootstrap,
    caller,
    target_email,
    bootstrap_allowlist: read_bootstrap_allowlist(),
  });
  if (decision.status === SeedDecisionStatus.ALLOWED) {
    console.log("[SuperAdminSeed] Seed authorized", {
      event: "super_admin_seed_authorized",
      bootstrap_phase: bootstrap.phase,
      caller_kind: caller.kind,
    });
    return { success: true, data: true };
  }
  await audit_blocked_seed(
    ctx,
    caller,
    `${decision.rejection} (${bootstrap.phase})`,
  );
  console.warn("[SuperAdminSeed] Seed blocked", {
    event: SEED_BLOCKED_EVENT,
    rejection: decision.rejection,
    bootstrap_phase: bootstrap.phase,
    caller_kind: caller.kind,
  });
  return build_seed_rejection_failure(decision.rejection);
}
