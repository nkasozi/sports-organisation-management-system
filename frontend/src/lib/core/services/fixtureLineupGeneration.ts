import { SQUAD_GENERATION_STRATEGY } from "../entities/CompetitionTypes";
import type { Fixture } from "../entities/Fixture";
import type { Team } from "../entities/Team";
import type { ScalarValueInput } from "../types/DomainScalars";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import type { CompetitionUseCases } from "../usecases/CompetitionUseCases";
import type { FixtureLineupUseCases } from "../usecases/FixtureLineupUseCases";
import type { FixtureUseCases } from "../usecases/FixtureUseCases";
import type { OrganizationUseCases } from "../usecases/OrganizationUseCases";
import type { PlayerPositionUseCases } from "../usecases/PlayerPositionUseCases";
import type { PlayerTeamMembershipUseCases } from "../usecases/PlayerTeamMembershipUseCases";
import type { PlayerUseCases } from "../usecases/PlayerUseCases";
import type { SportUseCases } from "../usecases/SportUseCases";
import {
  create_lineup_generation_failure,
  type LineupGenerationContext,
  type LineupGenerationResult,
} from "./fixtureLineupCandidates";
import {
  FIXTURE_LINEUP_GENERATION_EVENT,
  FIXTURE_LINEUP_GENERATION_LOG_SCOPE,
  FIXTURE_LINEUP_GENERATION_MESSAGES,
} from "./FixtureLineupGenerationConstants";
import {
  generate_first_available_lineup,
  generate_previous_match_lineup,
} from "./fixtureLineupStrategies";
import { get_player_rules_from_competition } from "./fixturePlayerRules";
import { log_service_failure } from "./serviceFailure";

interface RuleSources {
  fixture_use_cases: FixtureUseCases;
  competition_use_cases: CompetitionUseCases;
  organization_use_cases: OrganizationUseCases;
  sport_use_cases: SportUseCases;
}

function fail_missing_fixture_id(
  team_id: ScalarValueInput<Fixture["home_team_id"]>,
): LineupGenerationResult {
  return create_lineup_generation_failure(
    log_service_failure({
      code: UseCaseErrorCode.MISSING_IDENTIFIER,
      event: FIXTURE_LINEUP_GENERATION_EVENT.MISSING_FIXTURE_ID,
      log_scope: FIXTURE_LINEUP_GENERATION_LOG_SCOPE,
      context: { team_id },
      user_message: FIXTURE_LINEUP_GENERATION_MESSAGES.MISSING_FIXTURE_ID,
    }),
  );
}

export async function auto_generate_lineups_if_possible(
  fixture: Fixture,
  team_id: ScalarValueInput<Fixture["home_team_id"]>,
  team_name: ScalarValueInput<Team["name"]>,
  membership_use_cases: PlayerTeamMembershipUseCases,
  player_use_cases: PlayerUseCases,
  player_position_use_cases: PlayerPositionUseCases,
  lineup_use_cases: FixtureLineupUseCases,
  fixture_use_cases: FixtureUseCases,
  competition_use_cases: CompetitionUseCases,
  organization_use_cases: OrganizationUseCases,
  sport_use_cases: SportUseCases,
): Promise<LineupGenerationResult> {
  if (!fixture.id) return fail_missing_fixture_id(team_id);
  console.debug(FIXTURE_LINEUP_GENERATION_LOG_SCOPE, {
    event: FIXTURE_LINEUP_GENERATION_EVENT.STARTED,
    fixture_id: fixture.id,
    team_id,
  });
  return generate_lineup_with_rules(
    {
      fixture,
      team_id,
      team_name,
      membership_use_cases,
      player_use_cases,
      player_position_use_cases,
      lineup_use_cases,
    },
    {
      fixture_use_cases,
      competition_use_cases,
      organization_use_cases,
      sport_use_cases,
    },
  );
}

async function generate_lineup_with_rules(
  context: LineupGenerationContext,
  rule_sources: RuleSources,
): Promise<LineupGenerationResult> {
  const rules = await get_player_rules_from_competition(
    context.fixture.competition_id,
    rule_sources.competition_use_cases,
    rule_sources.organization_use_cases,
    rule_sources.sport_use_cases,
  );
  if (!rules.success)
    return create_lineup_generation_failure(rules.error_message);
  console.debug(FIXTURE_LINEUP_GENERATION_LOG_SCOPE, {
    event: FIXTURE_LINEUP_GENERATION_EVENT.RULES_RESOLVED,
    fixture_id: context.fixture.id,
    team_id: context.team_id,
    min_players: rules.min_players,
    max_players: rules.max_players,
    squad_generation_strategy: rules.squad_generation_strategy,
  });
  switch (rules.squad_generation_strategy) {
    case SQUAD_GENERATION_STRATEGY.PREVIOUS_MATCH:
      return generate_previous_match_lineup(
        context,
        rule_sources.fixture_use_cases,
        rules,
      );
    case SQUAD_GENERATION_STRATEGY.FIRST_AVAILABLE:
      return generate_first_available_lineup(context, rules);
  }
}
