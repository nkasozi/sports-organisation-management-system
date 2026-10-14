import {
  is_number_value,
  is_record_value,
  is_string_value,
} from "$lib/infrastructure/utils/runtimeTypeGuards";

const RESOLUTION_REJECTED_MESSAGE = "Conflict resolution rejected by server";
const MISSING_SERVER_VERSION_MESSAGE =
  "Server accepted the resolution but did not return the new record version";
const CONFLICT_DETECTED_ACTION = "conflict_detected";
const DELETED_REMOTELY_ACTION = "deleted_remotely";
const UNREPORTED_SERVER_VERSION = 0;

export const ConflictResolutionOutcomeKind = {
  RESOLVED: "resolved",
  REMOTE_CHANGED_AGAIN: "remote_changed_again",
  DELETED_REMOTELY: "deleted_remotely",
  FAILED: "failed",
} as const;

export type ConflictResolutionOutcome =
  | {
      kind: typeof ConflictResolutionOutcomeKind.RESOLVED;
      server_version: number;
    }
  | {
      kind: typeof ConflictResolutionOutcomeKind.REMOTE_CHANGED_AGAIN;
      server_version: number;
    }
  | {
      kind: typeof ConflictResolutionOutcomeKind.DELETED_REMOTELY;
      tombstone_version: number;
    }
  | { kind: typeof ConflictResolutionOutcomeKind.FAILED; error: string };

export function create_failed_resolution(
  error: string,
): ConflictResolutionOutcome {
  return { kind: ConflictResolutionOutcomeKind.FAILED, error };
}

function classify_rejection(
  response: Record<string, unknown>,
): ConflictResolutionOutcome {
  const server_version = is_number_value(response.server_version)
    ? response.server_version
    : UNREPORTED_SERVER_VERSION;
  switch (response.action) {
    case CONFLICT_DETECTED_ACTION:
      return {
        kind: ConflictResolutionOutcomeKind.REMOTE_CHANGED_AGAIN,
        server_version,
      };
    case DELETED_REMOTELY_ACTION:
      return {
        kind: ConflictResolutionOutcomeKind.DELETED_REMOTELY,
        tombstone_version: server_version,
      };
    default:
      return create_failed_resolution(
        is_string_value(response.error) && response.error
          ? response.error
          : RESOLUTION_REJECTED_MESSAGE,
      );
  }
}

export function classify_force_resolve_response(
  response: unknown,
): ConflictResolutionOutcome {
  const record: Record<string, unknown> = is_record_value(response)
    ? response
    : {};
  if (record.success !== true) return classify_rejection(record);
  return is_number_value(record.server_version)
    ? {
        kind: ConflictResolutionOutcomeKind.RESOLVED,
        server_version: record.server_version,
      }
    : create_failed_resolution(MISSING_SERVER_VERSION_MESSAGE);
}
