import type { SquadGenerationStrategy } from "../entities/Competition";
import { OptionStatus } from "../types/Option";
import type { FixtureUseCases } from "../usecases/FixtureUseCases";
import {
  build_auto_generated_lineup,
  create_lineup_generation_failure,
  type LineupGenerationContext,
  type LineupGenerationResult,
  load_active_memberships,
  load_sorted_lineup_players,
  save_generated_lineup,
} from "./fixtureLineupCandidates";
import {
  FIXTURE_LINEUP_GENERATION_EVENT,
  FIXTURE_LINEUP_GENERATION_LOG_SCOPE,
  FIXTURE_LINEUP_GENERATION_MESSAGES,
} from "./FixtureLineupGenerationConstants";
import { find_previous_lineup_for_team } from "./fixtureLineupLookup";

interface LineupRules {
  min_players: number;
  max_players: number;
  starters_count: number;
  squad_generation_strategy: SquadGenerationStrategy;
}

const PREVIOUS_MATCH_STRATEGY_STATUS = {
  UNAVAILABLE: "unavailable",
  COMPLETED: "completed",
} as const;

type PreviousMatchStrategyResult =
  | { status: typeof PREVIOUS_MATCH_STRATEGY_STATUS.UNAVAILABLE }
  | {
      status: typeof PREVIOUS_MATCH_STRATEGY_STATUS.COMPLETED;
      result: LineupGenerationResult;
    };

export async function generate_previous_match_lineup(
  context: LineupGenerationContext,
  fixture_use_cases: FixtureUseCases,
  rules: LineupRules,
): Promise<LineupGenerationResult> {
  const previous_result = await try_previous_match_strategy(
    context,
    fixture_use_cases,
  );
  switch (previous_result.status) {
    case PREVIOUS_MATCH_STRATEGY_STATUS.COMPLETED:
      return previous_result.result;
    case PREVIOUS_MATCH_STRATEGY_STATUS.UNAVAILABLE:
      return generate_first_available_lineup(context, rules);
  }
}

async function try_previous_match_strategy(
  context: LineupGenerationContext,
  fixture_use_cases: FixtureUseCases,
): Promise<PreviousMatchStrategyResult> {
  const previous_lineup_result = await find_previous_lineup_for_team(
    context.fixture,
    context.team_id,
    fixture_use_cases,
    context.lineup_use_cases,
  );
  if (!previous_lineup_result.success) {
    return {
      status: PREVIOUS_MATCH_STRATEGY_STATUS.COMPLETED,
      result: create_lineup_generation_failure(previous_lineup_result.error),
    };
  }
  if (previous_lineup_result.data.status === OptionStatus.NONE) {
    return { status: PREVIOUS_MATCH_STRATEGY_STATUS.UNAVAILABLE };
  }
  const previous_players = previous_lineup_result.data.value.selected_players;
  console.debug(FIXTURE_LINEUP_GENERATION_LOG_SCOPE, {
    event: FIXTURE_LINEUP_GENERATION_EVENT.PREVIOUS_LINEUP_FOUND,
    fixture_id: context.fixture.id,
    team_id: context.team_id,
    player_count: previous_players.length,
  });
  const result = await save_generated_lineup(
    context,
    build_auto_generated_lineup(
      context,
      previous_players,
      FIXTURE_LINEUP_GENERATION_MESSAGES.PREVIOUS_MATCH_NOTES,
    ),
    FIXTURE_LINEUP_GENERATION_MESSAGES.previous_match_used(
      context.team_name,
      previous_players.length,
    ),
  );
  return { status: PREVIOUS_MATCH_STRATEGY_STATUS.COMPLETED, result };
}

function fail_insufficient_players(
  context: LineupGenerationContext,
  active_count: number,
  min_players: number,
): LineupGenerationResult {
  console.warn(FIXTURE_LINEUP_GENERATION_LOG_SCOPE, {
    event: FIXTURE_LINEUP_GENERATION_EVENT.INSUFFICIENT_PLAYERS,
    fixture_id: context.fixture.id,
    team_id: context.team_id,
    active_count,
    min_players,
  });
  const messages = FIXTURE_LINEUP_GENERATION_MESSAGES;
  return create_lineup_generation_failure(
    messages.insufficient_players(context.team_name, active_count, min_players),
    messages.insufficient_players_fix(
      context.team_name,
      min_players - active_count,
    ),
  );
}

function mark_substitutes_beyond_starters<
  TPlayer extends { is_substitute: boolean },
>(players: TPlayer[], starters_count: number): TPlayer[] {
  return players.map((player, index) => ({
    ...player,
    is_substitute: index >= starters_count,
  }));
}

export async function generate_first_available_lineup(
  context: LineupGenerationContext,
  rules: LineupRules,
): Promise<LineupGenerationResult> {
  const memberships_result = await load_active_memberships(context);
  if (!memberships_result.success) {
    return create_lineup_generation_failure(memberships_result.error);
  }
  const active_memberships = memberships_result.data;
  if (active_memberships.length < rules.min_players) {
    return fail_insufficient_players(
      context,
      active_memberships.length,
      rules.min_players,
    );
  }
  const selected_players = mark_substitutes_beyond_starters(
    (await load_sorted_lineup_players(context, active_memberships)).slice(
      0,
      Math.min(active_memberships.length, rules.max_players),
    ),
    rules.starters_count,
  );
  return save_generated_lineup(
    context,
    build_auto_generated_lineup(
      context,
      selected_players,
      FIXTURE_LINEUP_GENERATION_MESSAGES.FIRST_AVAILABLE_NOTES,
    ),
    FIXTURE_LINEUP_GENERATION_MESSAGES.first_available_used(
      context.team_name,
      selected_players.length,
    ),
  );
}
