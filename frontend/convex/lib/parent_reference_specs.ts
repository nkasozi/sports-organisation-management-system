import { is_string } from "./value_guards";
export const ParentReferenceKind = {
  DIRECT: "direct",
  TYPED: "typed",
  CANDIDATES: "candidates",
} as const;

export type ParentScopedTable =
  | "competition_stages"
  | "player_profiles"
  | "team_profiles"
  | "profile_links"
  | "competition_teams"
  | "identifications"
  | "qualifications"
  | "official_associated_teams";

export type ParentTable =
  | "competitions"
  | "players"
  | "teams"
  | "officials"
  | "team_staff"
  | "player_profiles"
  | "team_profiles";

type ParentReferenceSpec =
  | {
      kind: typeof ParentReferenceKind.DIRECT;
      parent_id_field: string;
      parent_table: ParentTable;
    }
  | {
      kind: typeof ParentReferenceKind.TYPED;
      parent_type_field: string;
      parent_id_field: string;
      parent_tables_by_type: Readonly<Record<string, ParentTable>>;
    }
  | {
      kind: typeof ParentReferenceKind.CANDIDATES;
      parent_id_field: string;
      candidate_parent_tables: readonly ParentTable[];
    };

const EMPTY_REFERENCE = "";
const HOLDER_TYPE_FIELD = "holder_type";
const HOLDER_ID_FIELD = "holder_id";

export const PARENT_REFERENCE_SPECS: Record<
  ParentScopedTable,
  ParentReferenceSpec
> = {
  competition_stages: {
    kind: ParentReferenceKind.DIRECT,
    parent_id_field: "competition_id",
    parent_table: "competitions",
  },
  competition_teams: {
    kind: ParentReferenceKind.DIRECT,
    parent_id_field: "competition_id",
    parent_table: "competitions",
  },
  player_profiles: {
    kind: ParentReferenceKind.DIRECT,
    parent_id_field: "player_id",
    parent_table: "players",
  },
  team_profiles: {
    kind: ParentReferenceKind.DIRECT,
    parent_id_field: "team_id",
    parent_table: "teams",
  },
  official_associated_teams: {
    kind: ParentReferenceKind.DIRECT,
    parent_id_field: "official_id",
    parent_table: "officials",
  },
  profile_links: {
    kind: ParentReferenceKind.CANDIDATES,
    parent_id_field: "profile_id",
    candidate_parent_tables: ["player_profiles", "team_profiles"],
  },
  identifications: {
    kind: ParentReferenceKind.TYPED,
    parent_type_field: HOLDER_TYPE_FIELD,
    parent_id_field: HOLDER_ID_FIELD,
    parent_tables_by_type: {
      player: "players",
      team_staff: "team_staff",
      official: "officials",
    },
  },
  qualifications: {
    kind: ParentReferenceKind.TYPED,
    parent_type_field: HOLDER_TYPE_FIELD,
    parent_id_field: HOLDER_ID_FIELD,
    parent_tables_by_type: {
      team_staff: "team_staff",
      official: "officials",
    },
  },
};

export function is_parent_scoped_table(
  table_name: string,
): table_name is ParentScopedTable {
  return Object.prototype.hasOwnProperty.call(
    PARENT_REFERENCE_SPECS,
    table_name,
  );
}

export function read_reference(
  record: Record<string, unknown>,
  field_name: string,
): string {
  const value = record[field_name];
  return is_string(value) ? value.trim() : EMPTY_REFERENCE;
}
