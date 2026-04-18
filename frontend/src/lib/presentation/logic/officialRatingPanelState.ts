import type { Official } from "$lib/core/entities/Official";
import type {
  OfficialPerformanceRating,
  RatingDimensions,
} from "$lib/core/entities/OfficialPerformanceRating";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";

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

export async function load_official_rating_states(
  fixture_id: string,
  organization_id: string,
  assigned_official_ids: Array<ScalarValueInput<Official["id"]>>,
  rater_user_id: string,
  dependencies: OfficialRatingPanelDependencies,
): Promise<OfficialRatingState[]> {
  const officials_result = await dependencies.official_use_cases.list({
    organization_id,
  });
  if (!officials_result.success || !officials_result.data) {
    return [];
  }
  const officials_map = new Map<ScalarValueInput<Official["id"]>, Official>(
    officials_result.data.items.map((official: Official) => [
      official.id,
      official,
    ]),
  );
  const ratings_result =
    await dependencies.rating_use_cases.list_by_fixture(fixture_id);
  const existing_ratings: OfficialPerformanceRating[] =
    ratings_result.success && ratings_result.data
      ? ratings_result.data.items
      : [];
  const rater_ratings = existing_ratings.filter(
    (rating) => rating.rater_user_id === rater_user_id,
  );
  return assigned_official_ids.flatMap(
    (official_id: ScalarValueInput<Official["id"]>): OfficialRatingState[] => {
      const official = officials_map.get(official_id);
      if (!official) {
        return [];
      }

      const found_rating = rater_ratings.find(
        (rating) => rating.official_id === official_id,
      );

      return [
        {
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
        },
      ];
    },
  );
}
