import type {
  DBCoreDeleteRangeRequest,
  DBCoreMutateRequest,
  DBCoreMutateResponse,
  DBCorePutRequest,
  DBCoreTable,
} from "dexie";

import {
  SyncOutboxOperation,
  type SyncOutboxOperationValue,
} from "./syncOutboxTypes";

export const WrittenKeysKind = {
  TRACKED: "tracked",
  UNTRACKED_BULK_CLEAR: "untracked_bulk_clear",
} as const;

export type WrittenKeys =
  | {
      kind: typeof WrittenKeysKind.TRACKED;
      operation: SyncOutboxOperationValue;
      select_successful_keys(response: DBCoreMutateResponse): string[];
    }
  | { kind: typeof WrittenKeysKind.UNTRACKED_BULK_CLEAR };

const DEXIE_ANY_RANGE_TYPE = 3;

const DexieMutationType = {
  ADD: "add",
  PUT: "put",
  DELETE: "delete",
  DELETE_RANGE: "deleteRange",
} as const;

function create_tracked_keys(
  operation: SyncOutboxOperationValue,
  keys: readonly unknown[],
): WrittenKeys {
  return {
    kind: WrittenKeysKind.TRACKED,
    operation,
    select_successful_keys: (response: DBCoreMutateResponse): string[] =>
      keys.flatMap((key, index) =>
        index in response.failures ? [] : [String(key)],
      ),
  };
}

function has_keys(keys: unknown): keys is unknown[] {
  return Array.isArray(keys) && keys.length > 0;
}

function extract_put_keys(
  down_table: DBCoreTable,
  request: Pick<DBCorePutRequest, "keys" | "values" | "updates">,
): readonly unknown[] {
  if (has_keys(request.keys)) return request.keys;
  if (request.updates && has_keys(request.updates.keys))
    return request.updates.keys;
  const extract_key = down_table.schema.primaryKey.extractKey;
  return extract_key ? request.values.map(extract_key) : [];
}

function resolve_range_delete_keys<TResult>(
  down_table: DBCoreTable,
  request: DBCoreDeleteRangeRequest,
  continue_with: (written_keys: WrittenKeys) => Promise<TResult>,
): Promise<TResult> {
  if (request.range.type === DEXIE_ANY_RANGE_TYPE)
    return continue_with({ kind: WrittenKeysKind.UNTRACKED_BULK_CLEAR });
  return down_table
    .query({
      trans: request.trans,
      values: false,
      query: { index: down_table.schema.primaryKey, range: request.range },
    })
    .then((matching) =>
      continue_with(
        create_tracked_keys(SyncOutboxOperation.DELETE, matching.result),
      ),
    );
}

export function resolve_written_keys<TResult>(
  down_table: DBCoreTable,
  request: DBCoreMutateRequest,
  continue_with: (written_keys: WrittenKeys) => Promise<TResult>,
): Promise<TResult> {
  switch (request.type) {
    case DexieMutationType.ADD:
    case DexieMutationType.PUT:
      return continue_with(
        create_tracked_keys(
          SyncOutboxOperation.UPSERT,
          extract_put_keys(down_table, request),
        ),
      );
    case DexieMutationType.DELETE:
      return continue_with(
        create_tracked_keys(SyncOutboxOperation.DELETE, request.keys),
      );
    case DexieMutationType.DELETE_RANGE:
      return resolve_range_delete_keys(down_table, request, continue_with);
  }
}
