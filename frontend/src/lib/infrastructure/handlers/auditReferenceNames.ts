import { get_repository_container } from "../container";
import type { RepositoryContainer } from "../RepositoryContainerFactory";

type AuditRecord = Record<string, unknown>;
type RepositoryKey = {
  [Key in keyof RepositoryContainer]: RepositoryContainer[Key] extends {
    find_by_id: unknown;
  }
    ? Key
    : never;
}[keyof RepositoryContainer];

const REFERENCE_REPOSITORIES: Readonly<Record<string, RepositoryKey>> = {
  organization_id: "organization_repository",
  competition_id: "competition_repository",
  competition_format_id: "competition_format_repository",
  stage_id: "competition_stage_repository",
  team_id: "team_repository",
  home_team_id: "team_repository",
  away_team_id: "team_repository",
  from_team_id: "team_repository",
  to_team_id: "team_repository",
  player_id: "player_repository",
  secondary_player_id: "player_repository",
  official_id: "official_repository",
  fixture_id: "fixture_repository",
  sport_id: "sport_repository",
  venue_id: "venue_repository",
  home_venue_id: "venue_repository",
  gender_id: "gender_repository",
  position_id: "player_position_repository",
  home_team_jersey_id: "jersey_color_repository",
  away_team_jersey_id: "jersey_color_repository",
  official_jersey_id: "jersey_color_repository",
  identification_type_id: "identification_type_repository",
};
const ENTITY_LABEL_FIELDS = ["name", "nickname", "title", "display_name"];
const EMPTY = "";
const FIXTURE_REPOSITORY_KEY: RepositoryKey = "fixture_repository";

function text(value: unknown): string {
  return typeof value === typeof EMPTY ? (value as string) : EMPTY;
}

async function find_record(
  repository_key: RepositoryKey,
  id: string,
): Promise<AuditRecord | false> {
  const repository = get_repository_container()[repository_key] as {
    find_by_id: (id: string) => Promise<{ success: boolean; data?: unknown }>;
  };
  const result = await repository.find_by_id(id);
  return result.success ? (result.data as AuditRecord) : false;
}

async function name_of(
  repository_key: RepositoryKey,
  id: string,
): Promise<string> {
  if (!id) return EMPTY;
  const record = await find_record(repository_key, id);
  if (!record) return id;
  if (repository_key === FIXTURE_REPOSITORY_KEY)
    return describe_fixture(record);
  return label_of(record) || id;
}

function label_of(record: AuditRecord): string {
  const full_name =
    `${text(record.first_name)} ${text(record.last_name)}`.trim();
  const label = ENTITY_LABEL_FIELDS.map((field) => text(record[field])).find(
    Boolean,
  );
  return full_name || label || EMPTY;
}

async function describe_fixture(record: AuditRecord): Promise<string> {
  const home = await name_of("team_repository", text(record.home_team_id));
  const away = await name_of("team_repository", text(record.away_team_id));
  return home && away ? `${home} vs ${away}` : text(record.id);
}

export async function with_reference_names(
  record: AuditRecord,
): Promise<AuditRecord> {
  const named = { ...record };
  for (const [field, repository_key] of Object.entries(REFERENCE_REPOSITORIES))
    if (text(record[field]))
      named[field] = await name_of(repository_key, text(record[field]));
  return named;
}

const COMPOSITE_DISPLAY_NAMES: Readonly<
  Record<string, (record: AuditRecord) => Promise<string>>
> = {
  fixture: describe_fixture,
  playerteammembership: async (record) =>
    `${await name_of("player_repository", text(record.player_id))} at ${await name_of("team_repository", text(record.team_id))}`,
  fixturelineup: async (record) =>
    `${await name_of("team_repository", text(record.team_id))} lineup for ${await name_of("fixture_repository", text(record.fixture_id))}`,
  fixturedetailssetup: async (record) =>
    `Setup for ${await name_of("fixture_repository", text(record.fixture_id))}`,
  competitionteam: async (record) =>
    `${await name_of("team_repository", text(record.team_id))} in ${await name_of("competition_repository", text(record.competition_id))}`,
};

export async function describe_audited_entity(
  entity_type: string,
  record: AuditRecord,
): Promise<string> {
  const composite = COMPOSITE_DISPLAY_NAMES[entity_type];
  if (composite) return composite(record);
  return label_of(record) || text(record.id);
}
