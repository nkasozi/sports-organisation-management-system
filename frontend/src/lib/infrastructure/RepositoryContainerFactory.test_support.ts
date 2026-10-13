import { vi } from "vitest";

const REPOSITORY_MODULE_DIRECTORY = "../adapters/repositories";
const IN_BROWSER_MODULE_PREFIX = "InBrowser";
const GETTER_PREFIX = "get_";
const TRANSFER_HISTORY_MODULE_NAME =
  "InBrowserPlayerTeamTransferHistoryRepository";

const GETTER_BACKED_REPOSITORY_KEYS = [
  "activity_category_repository",
  "activity_repository",
  "audit_log_repository",
  "calendar_token_repository",
  "competition_format_repository",
  "competition_repository",
  "competition_stage_repository",
  "competition_team_repository",
  "fixture_details_setup_repository",
  "fixture_lineup_repository",
  "fixture_repository",
  "game_event_log_repository",
  "game_event_type_repository",
  "game_official_role_repository",
  "gender_repository",
  "identification_repository",
  "identification_type_repository",
  "jersey_color_repository",
  "live_game_log_repository",
  "official_associated_team_repository",
  "official_performance_rating_repository",
  "official_repository",
  "organization_repository",
  "organization_settings_repository",
  "player_position_repository",
  "player_profile_repository",
  "player_repository",
  "player_team_membership_repository",
  "profile_link_repository",
  "qualification_repository",
  "sport_repository",
  "system_user_repository",
  "team_profile_repository",
  "team_repository",
  "team_staff_repository",
  "team_staff_role_repository",
  "venue_repository",
] as const;

type GetterBackedRepositoryKey = (typeof GETTER_BACKED_REPOSITORY_KEYS)[number];

type RepositorySentinel = { name: string };

function build_getter_backed_sentinels(): Record<
  GetterBackedRepositoryKey,
  RepositorySentinel
> {
  return Object.fromEntries(
    GETTER_BACKED_REPOSITORY_KEYS.map((key) => [key, { name: key }]),
  ) as Record<GetterBackedRepositoryKey, RepositorySentinel>;
}

const player_team_transfer_history_repository: RepositorySentinel = {
  name: "player_team_transfer_history_repository",
};

export const sentinels = {
  ...build_getter_backed_sentinels(),
  player_team_transfer_history_repository,
  player_team_transfer_history_repository_constructor: vi.fn(
    function MockPlayerTeamTransferHistoryRepository() {
      return player_team_transfer_history_repository;
    },
  ),
};

function to_repository_module_name(key: GetterBackedRepositoryKey): string {
  const pascal_case_key = key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  return `${IN_BROWSER_MODULE_PREFIX}${pascal_case_key}`;
}

function register_getter_backed_module_mock(
  key: GetterBackedRepositoryKey,
): boolean {
  vi.doMock(
    `${REPOSITORY_MODULE_DIRECTORY}/${to_repository_module_name(key)}`,
    () => ({
      [`${GETTER_PREFIX}${key}`]: vi.fn(() => sentinels[key]),
    }),
  );
  return true;
}

export function register_repository_module_mocks(): boolean {
  GETTER_BACKED_REPOSITORY_KEYS.forEach(register_getter_backed_module_mock);
  vi.doMock(
    `${REPOSITORY_MODULE_DIRECTORY}/${TRANSFER_HISTORY_MODULE_NAME}`,
    () => ({
      InBrowserPlayerTeamTransferHistoryRepository:
        sentinels.player_team_transfer_history_repository_constructor,
    }),
  );
  return true;
}
