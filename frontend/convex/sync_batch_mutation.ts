import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { select_clearable_fields } from "./lib/cleared_fields";
import {
  ConvexErrorCode,
  type ConvexFailure,
  log_convex_failure,
} from "./lib/convex_errors";
import {
  authorize_batch_caller,
  BatchOperation,
} from "./lib/sync_batch_authorization";
import { process_batch_record } from "./lib/sync_batch_record_processor";
import {
  type BatchBaseVersion,
  BatchBaseVersionKind,
  BatchFollowUpKind,
  type BatchRecordConflict,
  type BatchRecordDeletedRemotely,
  type BatchRecordInput,
  type BatchRecordOutcome,
  type BatchRecordResult,
} from "./lib/sync_batch_record_types";
import type { AllowedSyncTable } from "./lib/sync_table_catalog";
import { validate_table_name } from "./lib/sync_validation";
import {
  base_version_validator,
  type BaseVersion,
} from "./lib/sync_versioning";

export const MAX_BATCH_SIZE = 50;

type BatchFailure = ConvexFailure & {
  results: BatchRecordResult[];
  has_conflicts: false;
  conflicts: BatchRecordConflict[];
  deleted_remotely: BatchRecordDeletedRemotely[];
};

interface BatchCollection {
  results: BatchRecordResult[];
  conflicts: BatchRecordConflict[];
  deleted_remotely: BatchRecordDeletedRemotely[];
}

const BATCH_TOO_LARGE_EVENT = "sync_batch_too_large";

export function reject_oversized_batch(
  operation: string,
  record_count: number,
): ConvexFailure {
  return log_convex_failure(ConvexErrorCode.BATCH_TOO_LARGE, {
    event: BATCH_TOO_LARGE_EVENT,
    operation,
    record_count,
    max_batch_size: MAX_BATCH_SIZE,
  });
}

function build_batch_failure(failure: ConvexFailure): BatchFailure {
  return {
    ...failure,
    results: [],
    has_conflicts: false,
    conflicts: [],
    deleted_remotely: [],
  };
}

function to_batch_base_version(
  base_version: BaseVersion | undefined,
): BatchBaseVersion {
  return base_version
    ? { kind: BatchBaseVersionKind.PROVIDED, base_version }
    : { kind: BatchBaseVersionKind.LEGACY_CLIENT };
}

function collect_outcome(
  collection: BatchCollection,
  outcome: BatchRecordOutcome,
): BatchCollection {
  const results = [...collection.results, outcome.result];
  switch (outcome.follow_up.kind) {
    case BatchFollowUpKind.NONE:
      return { ...collection, results };
    case BatchFollowUpKind.CONFLICT:
      return {
        ...collection,
        results,
        conflicts: [...collection.conflicts, outcome.follow_up.conflict],
      };
    case BatchFollowUpKind.DELETED_REMOTELY:
      return {
        ...collection,
        results,
        deleted_remotely: [
          ...collection.deleted_remotely,
          outcome.follow_up.deleted_remotely,
        ],
      };
  }
}

function to_batch_record_input(
  table_name: AllowedSyncTable,
  record: {
    local_id: string;
    data: Record<string, unknown>;
    version: number;
    base_version?: BaseVersion;
    cleared_fields?: string[];
  },
): BatchRecordInput {
  return {
    local_id: record.local_id,
    data: record.data,
    version: record.version,
    cleared_fields: select_clearable_fields(
      table_name,
      record.cleared_fields ?? [],
    ),
    base: to_batch_base_version(record.base_version),
  };
}

export const batch_upsert = mutation({
  args: {
    table_name: v.string(),
    records: v.array(
      v.object({
        local_id: v.string(),
        data: v.any(),
        version: v.number(),
        base_version: v.optional(base_version_validator),
        cleared_fields: v.optional(v.array(v.string())),
      }),
    ),
    detect_conflicts: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { table_name, records } = args;
    if (records.length > MAX_BATCH_SIZE)
      return build_batch_failure(
        reject_oversized_batch(BatchOperation.UPSERT, records.length),
      );
    const table_validation = validate_table_name(table_name);
    if (!table_validation.success) return build_batch_failure(table_validation);
    const authorization = await authorize_batch_caller(ctx, {
      operation: BatchOperation.UPSERT,
      table_name,
      record_count: records.length,
    });
    if (!authorization.success) return build_batch_failure(authorization);
    let collection: BatchCollection = {
      results: [],
      conflicts: [],
      deleted_remotely: [],
    };
    for (const record of records) {
      const outcome = await process_batch_record(ctx, {
        table_name: table_validation.data,
        caller: authorization.data,
        record: to_batch_record_input(table_validation.data, record),
      });
      collection = collect_outcome(collection, outcome);
    }
    return {
      success: true,
      ...collection,
      has_conflicts: collection.conflicts.length > 0,
    };
  },
});
