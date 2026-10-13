import type {
  Competition,
  SquadGenerationStrategy,
} from "../entities/Competition";
import { SQUAD_GENERATION_STRATEGY } from "../entities/CompetitionTypes";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../types/Option";
import type { Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import type { CompetitionUseCases } from "../usecases/CompetitionUseCases";
import type { OrganizationUseCases } from "../usecases/OrganizationUseCases";
import type { SportUseCases } from "../usecases/SportUseCases";
import {
  DEFAULT_MAX_PLAYERS,
  DEFAULT_MIN_PLAYERS,
  FIXTURE_LINEUP_GENERATION_EVENT,
  FIXTURE_LINEUP_GENERATION_LOG_SCOPE,
  FIXTURE_LINEUP_GENERATION_MESSAGES,
  NUMBER_TYPE_NAME,
} from "./FixtureLineupGenerationConstants";

interface PlayerLimits {
  min_players: number;
  max_players: number;
}

export type PlayerRulesResult =
  | ({ success: true } & PlayerRules)
  | { success: false; error_message: string };

interface PlayerLimitOverrides {
  min_players: Option<number>;
  max_players: Option<number>;
}

function read_override_limit(value: unknown): Option<number> {
  return typeof value === NUMBER_TYPE_NAME
    ? create_some_option(Number(value))
    : create_none_option();
}

function option_value_or(option: Option<number>, fallback: number): number {
  return option.status === OptionStatus.SOME ? option.value : fallback;
}

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
  return create_success_result({
    min_players:
      sport_result.data.min_players_per_fixture || DEFAULT_MIN_PLAYERS,
    max_players:
      sport_result.data.max_players_per_fixture || DEFAULT_MAX_PLAYERS,
  });
}

async function resolve_player_limits(
  competition: Competition,
  overrides: PlayerLimitOverrides,
  organization_use_cases: OrganizationUseCases,
  sport_use_cases: SportUseCases,
): Promise<Result<PlayerLimits>> {
  const { min_players, max_players } = overrides;
  if (
    min_players.status === OptionStatus.SOME &&
    max_players.status === OptionStatus.SOME
  ) {
    return create_success_result({
      min_players: min_players.value,
      max_players: max_players.value,
    });
  }
  const sport_limits = await load_sport_player_limits(
    competition,
    organization_use_cases,
    sport_use_cases,
  );
  if (!sport_limits.success) return sport_limits;
  return create_success_result({
    min_players: option_value_or(min_players, sport_limits.data.min_players),
    max_players: option_value_or(max_players, sport_limits.data.max_players),
  });
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
    {
      min_players: read_override_limit(rule_overrides.min_players_on_field),
      max_players: read_override_limit(rule_overrides.max_players_on_field),
    },
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
