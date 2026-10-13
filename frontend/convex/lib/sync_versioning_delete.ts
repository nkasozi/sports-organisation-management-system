import { type Option, OptionStatus } from "./option";
import { read_record_version } from "./sync_record_store";
import { type BaseVersion, BaseVersionKind } from "./sync_versioning";
import { is_number } from "./value_guards";

export const VersionedDeleteKind = {
  DELETE: "delete",
  ALREADY_ABSENT: "already_absent",
  CONFLICT: "conflict",
} as const;

type VersionedDeleteDecision =
  | { kind: typeof VersionedDeleteKind.DELETE; tombstone_version: number }
  | { kind: typeof VersionedDeleteKind.ALREADY_ABSENT }
  | { kind: typeof VersionedDeleteKind.CONFLICT; current_version: number };

interface VersionedDeleteCommand {
  existing_record: Option<Record<string, unknown>>;
  base_version: Option<BaseVersion>;
}

const VERSION_INCREMENT = 1;
const VERSION_FIELD_NAME = "version";

function record_carries_server_version(
  record: Record<string, unknown>,
): boolean {
  return is_number(record[VERSION_FIELD_NAME]);
}

function decide_delete_for_base(
  base_version: BaseVersion,
  existing_record: Record<string, unknown>,
): VersionedDeleteDecision {
  const current_version = read_record_version(existing_record);
  const delete_decision: VersionedDeleteDecision = {
    kind: VersionedDeleteKind.DELETE,
    tombstone_version: current_version + VERSION_INCREMENT,
  };
  const conflict_decision: VersionedDeleteDecision = {
    kind: VersionedDeleteKind.CONFLICT,
    current_version,
  };
  switch (base_version.kind) {
    case BaseVersionKind.KNOWN:
      return base_version.version === current_version
        ? delete_decision
        : conflict_decision;
    case BaseVersionKind.UNKNOWN:
    case BaseVersionKind.RECREATE:
      return record_carries_server_version(existing_record)
        ? conflict_decision
        : delete_decision;
  }
}

export function decide_versioned_delete(
  command: VersionedDeleteCommand,
): VersionedDeleteDecision {
  if (command.existing_record.status === OptionStatus.NONE)
    return { kind: VersionedDeleteKind.ALREADY_ABSENT };
  if (command.base_version.status === OptionStatus.SOME)
    return decide_delete_for_base(
      command.base_version.value,
      command.existing_record.value,
    );
  return {
    kind: VersionedDeleteKind.DELETE,
    tombstone_version:
      read_record_version(command.existing_record.value) + VERSION_INCREMENT,
  };
}
