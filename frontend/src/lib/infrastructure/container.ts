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
  CONTAINER_STATE_STATUS,
  NON_BROWSER_BASE_URL,
} from "./containerConstants";
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

type ContainerState<T> =
  | { status: typeof CONTAINER_STATE_STATUS.UNINITIALIZED }
  | { status: typeof CONTAINER_STATE_STATUS.READY; value: T };

type CoreUseCases = Pick<
  UseCasesContainer,
  | "organization_use_cases"
  | "competition_use_cases"
  | "team_use_cases"
  | "player_use_cases"
  | "official_use_cases"
  | "fixture_use_cases"
  | "competition_stage_use_cases"
>;

type SupportingUseCases = Omit<UseCasesContainer, keyof CoreUseCases>;

let repository_container_state: ContainerState<RepositoryContainer> = {
  status: CONTAINER_STATE_STATUS.UNINITIALIZED,
};
let use_cases_container_state: ContainerState<UseCasesContainer> = {
  status: CONTAINER_STATE_STATUS.UNINITIALIZED,
};
let app_settings_storage_state: ContainerState<AppSettingsPort> = {
  status: CONTAINER_STATE_STATUS.UNINITIALIZED,
};

function resolve_container_state<T>(
  state: ContainerState<T>,
  create: () => T,
): { status: typeof CONTAINER_STATE_STATUS.READY; value: T } {
  switch (state.status) {
    case CONTAINER_STATE_STATUS.READY:
      return state;
    case CONTAINER_STATE_STATUS.UNINITIALIZED:
      return { status: CONTAINER_STATE_STATUS.READY, value: create() };
  }
}

export function get_repository_container(): RepositoryContainer {
  const ready_state = resolve_container_state(
    repository_container_state,
    create_in_browser_repository_container,
  );
  repository_container_state = ready_state;
  return ready_state.value;
}

export function get_use_cases_container(): UseCasesContainer {
  const ready_state = resolve_container_state(use_cases_container_state, () =>
    create_use_cases_container(get_repository_container()),
  );
  use_cases_container_state = ready_state;
  return ready_state.value;
}

export function get_app_settings_storage(): AppSettingsPort {
  const ready_state = resolve_container_state(
    app_settings_storage_state,
    () => new DexieAppSettingsAdapter(),
  );
  app_settings_storage_state = ready_state;
  return ready_state.value;
}

function get_browser_base_url(): string {
  return "window" in globalThis ? window.location.origin : NON_BROWSER_BASE_URL;
}

function create_core_use_cases(
  repositories: RepositoryContainer,
): CoreUseCases {
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
    competition_stage_use_cases: create_competition_stage_use_cases(
      repositories.competition_stage_repository,
      repositories.fixture_repository,
    ),
  };
}

function create_supporting_use_cases(
  repositories: RepositoryContainer,
): SupportingUseCases {
  return {
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
      get_base_url: get_browser_base_url,
    }),
    system_user_use_cases: create_system_user_use_cases(
      repositories.system_user_repository,
    ),
    audit_log_use_cases: create_audit_log_use_cases(
      repositories.audit_log_repository,
    ),
    organization_settings_use_cases: create_organization_settings_use_cases(
      repositories.organization_settings_repository,
    ),
  };
}

function create_use_cases_container(
  repositories: RepositoryContainer,
): UseCasesContainer {
  return {
    ...create_core_use_cases(repositories),
    ...create_supporting_use_cases(repositories),
  };
}
