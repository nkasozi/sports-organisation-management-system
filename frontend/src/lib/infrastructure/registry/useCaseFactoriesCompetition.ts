import type { AuditLogUseCases } from "../../core/usecases/AuditLogUseCases";
import { create_audit_log_use_cases } from "../../core/usecases/AuditLogUseCases";
import type { CompetitionFormatUseCases } from "../../core/usecases/CompetitionFormatUseCases";
import { create_competition_format_use_cases } from "../../core/usecases/CompetitionFormatUseCases";
import { create_competition_stage_lifecycle } from "../../core/usecases/CompetitionStageLifecycle";
import type { CompetitionStageUseCases } from "../../core/usecases/CompetitionStageUseCases";
import { create_competition_stage_use_cases } from "../../core/usecases/CompetitionStageUseCases";
import type { CompetitionTeamUseCases } from "../../core/usecases/CompetitionTeamUseCases";
import { create_competition_team_use_cases } from "../../core/usecases/CompetitionTeamUseCases";
import type { CompetitionUseCases } from "../../core/usecases/CompetitionUseCases";
import { create_competition_use_cases_with_stage_lifecycle } from "../../core/usecases/CompetitionUseCases";
import type { FixtureDetailsSetupUseCases } from "../../core/usecases/FixtureDetailsSetupUseCases";
import { create_fixture_details_setup_use_cases } from "../../core/usecases/FixtureDetailsSetupUseCases";
import type { FixtureLineupUseCases } from "../../core/usecases/FixtureLineupUseCases";
import { create_fixture_lineup_use_cases } from "../../core/usecases/FixtureLineupUseCases";
import type { FixtureUseCases } from "../../core/usecases/FixtureUseCases";
import { create_fixture_use_cases } from "../../core/usecases/FixtureUseCases";
import { get_repository_container } from "../container";

export function get_audit_log_use_cases(): AuditLogUseCases {
  return create_audit_log_use_cases(
    get_repository_container().audit_log_repository,
  );
}

export function get_competition_format_use_cases(): CompetitionFormatUseCases {
  return create_competition_format_use_cases(
    get_repository_container().competition_format_repository,
  );
}

export function get_competition_stage_use_cases(): CompetitionStageUseCases {
  const container = get_repository_container();
  return create_competition_stage_use_cases(
    container.competition_stage_repository,
    container.fixture_repository,
  );
}

export function get_competition_team_use_cases(): CompetitionTeamUseCases {
  return create_competition_team_use_cases(
    get_repository_container().competition_team_repository,
  );
}

export function get_competition_use_cases(): CompetitionUseCases {
  const container = get_repository_container();
  const stage_lifecycle = create_competition_stage_lifecycle(
    container.competition_format_repository,
    container.competition_stage_repository,
    container.fixture_repository,
  );
  return create_competition_use_cases_with_stage_lifecycle(
    container.competition_repository,
    stage_lifecycle,
  );
}

export function get_fixture_details_setup_use_cases(): FixtureDetailsSetupUseCases {
  return create_fixture_details_setup_use_cases(
    get_repository_container().fixture_details_setup_repository,
  );
}

export function get_fixture_lineup_use_cases(): FixtureLineupUseCases {
  return create_fixture_lineup_use_cases(
    get_repository_container().fixture_lineup_repository,
  );
}

export function get_fixture_use_cases(): FixtureUseCases {
  const container = get_repository_container();
  return create_fixture_use_cases(
    container.fixture_repository,
    container.team_repository,
  );
}
