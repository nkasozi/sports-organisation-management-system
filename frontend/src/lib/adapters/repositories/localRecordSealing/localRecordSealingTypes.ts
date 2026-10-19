import type { Option } from "$lib/core/types/Option";

export const SEALED_RECORD_FIELD_NAME = "__sealed";
export const LOCAL_RECORD_SEALING_MIDDLEWARE_NAME = "LocalRecordSealing";
export const LOCAL_RECORD_SEALING_MIDDLEWARE_LEVEL = -2;
export const ASSOCIATED_DATA_SEPARATOR = "\u0000";

export const LocalRecordSealingFailure = {
  LOCKED: "Local data is locked; unlock the local vault before using it",
  SEAL_FAILED: "A local record could not be sealed",
} as const;

export const LocalRecordSealingEvent = {
  LOCKED_ACCESS_REJECTED: "local_record_sealing_locked_access_rejected",
  SEAL_FAILED: "local_record_sealing_seal_failed",
} as const;

export const LocalRecordSealingOperation = {
  MUTATE: "mutate",
  GET: "get",
  GET_MANY: "getMany",
  QUERY: "query",
  OPEN_CURSOR: "openCursor",
} as const;

export type LocalRecordSealingOperationValue =
  (typeof LocalRecordSealingOperation)[keyof typeof LocalRecordSealingOperation];

export interface LocalRecordSealingPlan {
  table_name: string;
  visible_field_paths: readonly string[];
}

export interface LocalRecordSealingDependencies {
  read_data_key(): Option<Uint8Array>;
  report_unreadable_records(table_name: string, record_count: number): boolean;
}

export interface OpenedLocalRows {
  values: unknown[];
  unreadable_count: number;
}
