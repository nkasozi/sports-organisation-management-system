import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import {
  type ServerAbsence,
  ServerAbsenceReason,
} from "./syncOutboxReviewAbsentDiscard";
import type { ConvexClient } from "./syncTypes";

const RECORD_LOOKUP_QUERY_NAME = "sync:get_record_by_local_id";
const SERVER_COPY_UNAVAILABLE_ERROR =
  "We couldn't load the saved copy from the server. Check your connection and try again.";

export const ServerCopyStatus = {
  FOUND: "found",
  NOT_FOUND: "not_found",
} as const;

export type ServerCopy =
  | { status: typeof ServerCopyStatus.FOUND; record: Record<string, unknown> }
  | { status: typeof ServerCopyStatus.NOT_FOUND; absence: ServerAbsence };

const NUMBER_TYPE_NAME = "number";

function parse_server_absence(lookup: {
  reason?: unknown;
  tombstone_version?: unknown;
}): ServerAbsence {
  switch (lookup.reason) {
    case ServerAbsenceReason.NEVER_EXISTED:
      return { reason: ServerAbsenceReason.NEVER_EXISTED };
    case ServerAbsenceReason.NOT_VISIBLE:
      return { reason: ServerAbsenceReason.NOT_VISIBLE };
    case ServerAbsenceReason.DELETED:
      return typeof lookup.tombstone_version === NUMBER_TYPE_NAME
        ? {
            reason: ServerAbsenceReason.DELETED,
            tombstone_version: Number(lookup.tombstone_version),
          }
        : { reason: ServerAbsenceReason.UNREPORTED };
    default:
      return { reason: ServerAbsenceReason.UNREPORTED };
  }
}

function parse_server_copy(response: unknown): Result<ServerCopy> {
  if (!(response instanceof Object))
    return create_failure_result(SERVER_COPY_UNAVAILABLE_ERROR);
  const lookup = response as {
    status?: unknown;
    record?: unknown;
    reason?: unknown;
    tombstone_version?: unknown;
  };
  switch (lookup.status) {
    case ServerCopyStatus.FOUND:
      return lookup.record instanceof Object
        ? create_success_result({
            status: ServerCopyStatus.FOUND,
            record: lookup.record as Record<string, unknown>,
          })
        : create_failure_result(SERVER_COPY_UNAVAILABLE_ERROR);
    case ServerCopyStatus.NOT_FOUND:
      return create_success_result({
        status: ServerCopyStatus.NOT_FOUND,
        absence: parse_server_absence(lookup),
      });
    default:
      return create_failure_result(SERVER_COPY_UNAVAILABLE_ERROR);
  }
}

export async function load_server_copy(
  dependencies: { convex_client: ConvexClient },
  table_name: string,
  local_id: string,
): AsyncResult<ServerCopy> {
  try {
    return parse_server_copy(
      await dependencies.convex_client.query(RECORD_LOOKUP_QUERY_NAME, {
        table_name,
        local_id,
      }),
    );
  } catch (error) {
    console.error("[Sync:Review] Server copy lookup failed", {
      event: "sync_review_server_copy_lookup_failed",
      table_name,
      local_id,
      error: String(error),
    });
    return create_failure_result(SERVER_COPY_UNAVAILABLE_ERROR);
  }
}
