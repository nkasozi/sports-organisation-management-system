import { DexieAppSettingsAdapter } from "../adapters/persistence/DexieAppSettingsAdapter";
import type {
  ActivityCategoryUseCasesPort,
  ActivityUseCasesPort,
  AppSettingsPort,
  CalendarTokenUseCasesPort,
  CompetitionStageUseCasesPort,
  CompetitionUseCasesPort,
  FixtureUseCasesPort,
  OfficialUseCasesPort,
  OrganizationSettingsUseCasesPort,
  OrganizationUseCasesPort,
  PlayerUseCasesPort,
  TeamUseCasesPort,
} from "../core/interfaces/ports";
import { create_activity_category_use_cases } from "../core/usecases/ActivityCategoryUseCases";
import { create_activity_use_cases } from "../core/usecases/ActivityUseCases";
import {
  type AuditLogUseCases,
  create_audit_log_use_cases,
} from "../core/usecases/AuditLogUseCases";
import { create_calendar_token_use_cases } from "../core/usecases/CalendarTokenUseCases";
import { create_competition_stage_lifecycle } from "../core/usecases/CompetitionStageLifecycle";
import { create_competition_stage_use_cases } from "../core/usecases/CompetitionStageUseCases";
import { create_competition_use_cases_with_stage_lifecycle } from "../core/usecases/CompetitionUseCases";
import { create_fixture_use_cases } from "../core/usecases/FixtureUseCases";
import { create_official_use_cases } from "../core/usecases/OfficialUseCases";
import { create_organization_settings_use_cases } from "../core/usecases/OrganizationSettingsUseCases";
import { create_organization_use_cases } from "../core/usecases/OrganizationUseCases";
import { create_player_use_cases } from "../core/usecases/PlayerUseCases";
import {
  create_system_user_use_cases,
  type SystemUserUseCases,
} from "../core/usecases/SystemUserUseCases";
import { create_team_use_cases } from "../core/usecases/TeamUseCases";
import {
  create_in_browser_repository_container,
  type RepositoryContainer,
} from "./RepositoryContainerFactory";

export interface UseCasesContainer {
  organization_use_cases: OrganizationUseCasesPort;
  competition_use_cases: CompetitionUseCasesPort;
  team_use_cases: TeamUseCasesPort;
  player_use_cases: PlayerUseCasesPort;
  official_use_cases: OfficialUseCasesPort;
  fixture_use_cases: FixtureUseCasesPort;
  activity_use_cases: ActivityUseCasesPort;
  activity_category_use_cases: ActivityCategoryUseCasesPort;
  calendar_token_use_cases: CalendarTokenUseCasesPort;
  system_user_use_cases: SystemUserUseCases;
  audit_log_use_cases: AuditLogUseCases;
  competition_stage_use_cases: CompetitionStageUseCasesPort;
  organization_settings_use_cases: OrganizationSettingsUseCasesPort;
}

let repository_container_instance: RepositoryContainer | null = null;
let use_cases_container_instance: UseCasesContainer | null = null;

export function get_repository_container(): RepositoryContainer {
  if (!repository_container_instance) {
    repository_container_instance = create_in_browser_repository_container();
  }
  return repository_container_instance;
}

export function get_use_cases_container(): UseCasesContainer {
  if (!use_cases_container_instance) {
    use_cases_container_instance = create_use_cases_container(
      get_repository_container(),
    );
  }
  return use_cases_container_instance;
}

function create_use_cases_container(
  repositories: RepositoryContainer,
): UseCasesContainer {
  return {
    organization_use_cases: create_organization_use_cases(
      repositories.organization_repository,
    ),
    competition_use_cases: create_competition_use_cases_with_stage_lifecycle(
      repositories.competition_repository,
      create_competition_stage_lifecycle(
        repositories.competition_format_repository,
        repositories.competition_stage_repository,
        repositories.fixture_repository,
      ),
    ),
    team_use_cases: create_team_use_cases(repositories.team_repository),
    player_use_cases: create_player_use_cases(repositories.player_repository),
    official_use_cases: create_official_use_cases(
      repositories.official_repository,
    ),
    fixture_use_cases: create_fixture_use_cases(
      repositories.fixture_repository,
    ),
    activity_use_cases: create_activity_use_cases({
      activity_repository: repositories.activity_repository,
      activity_category_repository: repositories.activity_category_repository,
      competition_repository: repositories.competition_repository,
      fixture_repository: repositories.fixture_repository,
      team_repository: repositories.team_repository,
    }),
    activity_category_use_cases: create_activity_category_use_cases(
      repositories.activity_category_repository,
    ),
    calendar_token_use_cases: create_calendar_token_use_cases({
      calendar_token_repository: repositories.calendar_token_repository,
      get_base_url: () =>
        typeof window !== "undefined" ? window.location.origin : "",
    }),
    system_user_use_cases: create_system_user_use_cases(
      repositories.system_user_repository,
    ),
    audit_log_use_cases: create_audit_log_use_cases(
      repositories.audit_log_repository,
    ),
    competition_stage_use_cases: create_competition_stage_use_cases(
      repositories.competition_stage_repository,
      repositories.fixture_repository,
    ),
    organization_settings_use_cases: create_organization_settings_use_cases(
      repositories.organization_settings_repository,
    ),
  };
}

function reset_container(): void {
  repository_container_instance = null;
  use_cases_container_instance = null;
}

function inject_test_repository_container(
  test_container: RepositoryContainer,
): void {
  repository_container_instance = test_container;
  use_cases_container_instance = null;
}

let app_settings_storage_instance: AppSettingsPort | null = null;

export function get_app_settings_storage(): AppSettingsPort {
  if (!app_settings_storage_instance) {
    app_settings_storage_instance = new DexieAppSettingsAdapter();
  }
  return app_settings_storage_instance;
}

function inject_test_use_cases_container(
  test_container: UseCasesContainer,
): void {
  use_cases_container_instance = test_container;
}
