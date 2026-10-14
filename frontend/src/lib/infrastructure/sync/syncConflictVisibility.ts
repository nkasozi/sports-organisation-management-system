export const ConflictRemoteDataStatus = {
  VISIBLE: "visible",
  HIDDEN: "hidden",
} as const;

export type ConflictRemoteDataStatusValue =
  (typeof ConflictRemoteDataStatus)[keyof typeof ConflictRemoteDataStatus];

interface ServerConflictVisibility {
  local_id: string;
  remote_data_status: unknown;
}

export function normalize_remote_data_status(
  remote_data_status: unknown,
): ConflictRemoteDataStatusValue {
  switch (remote_data_status) {
    case ConflictRemoteDataStatus.HIDDEN:
      return ConflictRemoteDataStatus.HIDDEN;
    default:
      return ConflictRemoteDataStatus.VISIBLE;
  }
}

function is_server_conflict_visibility(
  value: unknown,
): value is ServerConflictVisibility {
  return (
    value instanceof Object &&
    typeof (value as { local_id?: unknown }).local_id === typeof ""
  );
}

export function collect_hidden_conflict_ids(
  conflicts: unknown,
): ReadonlySet<string> {
  const entries = Array.isArray(conflicts) ? conflicts : [];
  return new Set(
    entries
      .filter(is_server_conflict_visibility)
      .filter(
        (conflict) =>
          normalize_remote_data_status(conflict.remote_data_status) ===
          ConflictRemoteDataStatus.HIDDEN,
      )
      .map((conflict) => conflict.local_id),
  );
}
