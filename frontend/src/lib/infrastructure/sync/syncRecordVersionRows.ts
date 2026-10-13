import {
  SyncRecordState,
  type SyncRecordVersionRow,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import { is_record_value } from "$lib/infrastructure/utils/runtimeTypeGuards";

export const KnownRecordVersionKind = {
  NONE: "none",
  LIVE: "live",
  DELETED: "deleted",
} as const;

export type KnownRecordVersion =
  | { kind: typeof KnownRecordVersionKind.NONE }
  | { kind: typeof KnownRecordVersionKind.LIVE; version: number }
  | { kind: typeof KnownRecordVersionKind.DELETED; version: number };

export const IncomingVersionRule = {
  CHANGE_FEED: "change_feed",
  SNAPSHOT_PROJECTION: "snapshot_projection",
} as const;

export type IncomingVersionRuleValue =
  (typeof IncomingVersionRule)[keyof typeof IncomingVersionRule];

const NO_KNOWN_VERSION: KnownRecordVersion = {
  kind: KnownRecordVersionKind.NONE,
};

export function read_known_record_version(row: unknown): KnownRecordVersion {
  if (!is_record_value(row)) return NO_KNOWN_VERSION;
  const version = Number(row.server_version);
  if (!Number.isFinite(version)) return NO_KNOWN_VERSION;
  return row.record_state === SyncRecordState.DELETED
    ? { kind: KnownRecordVersionKind.DELETED, version }
    : { kind: KnownRecordVersionKind.LIVE, version };
}

export function read_known_version_number(known: KnownRecordVersion): number {
  switch (known.kind) {
    case KnownRecordVersionKind.NONE:
      return 0;
    case KnownRecordVersionKind.LIVE:
    case KnownRecordVersionKind.DELETED:
      return known.version;
  }
}

export function is_incoming_version_stale(
  known: KnownRecordVersion,
  incoming_version: number,
  rule: IncomingVersionRuleValue,
): boolean {
  switch (known.kind) {
    case KnownRecordVersionKind.NONE:
      return false;
    case KnownRecordVersionKind.DELETED:
      return known.version >= incoming_version;
    case KnownRecordVersionKind.LIVE:
      return rule === IncomingVersionRule.SNAPSHOT_PROJECTION
        ? known.version >= incoming_version
        : known.version > incoming_version;
  }
}

export function build_live_version_row(
  table_name: string,
  local_id: string,
  server_version: number,
): SyncRecordVersionRow {
  return {
    table_name,
    local_id,
    server_version,
    record_state: SyncRecordState.LIVE,
  };
}

export function build_tombstone_version_row(
  table_name: string,
  local_id: string,
  server_version: number,
): SyncRecordVersionRow {
  return {
    table_name,
    local_id,
    server_version,
    record_state: SyncRecordState.DELETED,
  };
}
