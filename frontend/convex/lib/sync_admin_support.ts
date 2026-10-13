import type { MutationCtx } from "../_generated/server";
import {
  build_scope_filter,
  type ConvexResult,
  require_auth,
  type SystemUserRecord,
} from "./auth_middleware";
import { CallerScopeKind, resolve_caller_scope } from "./caller_scope";
import { ConvexErrorCode, log_convex_failure } from "./convex_errors";

const METADATA_WRITE_DENIED_EVENT = "sync_metadata_write_denied";

export async function authorize_global_metadata_writer(
  ctx: MutationCtx,
): Promise<ConvexResult<SystemUserRecord>> {
  const auth_result = await require_auth(ctx);
  if (!auth_result.success) return auth_result;
  if (resolve_caller_scope(auth_result.data).kind === CallerScopeKind.GLOBAL)
    return auth_result;
  return log_convex_failure(ConvexErrorCode.ACCESS_DENIED, {
    event: METADATA_WRITE_DENIED_EVENT,
    user_id: auth_result.data._id,
  });
}

export function select_records_in_clear_scope<
  TRecord extends Record<string, unknown>,
>(
  records: TRecord[],
  caller: SystemUserRecord,
  entity_type: string,
): TRecord[] {
  const scope_filter = build_scope_filter(caller, entity_type);
  const scope_keys = Object.keys(scope_filter);
  return scope_keys.length === 0
    ? records
    : records.filter((record) =>
        scope_keys.every((key) => record[key] === scope_filter[key]),
      );
}
