import type { SharedEntityType } from "./shared_entity_types";

interface SharedRecordOwners {
  player_ids: ReadonlySet<string>;
}

export interface SharedTeamRecordOwners extends SharedRecordOwners {
  team_ids: ReadonlySet<string>;
}

interface SharedHolderOwnershipRule {
  entity_type: SharedEntityType;
  holder_type_field: string;
  holder_id_field: string;
  holder_type: string;
  owner_set: keyof SharedRecordOwners;
}

interface SharedTeamFieldOwnershipRule {
  entity_type: SharedEntityType;
  field_name: string;
}

const SHARED_OWNERSHIP_RULES: readonly SharedHolderOwnershipRule[] = [
  {
    entity_type: "identification",
    holder_type_field: "holder_type",
    holder_id_field: "holder_id",
    holder_type: "player",
    owner_set: "player_ids",
  },
];

const SHARED_TEAM_FIELD_OWNERSHIP_RULES: readonly SharedTeamFieldOwnershipRule[] =
  [{ entity_type: "playerteammembership", field_name: "team_id" }];

const ENTITY_TYPE_SEPARATOR_PATTERN = /[\s_-]/g;
const EMPTY_TEXT = "";
const STRING_TYPE_NAME = "string";
const TEAM_OWNER_SET_NAME = "team_ids";

function normalize_entity_type(entity_type: string): string {
  return entity_type
    .toLowerCase()
    .replace(ENTITY_TYPE_SEPARATOR_PATTERN, EMPTY_TEXT);
}

function read_trimmed_text(
  record: Readonly<Record<string, unknown>>,
  field_name: string,
): string {
  const value = record[field_name];
  return typeof value === STRING_TYPE_NAME ? String(value).trim() : EMPTY_TEXT;
}

function is_held_by_owner(
  rule: SharedHolderOwnershipRule,
  record: Readonly<Record<string, unknown>>,
  owners: SharedRecordOwners,
): boolean {
  const holder_id = read_trimmed_text(record, rule.holder_id_field);
  return (
    read_trimmed_text(record, rule.holder_type_field) === rule.holder_type &&
    holder_id.length > 0 &&
    owners[rule.owner_set].has(holder_id)
  );
}

function has_team_owners(
  owners: SharedRecordOwners,
): owners is SharedTeamRecordOwners {
  return TEAM_OWNER_SET_NAME in owners;
}

function is_owned_by_owner_team(
  normalized_entity_type: string,
  record: Readonly<Record<string, unknown>>,
  owners: SharedRecordOwners,
): boolean {
  if (!has_team_owners(owners)) return false;
  return SHARED_TEAM_FIELD_OWNERSHIP_RULES.some((rule) => {
    const team_id = read_trimmed_text(record, rule.field_name);
    return (
      rule.entity_type === normalized_entity_type &&
      team_id.length > 0 &&
      owners.team_ids.has(team_id)
    );
  });
}

export function is_record_owned_by_shared_owners(
  entity_type: string,
  record: Readonly<Record<string, unknown>>,
  owners: SharedRecordOwners,
): boolean {
  const normalized_entity_type = normalize_entity_type(entity_type);
  return (
    SHARED_OWNERSHIP_RULES.some(
      (rule) =>
        rule.entity_type === normalized_entity_type &&
        is_held_by_owner(rule, record, owners),
    ) || is_owned_by_owner_team(normalized_entity_type, record, owners)
  );
}
