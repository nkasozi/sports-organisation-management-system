import type { SquadGenerationStrategy } from "../entities/Competition";
import type { CompetitionUseCases } from "../usecases/CompetitionUseCases";
import type { OrganizationUseCases } from "../usecases/OrganizationUseCases";
import type { SportUseCases } from "../usecases/SportUseCases";

interface PlayerRulesResult {
  success: boolean;
  min_players: number;
  max_players: number;
  squad_generation_strategy: SquadGenerationStrategy;
  error_message?: string;
}

export async function get_player_rules_from_competition(
  competition_id: string,
  competition_use_cases: CompetitionUseCases,
  organization_use_cases: OrganizationUseCases,
  sport_use_cases: SportUseCases,
): Promise<PlayerRulesResult> {
  const competition_result =
    await competition_use_cases.get_by_id(competition_id);
  if (!competition_result.success || !competition_result.data) {
    console.error(
      "[fixtureStartChecks] Could not load competition:",
      competition_id,
    );
    return {
      success: false,
      min_players: 0,
      max_players: 99,
      squad_generation_strategy: "first_available",
      error_message: "Could not load competition",
    };
  }

  const competition = competition_result.data;
  const rule_overrides = competition.rule_overrides;
  const strategy: SquadGenerationStrategy =
    competition.squad_generation_strategy || "first_available";
  const has_min = rule_overrides?.min_players_on_field !== undefined;
  const has_max = rule_overrides?.max_players_on_field !== undefined;

  if (has_min && has_max) {
    return {
      success: true,
      min_players: rule_overrides.min_players_on_field!,
      max_players: rule_overrides.max_players_on_field!,
      squad_generation_strategy: strategy,
    };
  }

  const org_result = await organization_use_cases.get_by_id(
    competition.organization_id,
  );
  if (!org_result.success || !org_result.data) {
    console.warn(
      "[fixtureStartChecks] Could not load organization, using defaults",
    );
    return {
      success: true,
      min_players: has_min ? rule_overrides.min_players_on_field! : 0,
      max_players: has_max ? rule_overrides.max_players_on_field! : 99,
      squad_generation_strategy: strategy,
    };
  }

  const sport_result = await sport_use_cases.get_by_id(
    org_result.data.sport_id,
  );
  if (!sport_result.success || !sport_result.data) {
    console.warn("[fixtureStartChecks] Could not load sport, using defaults");
    return {
      success: true,
      min_players: has_min ? rule_overrides.min_players_on_field! : 0,
      max_players: has_max ? rule_overrides.max_players_on_field! : 99,
      squad_generation_strategy: strategy,
    };
  }

  const sport = sport_result.data;
  return {
    success: true,
    min_players: has_min
      ? rule_overrides.min_players_on_field!
      : sport.min_players_per_fixture || 0,
    max_players: has_max
      ? rule_overrides.max_players_on_field!
      : sport.max_players_per_fixture || 99,
    squad_generation_strategy: strategy,
  };
}
