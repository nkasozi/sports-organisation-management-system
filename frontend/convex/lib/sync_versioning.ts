import { v } from "convex/values";

import { has_meaningful_changes } from "../sync_record_helpers";
import { type Option, OptionStatus } from "./option";
import { read_record_version } from "./sync_record_store";

export const BaseVersionKind = {
  KNOWN: "known",
  UNKNOWN: "unknown",
  RECREATE: "recreate",
} as const;

export type BaseVersion =
  | { kind: typeof BaseVersionKind.KNOWN; version: number }
  | { kind: typeof BaseVersionKind.UNKNOWN }
  | { kind: typeof BaseVersionKind.RECREATE };

export const base_version_validator = v.union(
  v.object({ kind: v.literal(BaseVersionKind.KNOWN), version: v.number() }),
  v.object({ kind: v.literal(BaseVersionKind.UNKNOWN) }),
  v.object({ kind: v.literal(BaseVersionKind.RECREATE) }),
);

export const VersionedUpsertKind = {
  INSERT: "insert",
  UPDATE: "update",
  UNCHANGED: "unchanged",
  CONFLICT: "conflict",
  DELETED_REMOTELY: "deleted_remotely",
} as const;

export type VersionedUpsertDecision =
  | { kind: typeof VersionedUpsertKind.INSERT; next_version: number }
  | { kind: typeof VersionedUpsertKind.UPDATE; next_version: number }
  | { kind: typeof VersionedUpsertKind.UNCHANGED; current_version: number }
  | { kind: typeof VersionedUpsertKind.CONFLICT; current_version: number }
  | {
      kind: typeof VersionedUpsertKind.DELETED_REMOTELY;
      remote_deletion: RemoteDeletion;
    };

export interface RemoteDeletion {
  version: number;
  deleted_at: string;
}

interface VersionedUpsertCommand {
  existing_record: Option<Record<string, unknown>>;
  remote_deletion: Option<RemoteDeletion>;
  base_version: Option<BaseVersion>;
  incoming_data: Record<string, unknown>;
  legacy_incoming_version: number;
}

const NO_PREVIOUS_VERSION = 0;
const VERSION_INCREMENT = 1;

function is_explicit_recreate(base_version: Option<BaseVersion>): boolean {
  return (
    base_version.status === OptionStatus.SOME &&
    base_version.value.kind === BaseVersionKind.RECREATE
  );
}

function decide_absent_record_upsert(
  remote_deletion: Option<RemoteDeletion>,
  base_version: Option<BaseVersion>,
): VersionedUpsertDecision {
  if (remote_deletion.status === OptionStatus.NONE)
    return {
      kind: VersionedUpsertKind.INSERT,
      next_version: NO_PREVIOUS_VERSION + VERSION_INCREMENT,
    };
  return is_explicit_recreate(base_version)
    ? {
        kind: VersionedUpsertKind.INSERT,
        next_version: remote_deletion.value.version + VERSION_INCREMENT,
      }
    : {
        kind: VersionedUpsertKind.DELETED_REMOTELY,
        remote_deletion: remote_deletion.value,
      };
}

function decide_based_upsert(
  existing_record: Record<string, unknown>,
  base_version: BaseVersion,
  incoming_data: Record<string, unknown>,
): VersionedUpsertDecision {
  const current_version = read_record_version(existing_record);
  if (!has_meaningful_changes(incoming_data, existing_record))
    return { kind: VersionedUpsertKind.UNCHANGED, current_version };
  const base_matches =
    base_version.kind === BaseVersionKind.KNOWN &&
    base_version.version === current_version;
  return base_matches
    ? {
        kind: VersionedUpsertKind.UPDATE,
        next_version: current_version + VERSION_INCREMENT,
      }
    : { kind: VersionedUpsertKind.CONFLICT, current_version };
}

function resolve_effective_base_version(
  command: VersionedUpsertCommand,
): BaseVersion {
  return command.base_version.status === OptionStatus.SOME
    ? command.base_version.value
    : { kind: BaseVersionKind.KNOWN, version: command.legacy_incoming_version };
}

export function decide_versioned_upsert(
  command: VersionedUpsertCommand,
): VersionedUpsertDecision {
  if (command.existing_record.status === OptionStatus.NONE)
    return decide_absent_record_upsert(
      command.remote_deletion,
      command.base_version,
    );
  return decide_based_upsert(
    command.existing_record.value,
    resolve_effective_base_version(command),
    command.incoming_data,
  );
}
