import type { OrganizationRepository } from "../core/interfaces/adapters/OrganizationRepository";
import type { CompetitionRepository } from "../core/interfaces/adapters/CompetitionRepository";
import type { TeamRepository } from "../core/interfaces/adapters/TeamRepository";
import type { PlayerRepository } from "../core/interfaces/adapters/PlayerRepository";
import type { OfficialRepository } from "../core/interfaces/adapters/OfficialRepository";
import type { FixtureRepository } from "../core/interfaces/adapters/FixtureRepository";
import type { ActivityRepository } from "../core/interfaces/adapters/ActivityRepository";
import type { ActivityCategoryRepository } from "../core/interfaces/adapters/ActivityCategoryRepository";
import type { CalendarTokenRepository } from "../core/interfaces/adapters/CalendarTokenRepository";

import {
  get_organization_repository,
  type InBrowserOrganizationRepository,
} from "../adapters/repositories/InBrowserOrganizationRepository";
import { get_competition_repository } from "../adapters/repositories/InBrowserCompetitionRepository";
import { get_team_repository } from "../adapters/repositories/InBrowserTeamRepository";
import { get_player_repository } from "../adapters/repositories/InBrowserPlayerRepository";
import { get_official_repository } from "../adapters/repositories/InBrowserOfficialRepository";
import { get_fixture_repository } from "../adapters/repositories/InBrowserFixtureRepository";
import { get_activity_repository } from "../adapters/repositories/InBrowserActivityRepository";
import { get_activity_category_repository } from "../adapters/repositories/InBrowserActivityCategoryRepository";
import {
  get_system_user_repository,
  type InBrowserSystemUserRepository,
} from "../adapters/repositories/InBrowserSystemUserRepository";
import {
  get_audit_log_repository,
  type InBrowserAuditLogRepository,
} from "../adapters/repositories/InBrowserAuditLogRepository";
import { get_calendar_token_repository } from "../adapters/repositories/InBrowserCalendarTokenRepository";

import type { OrganizationUseCasesPort } from "../core/interfaces/ports/OrganizationUseCasesPort";
import type { CompetitionUseCasesPort } from "../core/interfaces/ports/CompetitionUseCasesPort";
import type { TeamUseCasesPort } from "../core/interfaces/ports/TeamUseCasesPort";
import type { PlayerUseCasesPort } from "../core/interfaces/ports/PlayerUseCasesPort";
import type { OfficialUseCasesPort } from "../core/interfaces/ports/OfficialUseCasesPort";
import type { FixtureUseCasesPort } from "../core/interfaces/ports/FixtureUseCasesPort";
import type { ActivityUseCasesPort } from "../core/interfaces/ports/ActivityUseCasesPort";
import type { ActivityCategoryUseCasesPort } from "../core/interfaces/ports/ActivityCategoryUseCasesPort";
import type { CalendarTokenUseCasesPort } from "../core/interfaces/ports/CalendarTokenUseCasesPort";

import { create_organization_use_cases } from "../core/usecases/OrganizationUseCases";
import { create_competition_use_cases } from "../core/usecases/CompetitionUseCases";
import { create_team_use_cases } from "../core/usecases/TeamUseCases";
import { create_player_use_cases } from "../core/usecases/PlayerUseCases";
import { create_official_use_cases } from "../core/usecases/OfficialUseCases";
import { create_fixture_use_cases } from "../core/usecases/FixtureUseCases";
import { create_activity_use_cases } from "../core/usecases/ActivityUseCases";
import { create_activity_category_use_cases } from "../core/usecases/ActivityCategoryUseCases";
import { create_calendar_token_use_cases } from "../core/usecases/CalendarTokenUseCases";
import {
  create_system_user_use_cases,
  type SystemUserUseCases,
} from "../core/usecases/SystemUserUseCases";
import {
  create_audit_log_use_cases,
  type AuditLogUseCases,
} from "../core/usecases/AuditLogUseCases";

export interface RepositoryContainer {
  organization_repository: OrganizationRepository;
  competition_repository: CompetitionRepository;
  team_repository: TeamRepository;
  player_repository: PlayerRepository;
  official_repository: OfficialRepository;
  fixture_repository: FixtureRepository;
  activity_repository: ActivityRepository;
  activity_category_repository: ActivityCategoryRepository;
  calendar_token_repository: CalendarTokenRepository;
  system_user_repository: InBrowserSystemUserRepository;
  audit_log_repository: InBrowserAuditLogRepository;
}

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

function create_in_browser_repository_container(): RepositoryContainer {
  return {
    organization_repository: get_organization_repository(),
    competition_repository: get_competition_repository(),
    team_repository: get_team_repository(),
    player_repository: get_player_repository(),
    official_repository: get_official_repository(),
    fixture_repository: get_fixture_repository(),
    activity_repository: get_activity_repository(),
    activity_category_repository: get_activity_category_repository(),
    calendar_token_repository: get_calendar_token_repository(),
    system_user_repository: get_system_user_repository(),
    audit_log_repository: get_audit_log_repository(),
  };
}

function create_use_cases_container(
  repositories: RepositoryContainer,
): UseCasesContainer {
  return {
    organization_use_cases: create_organization_use_cases(
      repositories.organization_repository,
    ),
    competition_use_cases: create_competition_use_cases(
      repositories.competition_repository,
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
  };
}

export function reset_container(): void {
  repository_container_instance = null;
  use_cases_container_instance = null;
}

export function inject_test_repository_container(
  test_container: RepositoryContainer,
): void {
  repository_container_instance = test_container;
  use_cases_container_instance = null;
}

export function inject_test_use_cases_container(
  test_container: UseCasesContainer,
): void {
  use_cases_container_instance = test_container;
}
