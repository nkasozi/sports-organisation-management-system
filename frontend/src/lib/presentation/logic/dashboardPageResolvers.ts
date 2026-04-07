import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";

import type { DashboardDependencies } from "./dashboardPageTypes";

const UNKNOWN_SPORT_LABEL = "Unknown Sport";
const UNKNOWN_COMPETITION_LABEL = "Unknown Competition";

export async function resolve_sport_names_for_competitions(
  competitions: Competition[],
  dependencies: DashboardDependencies,
): Promise<Record<string, string>> {
  const resolved_names: Record<string, string> = {};

  for (const competition of competitions) {
    if (!competition.id) continue;

    const organization_result =
      await dependencies.organization_use_cases.get_by_id(
        competition.organization_id,
      );
    if (!organization_result.success || !organization_result.data) {
      resolved_names[competition.id] = UNKNOWN_SPORT_LABEL;
      continue;
    }

    const sport_result = await dependencies.sport_use_cases.get_by_id(
      organization_result.data.sport_id,
    );
    resolved_names[competition.id] =
      sport_result.success && sport_result.data
        ? sport_result.data.name
        : UNKNOWN_SPORT_LABEL;
  }

  return resolved_names;
}

export async function resolve_fixture_display_names(
  fixtures: Fixture[],
  dependencies: DashboardDependencies,
): Promise<{
  competition_names: Record<string, string>;
  sport_names: Record<string, string>;
}> {
  const resolved_competition_names: Record<string, string> = {};
  const resolved_sport_names: Record<string, string> = {};
  const competition_ids = [
    ...new Set(
      fixtures
        .map((fixture: Fixture) => fixture.competition_id)
        .filter(Boolean),
    ),
  ];

  for (const competition_id of competition_ids) {
    const competition_result =
      await dependencies.competition_use_cases.get_by_id(competition_id);
    if (!competition_result.success || !competition_result.data) {
      resolved_competition_names[competition_id] = UNKNOWN_COMPETITION_LABEL;
      resolved_sport_names[competition_id] = UNKNOWN_SPORT_LABEL;
      continue;
    }

    resolved_competition_names[competition_id] = competition_result.data.name;

    const organization_result =
      await dependencies.organization_use_cases.get_by_id(
        competition_result.data.organization_id,
      );
    if (!organization_result.success || !organization_result.data) {
      resolved_sport_names[competition_id] = UNKNOWN_SPORT_LABEL;
      continue;
    }

    const sport_result = await dependencies.sport_use_cases.get_by_id(
      organization_result.data.sport_id,
    );
    resolved_sport_names[competition_id] =
      sport_result.success && sport_result.data
        ? sport_result.data.name
        : UNKNOWN_SPORT_LABEL;
  }

  return {
    competition_names: resolved_competition_names,
    sport_names: resolved_sport_names,
  };
}
