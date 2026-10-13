import type { CallerOwnership } from "./caller_ownership";
import { read_reference } from "./parent_reference_specs";

type OwnershipSetName = Exclude<keyof CallerOwnership, "role_kind">;

const OwnershipRuleKind = {
  FIELD: "field",
  HOLDER: "holder",
  ANY_SET: "any_set",
} as const;

type OwnershipRule =
  | {
      kind: typeof OwnershipRuleKind.FIELD;
      field_name: string;
      owner_set: OwnershipSetName;
    }
  | {
      kind: typeof OwnershipRuleKind.HOLDER;
      owner_sets_by_holder_type: Readonly<Record<string, OwnershipSetName>>;
    }
  | {
      kind: typeof OwnershipRuleKind.ANY_SET;
      field_name: string;
      owner_sets: OwnershipSetName[];
    };

function field_rule(
  field_name: string,
  owner_set: OwnershipSetName,
): OwnershipRule {
  return { kind: OwnershipRuleKind.FIELD, field_name, owner_set };
}

export type SelfScopedTable =
  | "teams"
  | "players"
  | "officials"
  | "team_staff"
  | "competition_teams"
  | "fixture_lineups"
  | "team_profiles"
  | "player_profiles"
  | "profile_links"
  | "identifications"
  | "qualifications"
  | "official_associated_teams"
  | "calendar_tokens";

const LOCAL_ID_FIELD = "local_id";
const HOLDER_TYPE_FIELD = "holder_type";
const HOLDER_ID_FIELD = "holder_id";

const HOLDER_OWNER_SETS: Readonly<Record<string, OwnershipSetName>> = {
  player: "player_ids",
  official: "official_ids",
  team_staff: "team_staff_ids",
};

const SELF_SCOPED_TABLE_RULES: Readonly<
  Record<SelfScopedTable, OwnershipRule>
> = {
  teams: field_rule(LOCAL_ID_FIELD, "team_ids"),
  players: field_rule(LOCAL_ID_FIELD, "player_ids"),
  officials: field_rule(LOCAL_ID_FIELD, "official_ids"),
  team_staff: field_rule("team_id", "team_ids"),
  competition_teams: field_rule("team_id", "team_ids"),
  fixture_lineups: field_rule("team_id", "team_ids"),
  team_profiles: field_rule("team_id", "team_ids"),
  player_profiles: field_rule("player_id", "player_ids"),
  profile_links: {
    kind: OwnershipRuleKind.ANY_SET,
    field_name: "profile_id",
    owner_sets: ["player_profile_ids", "team_profile_ids"],
  },
  identifications: {
    kind: OwnershipRuleKind.HOLDER,
    owner_sets_by_holder_type: HOLDER_OWNER_SETS,
  },
  qualifications: {
    kind: OwnershipRuleKind.HOLDER,
    owner_sets_by_holder_type: HOLDER_OWNER_SETS,
  },
  official_associated_teams: field_rule("official_id", "official_ids"),
  calendar_tokens: field_rule("user_id", "user_ids"),
};

export function is_self_scoped_table(
  table_name: string,
): table_name is SelfScopedTable {
  return Object.prototype.hasOwnProperty.call(
    SELF_SCOPED_TABLE_RULES,
    table_name,
  );
}

function is_owned_value(
  ownership: CallerOwnership,
  owner_set: OwnershipSetName,
  value: string,
): boolean {
  return value.length > 0 && ownership[owner_set].has(value);
}

function is_holder_owned(
  record: Record<string, unknown>,
  ownership: CallerOwnership,
  owner_sets_by_holder_type: Readonly<Record<string, OwnershipSetName>>,
): boolean {
  const holder_type = read_reference(record, HOLDER_TYPE_FIELD);
  if (
    !Object.prototype.hasOwnProperty.call(
      owner_sets_by_holder_type,
      holder_type,
    )
  )
    return false;
  return is_owned_value(
    ownership,
    owner_sets_by_holder_type[holder_type],
    read_reference(record, HOLDER_ID_FIELD),
  );
}

export function is_record_owned_by_caller(
  table_name: SelfScopedTable,
  record: Record<string, unknown>,
  ownership: CallerOwnership,
): boolean {
  const rule = SELF_SCOPED_TABLE_RULES[table_name];
  switch (rule.kind) {
    case OwnershipRuleKind.FIELD:
      return is_owned_value(
        ownership,
        rule.owner_set,
        read_reference(record, rule.field_name),
      );
    case OwnershipRuleKind.ANY_SET:
      return rule.owner_sets.some((owner_set) =>
        is_owned_value(
          ownership,
          owner_set,
          read_reference(record, rule.field_name),
        ),
      );
    case OwnershipRuleKind.HOLDER:
      return is_holder_owned(record, ownership, rule.owner_sets_by_holder_type);
  }
}
