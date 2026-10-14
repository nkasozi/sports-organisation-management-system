import { type Option, OptionStatus } from "./option";
import { SYSTEM_USERS_TABLE_NAME } from "./system_user_constants";
import { read_string_or } from "./value_guards";

export interface OwnershipRefreshTargets {
  team_ids: ReadonlySet<string>;
  player_ids: ReadonlySet<string>;
  official_ids: ReadonlySet<string>;
}

interface OwnershipChange {
  table_name: string;
  previous_record: Option<Record<string, unknown>>;
  next_record: Option<Record<string, unknown>>;
}

const OWNERSHIP_FIELDS_BY_TABLE: Readonly<Record<string, readonly string[]>> = {
  player_team_memberships: ["player_id", "team_id", "status"],
  system_users: [
    "role",
    "status",
    "organization_id",
    "team_id",
    "player_id",
    "official_id",
  ],
};
const EMPTY_VALUE = "";

const NO_REFRESH_TARGETS: OwnershipRefreshTargets = {
  team_ids: new Set(),
  player_ids: new Set(),
  official_ids: new Set(),
};

function list_records(
  command: OwnershipChange,
): Array<Record<string, unknown>> {
  const previous =
    command.previous_record.status === OptionStatus.SOME
      ? [command.previous_record.value]
      : [];
  if (command.next_record.status === OptionStatus.NONE) return previous;
  return [...previous, { ...previous[0], ...command.next_record.value }];
}

function has_ownership_change(
  records: Array<Record<string, unknown>>,
  field_names: readonly string[],
): boolean {
  if (records.length < 2) return true;
  const [previous, next] = records;
  return field_names.some(
    (field_name) =>
      read_string_or(previous[field_name], EMPTY_VALUE) !==
      read_string_or(next[field_name], EMPTY_VALUE),
  );
}

function collect_ids(
  records: Array<Record<string, unknown>>,
  field_name: string,
): ReadonlySet<string> {
  return new Set(
    records
      .map((record) => read_string_or(record[field_name], EMPTY_VALUE).trim())
      .filter((value) => value.length > 0),
  );
}

export function resolve_ownership_refresh_targets(
  command: OwnershipChange,
): OwnershipRefreshTargets {
  if (
    !Object.prototype.hasOwnProperty.call(
      OWNERSHIP_FIELDS_BY_TABLE,
      command.table_name,
    )
  )
    return NO_REFRESH_TARGETS;
  const records = list_records(command);
  if (
    !has_ownership_change(
      records,
      OWNERSHIP_FIELDS_BY_TABLE[command.table_name],
    )
  )
    return NO_REFRESH_TARGETS;
  return {
    team_ids:
      command.table_name === SYSTEM_USERS_TABLE_NAME
        ? collect_ids(records, "team_id")
        : new Set(),
    player_ids: collect_ids(records, "player_id"),
    official_ids: collect_ids(records, "official_id"),
  };
}

export function has_refresh_targets(targets: OwnershipRefreshTargets): boolean {
  return (
    targets.team_ids.size +
      targets.player_ids.size +
      targets.official_ids.size >
    0
  );
}
