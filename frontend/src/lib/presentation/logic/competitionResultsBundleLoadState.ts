import {
  COMPETITION_RESULTS_BUNDLE_LOAD_STATUS,
  type CompetitionResultsBundleLoadState,
  type EntityListResult,
} from "./competitionResultsPageTypes";

export { COMPETITION_RESULTS_BUNDLE_LOAD_STATUS };

export const BUNDLE_SOURCE = {
  STAGES: "stages",
  TEAMS: "teams",
  FIXTURES: "fixtures",
} as const;

type BundleSource = (typeof BUNDLE_SOURCE)[keyof typeof BUNDLE_SOURCE];

export type LoadedItems<EntityType> = {
  items: EntityType[];
  failed_sources: BundleSource[];
};

const BUNDLE_LOAD_FAILED_MESSAGE =
  "We couldn't load all of this competition's results, so the standings may be incomplete. Please refresh the page to try again.";
const BUNDLE_LOAD_FAILED_EVENT = "competition_results_bundle_load_failed";

export function read_competition_results_items<EntityType>(
  list_result: EntityListResult<EntityType>,
  source: BundleSource,
): LoadedItems<EntityType> {
  return list_result.success
    ? { items: list_result.data?.items || [], failed_sources: [] }
    : { items: [], failed_sources: [source] };
}

export function build_bundle_load_state(
  selected_competition_id: string,
  failed_sources: BundleSource[],
): CompetitionResultsBundleLoadState {
  if (failed_sources.length === 0)
    return { status: COMPETITION_RESULTS_BUNDLE_LOAD_STATUS.LOADED };
  console.error(
    "[CompetitionResults] Failed to load competition results data",
    {
      event: BUNDLE_LOAD_FAILED_EVENT,
      competition_id: selected_competition_id,
      failed_sources,
    },
  );
  return {
    status: COMPETITION_RESULTS_BUNDLE_LOAD_STATUS.FAILED,
    error_message: BUNDLE_LOAD_FAILED_MESSAGE,
  };
}
