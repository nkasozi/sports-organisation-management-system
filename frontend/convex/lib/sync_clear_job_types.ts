import type { GenericId } from "convex/values";

export const CLEAR_PAGE_SIZE = 50;
export const CLEAR_SCAN_BUDGET_PER_SLICE = 100;
export const MAX_CLEAR_JOB_CONTINUATIONS = 5000;

export const ClearJobStatus = {
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type ClearJobStatusValue =
  (typeof ClearJobStatus)[keyof typeof ClearJobStatus];

export const ClearJobKind = {
  CLEAR_TABLE: "clear_table",
  CLEAR_ALL_DEMO_DATA: "clear_all_demo_data",
} as const;

export type ClearJobKindValue =
  (typeof ClearJobKind)[keyof typeof ClearJobKind];

export const ClearCursorKind = {
  START: "start",
  AFTER: "after",
} as const;

export type ClearCursorKindValue =
  (typeof ClearCursorKind)[keyof typeof ClearCursorKind];

export const ClearJobFailureReason = {
  NONE: "",
  REQUESTER_ACCESS_REVOKED: "requester_access_revoked",
  CONTINUATION_LIMIT_REACHED: "continuation_limit_reached",
  INVALID_TABLE: "invalid_table",
} as const;

export type ClearJobFailureReasonValue =
  (typeof ClearJobFailureReason)[keyof typeof ClearJobFailureReason];

export interface ClearJobState {
  kind: ClearJobKindValue;
  status: ClearJobStatusValue;
  requester_email: string;
  permission_entity_type: string;
  table_names: string[];
  sequence_ceilings: number[];
  table_index: number;
  cursor_kind: ClearCursorKindValue;
  cursor_local_id: string;
  deleted_count: number;
  rejected_count: number;
  continuation_count: number;
  failure_reason: ClearJobFailureReasonValue;
  created_at: string;
  updated_at: string;
}

export interface StoredClearJob extends ClearJobState {
  _id: GenericId<"sync_clear_jobs">;
}

export const ClearJobEventType = {
  PAGE_PROCESSED: "page_processed",
  ACCESS_REVOKED: "access_revoked",
  CONTINUATION_SCHEDULED: "continuation_scheduled",
  TABLE_REJECTED: "table_rejected",
} as const;

export type ClearJobEvent =
  | {
      type: typeof ClearJobEventType.PAGE_PROCESSED;
      deleted_count: number;
      rejected_count: number;
      last_scanned_local_id: string;
      page_was_full: boolean;
    }
  | { type: typeof ClearJobEventType.ACCESS_REVOKED }
  | { type: typeof ClearJobEventType.CONTINUATION_SCHEDULED }
  | { type: typeof ClearJobEventType.TABLE_REJECTED };
