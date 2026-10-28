import type { MutationCtx } from "../_generated/server";
import { OptionStatus } from "./option";
import { load_existing_sync_record } from "./sync_record_store";
import type { AllowedSyncTable } from "./sync_table_catalog";
import { is_string } from "./value_guards";

type AuditRecord = Record<string, unknown>;

const REFERENCE_TABLES: Readonly<Record<string, AllowedSyncTable>> = {
  organization_id: "organizations",
  competition_id: "competitions",
  competition_format_id: "competition_formats",
  stage_id: "competition_stages",
  team_id: "teams",
  home_team_id: "teams",
  away_team_id: "teams",
  from_team_id: "teams",
  to_team_id: "teams",
  player_id: "players",
  secondary_player_id: "players",
  official_id: "officials",
  fixture_id: "fixtures",
  sport_id: "sports",
  venue_id: "venues",
  home_venue_id: "venues",
  gender_id: "genders",
  position_id: "player_positions",
  home_team_jersey_id: "jersey_colors",
  away_team_jersey_id: "jersey_colors",
  official_jersey_id: "jersey_colors",
  identification_type_id: "identification_types",
};
const ENTITY_LABEL_FIELDS = ["name", "nickname", "title", "display_name"];
const FIXTURES_TABLE: AllowedSyncTable = "fixtures";
const TEAMS_TABLE: AllowedSyncTable = "teams";
const EMPTY = "";

function text(value: unknown): string {
  return is_string(value) ? value : EMPTY;
}

function label_of(record: AuditRecord): string {
  const full_name =
    `${text(record.first_name)} ${text(record.last_name)}`.trim();
  const label = ENTITY_LABEL_FIELDS.map((field) => text(record[field])).find(
    Boolean,
  );
  return full_name || label || EMPTY;
}

async function name_of(
  ctx: MutationCtx,
  table_name: AllowedSyncTable,
  local_id: string,
): Promise<string> {
  if (!local_id) return EMPTY;
  const found = await load_existing_sync_record(ctx, table_name, local_id);
  if (found.status === OptionStatus.NONE) return local_id;
  if (table_name === FIXTURES_TABLE) return describe_fixture(ctx, found.value);
  return label_of(found.value) || local_id;
}

async function describe_fixture(
  ctx: MutationCtx,
  record: AuditRecord,
): Promise<string> {
  const home = await name_of(ctx, TEAMS_TABLE, text(record.home_team_id));
  const away = await name_of(ctx, TEAMS_TABLE, text(record.away_team_id));
  return home && away ? `${home} vs ${away}` : text(record.local_id);
}

export async function with_reference_names(
  ctx: MutationCtx,
  record: AuditRecord,
): Promise<AuditRecord> {
  const named = { ...record };
  for (const [field, table_name] of Object.entries(REFERENCE_TABLES))
    if (text(record[field]))
      named[field] = await name_of(ctx, table_name, text(record[field]));
  return named;
}

type CompositeDescriber = (
  ctx: MutationCtx,
  record: AuditRecord,
) => Promise<string>;

const COMPOSITE_DISPLAY_NAMES: Readonly<Record<string, CompositeDescriber>> = {
  fixtures: describe_fixture,
  player_team_memberships: async (ctx, record) =>
    `${await name_of(ctx, "players", text(record.player_id))} at ${await name_of(ctx, TEAMS_TABLE, text(record.team_id))}`,
  fixture_lineups: async (ctx, record) =>
    `${await name_of(ctx, TEAMS_TABLE, text(record.team_id))} lineup for ${await name_of(ctx, FIXTURES_TABLE, text(record.fixture_id))}`,
  fixture_details_setups: async (ctx, record) =>
    `Setup for ${await name_of(ctx, FIXTURES_TABLE, text(record.fixture_id))}`,
  competition_teams: async (ctx, record) =>
    `${await name_of(ctx, TEAMS_TABLE, text(record.team_id))} in ${await name_of(ctx, "competitions", text(record.competition_id))}`,
};

export async function describe_audited_record(
  ctx: MutationCtx,
  table_name: AllowedSyncTable,
  record: AuditRecord,
): Promise<string> {
  const composite = COMPOSITE_DISPLAY_NAMES[table_name];
  if (composite) return composite(ctx, record);
  return label_of(record) || text(record.local_id);
}
