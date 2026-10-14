import type { MutationCtx } from "../_generated/server";
import {
  build_legacy_scope_fields,
  TombstoneVisibilityKind,
} from "./sync_tombstone_scope";
import { resolve_tombstone_scope } from "./sync_tombstone_scope_resolution";
import { upsert_tombstone_row } from "./sync_tombstones";

interface AccessReviewTombstoneCommand {
  table_name: string;
  local_id: string;
  record: Record<string, unknown>;
  version: number;
  sync_sequence: number;
  reviewed_at: string;
}

export async function write_access_review_tombstone(
  ctx: MutationCtx,
  command: AccessReviewTombstoneCommand,
): Promise<boolean> {
  return upsert_tombstone_row(ctx, {
    table_name: command.table_name,
    local_id: command.local_id,
    version: command.version,
    sync_sequence: command.sync_sequence,
    deleted_at: command.reviewed_at,
    scope: build_legacy_scope_fields(command.table_name, command.record),
    visibility: {
      kind: TombstoneVisibilityKind.ACCESS_REVIEW,
      scope: await resolve_tombstone_scope(
        ctx,
        command.table_name,
        command.record,
      ),
    },
  });
}
