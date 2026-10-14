import {
  SyncRecordState,
  type SyncRecordVersionRow,
  UNKNOWN_SERVER_SEQUENCE,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import { is_record_value } from "$lib/infrastructure/utils/runtimeTypeGuards";

export const KnownRecordVersionKind = {
  NONE: "none",
  LIVE: "live",
  DELETED: "deleted",
} as const;

export type KnownRecordVersion =
  | { kind: typeof KnownRecordVersionKind.NONE }
  | {
      kind: typeof KnownRecordVersionKind.LIVE;
      version: number;
      sequence: number;
    }
  | {
      kind: typeof KnownRecordVersionKind.DELETED;
      version: number;
      sequence: number;
    };

export const IncomingChangeKind = {
  RECORD: "record",
  DELETION: "deletion",
} as const;

type IncomingChangeKindValue =
  (typeof IncomingChangeKind)[keyof typeof IncomingChangeKind];

interface IncomingChangeVersion {
  kind: IncomingChangeKindValue;
  version: number;
  sequence: number;
}

export const IncomingVersionRule = {
  CHANGE_FEED: "change_feed",
  SNAPSHOT_PROJECTION: "snapshot_projection",
} as const;

export type IncomingVersionRuleValue =
  (typeof IncomingVersionRule)[keyof typeof IncomingVersionRule];

const NO_KNOWN_VERSION: KnownRecordVersion = {
  kind: KnownRecordVersionKind.NONE,
};

function read_known_sequence(row: Record<string, unknown>): number {
  const sequence = Number(row.server_sequence);
  return Number.isFinite(sequence) ? sequence : UNKNOWN_SERVER_SEQUENCE;
}

export function read_known_record_version(row: unknown): KnownRecordVersion {
  if (!is_record_value(row)) return NO_KNOWN_VERSION;
  const version = Number(row.server_version);
  if (!Number.isFinite(version)) return NO_KNOWN_VERSION;
  const sequence = read_known_sequence(row);
  return row.record_state === SyncRecordState.DELETED
    ? { kind: KnownRecordVersionKind.DELETED, version, sequence }
    : { kind: KnownRecordVersionKind.LIVE, version, sequence };
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

function both_sequences_known(known: number, incoming: number): boolean {
  return known > UNKNOWN_SERVER_SEQUENCE && incoming > UNKNOWN_SERVER_SEQUENCE;
}

function is_stale_against_tombstone(
  known: { version: number; sequence: number },
  incoming: IncomingChangeVersion,
): boolean {
  if (both_sequences_known(known.sequence, incoming.sequence))
    return known.sequence >= incoming.sequence;
  switch (incoming.kind) {
    case IncomingChangeKind.DELETION:
      return known.version > incoming.version;
    case IncomingChangeKind.RECORD:
      return known.version >= incoming.version;
  }
}

export function is_incoming_version_stale(
  known: KnownRecordVersion,
  incoming: IncomingChangeVersion,
  rule: IncomingVersionRuleValue,
): boolean {
  switch (known.kind) {
    case KnownRecordVersionKind.NONE:
      return false;
    case KnownRecordVersionKind.DELETED:
      return is_stale_against_tombstone(known, incoming);
    case KnownRecordVersionKind.LIVE:
      return rule === IncomingVersionRule.SNAPSHOT_PROJECTION
        ? known.version >= incoming.version
        : known.version > incoming.version;
  }
}

export function build_live_version_row(
  table_name: string,
  local_id: string,
  server_version: number,
  server_sequence: number = UNKNOWN_SERVER_SEQUENCE,
): SyncRecordVersionRow {
  return {
    table_name,
    local_id,
    server_version,
    server_sequence,
    record_state: SyncRecordState.LIVE,
  };
}

export function build_tombstone_version_row(
  table_name: string,
  local_id: string,
  server_version: number,
  server_sequence: number = UNKNOWN_SERVER_SEQUENCE,
): SyncRecordVersionRow {
  return {
    table_name,
    local_id,
    server_version,
    server_sequence,
    record_state: SyncRecordState.DELETED,
  };
}
