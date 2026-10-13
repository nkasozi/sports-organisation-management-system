import type { Official } from "$lib/core/entities/Official";
import type {
  OfficialPerformanceRating,
  RatingDimensions,
} from "$lib/core/entities/OfficialPerformanceRating";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  OFFICIAL_RATING_PANEL_EVENT,
  OFFICIAL_RATING_PANEL_MESSAGE,
} from "./officialRatingPanelMessages";

export interface OfficialRatingState {
  official: Official;
  rating: RatingDimensions & { notes: string };
  existing_id: string;
  is_saving: boolean;
  validation_errors: string[];
}

export const OFFICIAL_RATING_DIMENSIONS = [
  { key: "overall", label: "Overall" },
  { key: "decision_accuracy", label: "Decision Accuracy" },
  { key: "game_control", label: "Game Control" },
  { key: "communication", label: "Communication" },
  { key: "fitness", label: "Fitness & Mobility" },
] as const;

interface OfficialRatingPanelLoadCommand {
  fixture_id: string;
  organization_id: string;
  assigned_official_ids: Array<ScalarValueInput<Official["id"]>>;
  rater_user_id: string;
}

interface OfficialRatingPanelDependencies {
  official_use_cases: {
    list: (filters: { organization_id: string }) => Promise<{
      success: boolean;
      data?: { items: Official[] };
    }>;
  };
  rating_use_cases: {
    list_by_fixture: (fixture_id: string) => Promise<{
      success: boolean;
      data?: { items: OfficialPerformanceRating[] };
    }>;
  };
}

export function build_default_official_rating_dimensions(): RatingDimensions & {
  notes: string;
} {
  return {
    overall: 5,
    decision_accuracy: 5,
    game_control: 5,
    communication: 5,
    fitness: 5,
    notes: "",
  };
}

function build_official_rating_state(
  official: Official,
  found_rating: OfficialPerformanceRating | undefined,
): OfficialRatingState {
  return {
    official,
    rating: found_rating
      ? {
          overall: found_rating.overall,
          decision_accuracy: found_rating.decision_accuracy,
          game_control: found_rating.game_control,
          communication: found_rating.communication,
          fitness: found_rating.fitness,
          notes: found_rating.notes,
        }
      : build_default_official_rating_dimensions(),
    existing_id: found_rating ? found_rating.id : "",
    is_saving: false,
    validation_errors: [],
  };
}

async function load_rater_ratings(
  fixture_id: string,
  rater_user_id: string,
  dependencies: OfficialRatingPanelDependencies,
): Promise<OfficialPerformanceRating[]> {
  const ratings_result =
    await dependencies.rating_use_cases.list_by_fixture(fixture_id);
  if (!ratings_result.success || !ratings_result.data) {
    console.warn("[OfficialRatingPanel] Existing ratings unavailable", {
      event: OFFICIAL_RATING_PANEL_EVENT.RATINGS_LOAD_FAILED,
      fixture_id,
    });
    return [];
  }
  return ratings_result.data.items.filter(
    (rating) => rating.rater_user_id === rater_user_id,
  );
}

async function load_officials_map(
  fixture_id: string,
  organization_id: string,
  dependencies: OfficialRatingPanelDependencies,
): AsyncResult<Map<ScalarValueInput<Official["id"]>, Official>> {
  const officials_result = await dependencies.official_use_cases.list({
    organization_id,
  });
  if (!officials_result.success || !officials_result.data) {
    console.error("[OfficialRatingPanel] Officials load failed", {
      event: OFFICIAL_RATING_PANEL_EVENT.OFFICIALS_LOAD_FAILED,
      fixture_id,
      organization_id,
    });
    return create_failure_result(
      OFFICIAL_RATING_PANEL_MESSAGE.OFFICIALS_LOAD_FAILED,
    );
  }
  return create_success_result(
    new Map(
      officials_result.data.items.map((official: Official) => [
        official.id,
        official,
      ]),
    ),
  );
}

export async function load_official_rating_panel(
  command: OfficialRatingPanelLoadCommand,
  dependencies: OfficialRatingPanelDependencies,
): AsyncResult<OfficialRatingState[]> {
  const officials_map_result = await load_officials_map(
    command.fixture_id,
    command.organization_id,
    dependencies,
  );
  if (!officials_map_result.success) return officials_map_result;
  const rater_ratings = await load_rater_ratings(
    command.fixture_id,
    command.rater_user_id,
    dependencies,
  );
  return create_success_result(
    command.assigned_official_ids.flatMap((official_id) => {
      const official = officials_map_result.data.get(official_id);
      if (!official) return [];
      const found_rating = rater_ratings.find(
        (rating) => rating.official_id === official_id,
      );
      return [build_official_rating_state(official, found_rating)];
    }),
  );
}

export async function load_official_rating_states(
  fixture_id: string,
  organization_id: string,
  assigned_official_ids: Array<ScalarValueInput<Official["id"]>>,
  rater_user_id: string,
  dependencies: OfficialRatingPanelDependencies,
): Promise<OfficialRatingState[]> {
  const panel_result = await load_official_rating_panel(
    { fixture_id, organization_id, assigned_official_ids, rater_user_id },
    dependencies,
  );
  return panel_result.success ? panel_result.data : [];
}
