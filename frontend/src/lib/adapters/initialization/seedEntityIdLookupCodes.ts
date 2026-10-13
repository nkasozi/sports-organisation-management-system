import { INITIALIZATION_EVENT } from "./initializationEvents";
import type { SeedEntityIdLookups } from "./seedingTypes";

export interface CodedRecord {
  id: string;
  code: string;
}

export interface SeedLookupRecords {
  positions: CodedRecord[];
  staff_roles: CodedRecord[];
  official_roles: CodedRecord[];
  formats: CodedRecord[];
}

const UNRESOLVED_LOOKUP_ID = "";

const POSITION_CODES = {
  gk: "GK",
  sw: "SW",
  cb: "CB",
  lb: "LB",
  rb: "RB",
  cdm: "CDM",
  cm: "CM",
  lm: "LM",
  rm: "RM",
  lw: "LW",
  rw: "RW",
  cf: "CF",
} as const;

const STAFF_ROLE_CODES = {
  head_coach_role_id: "HC",
  assistant_coach_role_id: "AC",
  physio_role_id: "PHYSIO",
  team_manager_role_id: "TM",
} as const;

const OFFICIAL_ROLE_CODES = {
  referee_role_id: "REF",
  assistant_referee_role_id: "AR",
} as const;

const COMPETITION_FORMAT_CODES = {
  easter_cup_format_id: "world_cup_style",
  uganda_cup_format_id: "cup_tournament",
  nhl_format_id: "standard_league",
  university_format_id: "single_round_robin",
} as const;

function resolve_codes<TKey extends string>(
  lookup_name: string,
  codes: Record<TKey, string>,
  records: CodedRecord[],
): Record<TKey, string> {
  const entries = Object.entries<string>(codes).map(([key, code]) => [
    key,
    records.find((record) => record.code === code)?.id ?? UNRESOLVED_LOOKUP_ID,
  ]);
  const missing_codes = entries
    .filter(([, id]) => id === UNRESOLVED_LOOKUP_ID)
    .map(([key]) => key);
  if (missing_codes.length > 0) {
    console.warn("[Seeding] Seed lookup codes not found; ids left empty", {
      event: INITIALIZATION_EVENT.SEED_LOOKUP_CODES_MISSING,
      lookup_name,
      missing_codes,
    });
  }
  return Object.fromEntries(entries) as Record<TKey, string>;
}

export function build_seed_entity_id_lookups(
  records: SeedLookupRecords,
): SeedEntityIdLookups {
  return {
    position_ids: resolve_codes(
      "player_positions",
      POSITION_CODES,
      records.positions,
    ),
    ...resolve_codes("team_staff_roles", STAFF_ROLE_CODES, records.staff_roles),
    ...resolve_codes(
      "game_official_roles",
      OFFICIAL_ROLE_CODES,
      records.official_roles,
    ),
    competition_format_ids: resolve_codes(
      "competition_formats",
      COMPETITION_FORMAT_CODES,
      records.formats,
    ),
  };
}
