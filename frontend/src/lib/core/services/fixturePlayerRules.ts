import type {
  Competition,
  SquadGenerationStrategy,
} from "../entities/Competition";
import {
  type CompetitionRuleOverrides,
  SQUAD_GENERATION_STRATEGY,
} from "../entities/CompetitionTypes";
import type { Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import type { CompetitionUseCases } from "../usecases/CompetitionUseCases";
import type { OrganizationUseCases } from "../usecases/OrganizationUseCases";
import type { SportUseCases } from "../usecases/SportUseCases";
import {
  FIXTURE_LINEUP_GENERATION_EVENT,
  FIXTURE_LINEUP_GENERATION_LOG_SCOPE,
  FIXTURE_LINEUP_GENERATION_MESSAGES,
} from "./FixtureLineupGenerationConstants";
import {
  apply_competition_fixture_player_limit_overrides,
  build_sport_fixture_player_limits,
  DEFAULT_FIXTURE_PLAYER_LIMITS,
  type FixturePlayerLimits,
  has_complete_player_limit_overrides,
} from "./fixturePlayerLimits";

type PlayerLimits = FixturePlayerLimits;

export type PlayerRulesResult =
  | ({ success: true } & PlayerRules)
  | { success: false; error_message: string };

function fail_rules_lookup(
  user_message: string,
  context: Record<string, unknown>,
  technical_detail: string,
): Result<never, string> {
  return fail_use_case({
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    event: FIXTURE_LINEUP_GENERATION_EVENT.RULES_LOAD_FAILED,
    log_scope: FIXTURE_LINEUP_GENERATION_LOG_SCOPE,
    context,
    user_message,
    technical_detail,
  });
}

async function load_sport_player_limits(
  competition: Competition,
  organization_use_cases: OrganizationUseCases,
  sport_use_cases: SportUseCases,
): Promise<Result<PlayerLimits>> {
  const context = {
    competition_id: competition.id,
    organization_id: competition.organization_id,
  };
  const org_result = await organization_use_cases.get_by_id(
    competition.organization_id,
  );
  if (!org_result.success) {
    return fail_rules_lookup(
      FIXTURE_LINEUP_GENERATION_MESSAGES.ORGANIZATION_LOAD_FAILED,
      context,
      org_result.error,
    );
  }
  const sport_result = await sport_use_cases.get_by_id(
    org_result.data.sport_id,
  );
  if (!sport_result.success) {
    return fail_rules_lookup(
      FIXTURE_LINEUP_GENERATION_MESSAGES.SPORT_LOAD_FAILED,
      { ...context, sport_id: org_result.data.sport_id },
      sport_result.error,
    );
  }
  return create_success_result(
    build_sport_fixture_player_limits(sport_result.data),
  );
}

async function resolve_player_limits(
  competition: Competition,
  rule_overrides: CompetitionRuleOverrides,
  organization_use_cases: OrganizationUseCases,
  sport_use_cases: SportUseCases,
): Promise<Result<PlayerLimits>> {
  if (has_complete_player_limit_overrides(rule_overrides))
    return create_success_result(
      apply_competition_fixture_player_limit_overrides(
        DEFAULT_FIXTURE_PLAYER_LIMITS,
        rule_overrides,
      ),
    );
  const sport_limits = await load_sport_player_limits(
    competition,
    organization_use_cases,
    sport_use_cases,
  );
  if (!sport_limits.success) return sport_limits;
  return create_success_result(
    apply_competition_fixture_player_limit_overrides(
      sport_limits.data,
      rule_overrides,
    ),
  );
}

interface PlayerRules extends PlayerLimits {
  squad_generation_strategy: SquadGenerationStrategy;
}

async function load_player_rules(
  competition_id: Competition["id"],
  competition_use_cases: CompetitionUseCases,
  organization_use_cases: OrganizationUseCases,
  sport_use_cases: SportUseCases,
): Promise<Result<PlayerRules>> {
  const competition_result =
    await competition_use_cases.get_by_id(competition_id);
  if (!competition_result.success) {
    return fail_rules_lookup(
      FIXTURE_LINEUP_GENERATION_MESSAGES.COMPETITION_LOAD_FAILED,
      { competition_id },
      competition_result.error,
    );
  }
  const competition = competition_result.data;
  const rule_overrides = competition.rule_overrides ?? {};
  const limits_result = await resolve_player_limits(
    competition,
    rule_overrides,
    organization_use_cases,
    sport_use_cases,
  );
  if (!limits_result.success) return limits_result;
  return create_success_result({
    ...limits_result.data,
    squad_generation_strategy:
      competition.squad_generation_strategy ||
      SQUAD_GENERATION_STRATEGY.FIRST_AVAILABLE,
  });
}

export async function get_player_rules_from_competition(
  competition_id: Competition["id"],
  competition_use_cases: CompetitionUseCases,
  organization_use_cases: OrganizationUseCases,
  sport_use_cases: SportUseCases,
): Promise<PlayerRulesResult> {
  const rules_result = await load_player_rules(
    competition_id,
    competition_use_cases,
    organization_use_cases,
    sport_use_cases,
  );
  if (!rules_result.success) {
    return { success: false, error_message: rules_result.error };
  }
  return { success: true, ...rules_result.data };
}
