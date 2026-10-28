import type { CreateGameOfficialRoleInput } from "./GameOfficialRole";
import { ENTITY_STATUS } from "./StatusConstants";

export const TABLE_OFFICIAL_ROLE_CODES: ReadonlySet<string> = new Set([
  "TO",
  "TECHNICAL_OFFICER",
  "TABLE_OFFICIAL",
  "SCORER",
  "SCOREKEEPER",
  "SCORE_KEEPER",
  "TIMEKEEPER",
  "TIME_KEEPER",
  "SHOT_CLOCK_OPERATOR",
  "STATISTICIAN",
  "RECORDER",
]);

const FLAG_TYPE = "boolean";

interface TableOfficialCandidate {
  code: string;
  is_table_official?: boolean;
}

export function is_table_official_role(role: TableOfficialCandidate): boolean {
  if (typeof role.is_table_official === FLAG_TYPE)
    return role.is_table_official === true;
  return TABLE_OFFICIAL_ROLE_CODES.has(role.code.trim().toUpperCase());
}

export function find_table_official_role_ids(
  roles: ReadonlyArray<TableOfficialCandidate & { id: string }>,
): Set<string> {
  return new Set(
    roles.filter(is_table_official_role).map((role) => String(role.id)),
  );
}

export function build_table_official_role_input(
  organization_id: CreateGameOfficialRoleInput["organization_id"],
  sport_id: CreateGameOfficialRoleInput["sport_id"],
  display_order: number,
): CreateGameOfficialRoleInput {
  return {
    name: "Table Official",
    code: "TABLE_OFFICIAL",
    description:
      "Runs the live game from the table: starts and stops the clock and records goals, cards and substitutions",
    sport_id,
    is_on_field: false,
    is_head_official: false,
    is_table_official: true,
    display_order,
    status: ENTITY_STATUS.ACTIVE,
    organization_id,
  };
}
