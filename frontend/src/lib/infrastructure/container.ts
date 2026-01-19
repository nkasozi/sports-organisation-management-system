import type { OrganizationRepository } from "../core/interfaces/adapters/OrganizationRepository";
import type { CompetitionRepository } from "../core/interfaces/adapters/CompetitionRepository";
import type { TeamRepository } from "../core/interfaces/adapters/TeamRepository";
import type { PlayerRepository } from "../core/interfaces/adapters/PlayerRepository";
import type { OfficialRepository } from "../core/interfaces/adapters/OfficialRepository";
import type { FixtureRepository } from "../core/interfaces/adapters/FixtureRepository";

import { get_organization_repository } from "../adapters/repositories/InMemoryOrganizationRepository";
import { get_competition_repository } from "../adapters/repositories/InMemoryCompetitionRepository";
import { get_team_repository } from "../adapters/repositories/InMemoryTeamRepository";
import { get_player_repository } from "../adapters/repositories/InMemoryPlayerRepository";
import { get_official_repository } from "../adapters/repositories/InMemoryOfficialRepository";
import { get_fixture_repository } from "../adapters/repositories/InMemoryFixtureRepository";

import type { OrganizationUseCasesPort } from "../core/interfaces/ports/OrganizationUseCasesPort";
import type { CompetitionUseCasesPort } from "../core/interfaces/ports/CompetitionUseCasesPort";
import type { TeamUseCasesPort } from "../core/interfaces/ports/TeamUseCasesPort";
import type { PlayerUseCasesPort } from "../core/interfaces/ports/PlayerUseCasesPort";
import type { OfficialUseCasesPort } from "../core/interfaces/ports/OfficialUseCasesPort";
import type { FixtureUseCasesPort } from "../core/interfaces/ports/FixtureUseCasesPort";

import { create_organization_use_cases } from "../core/usecases/OrganizationUseCases";
import { create_competition_use_cases } from "../core/usecases/CompetitionUseCases";
import { create_team_use_cases } from "../core/usecases/TeamUseCases";
import { create_player_use_cases } from "../core/usecases/PlayerUseCases";
import { create_official_use_cases } from "../core/usecases/OfficialUseCases";
import { create_fixture_use_cases } from "../core/usecases/FixtureUseCases";

export interface RepositoryContainer {
  organization_repository: OrganizationRepository;
  competition_repository: CompetitionRepository;
  team_repository: TeamRepository;
  player_repository: PlayerRepository;
  official_repository: OfficialRepository;
  fixture_repository: FixtureRepository;
}

export interface UseCasesContainer {
  organization_use_cases: OrganizationUseCasesPort;
  competition_use_cases: CompetitionUseCasesPort;
  team_use_cases: TeamUseCasesPort;
  player_use_cases: PlayerUseCasesPort;
  official_use_cases: OfficialUseCasesPort;
  fixture_use_cases: FixtureUseCasesPort;
}

let repository_container_instance: RepositoryContainer | null = null;
let use_cases_container_instance: UseCasesContainer | null = null;

export function get_repository_container(): RepositoryContainer {
  if (!repository_container_instance) {
    repository_container_instance = create_in_memory_repository_container();
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

function create_in_memory_repository_container(): RepositoryContainer {
  return {
    organization_repository: get_organization_repository(),
    competition_repository: get_competition_repository(),
    team_repository: get_team_repository(),
    player_repository: get_player_repository(),
    official_repository: get_official_repository(),
    fixture_repository: get_fixture_repository(),
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
