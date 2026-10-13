import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Official } from "$lib/core/entities/Official";
import type { OfficialPerformanceRating } from "$lib/core/entities/OfficialPerformanceRating";
import type { Organization } from "$lib/core/entities/Organization";
import { get_scope_value } from "$lib/core/interfaces/ports";

import { OFFICIAL_EVENT, OFFICIAL_MESSAGE } from "./officialEventConstants";
import {
  type OfficialLeaderboardProfileState,
  type OfficialLeaderboardViewState,
  rebuild_official_leaderboard_view,
  resolve_official_leaderboard_organizations,
} from "./officialLeaderboardPageState";
import { PRESENCE_STATUS } from "./presenceStatus";

const LEADERBOARD_PAGE_SIZE = 1000;

type ListResult<T> = Promise<{ success: boolean; data?: { items: T[] } }>;

interface OfficialLeaderboardPageDependencies {
  organization_use_cases: { list(): ListResult<Organization> };
  official_performance_rating_use_cases: {
    list(
      filter?: unknown,
      options?: { page_size: number },
    ): ListResult<OfficialPerformanceRating>;
  };
  official_use_cases: {
    list(
      filter?: unknown,
      options?: { page_size: number },
    ): ListResult<Official>;
  };
  fixture_use_cases: {
    list(
      filter?: unknown,
      options?: { page_size: number },
    ): ListResult<Fixture>;
  };
  competition_stage_use_cases: {
    list(
      filter?: unknown,
      options?: { page_size: number },
    ): ListResult<CompetitionStage>;
  };
}

export interface OfficialLeaderboardPageData extends OfficialLeaderboardViewState {
  organizations: Organization[];
  selected_organization_id: string;
  user_official_id: string;
  all_ratings: OfficialPerformanceRating[];
  all_officials: Official[];
  all_fixtures: Fixture[];
  all_stages: CompetitionStage[];
}

type OfficialLeaderboardPageStateResult =
  | { success: false; error_message: string }
  | { success: true; data: OfficialLeaderboardPageData };

type ResolvedListResult<T> = Awaited<ListResult<T>>;

interface OfficialLeaderboardDatasetResults {
  organization_result: ResolvedListResult<Organization>;
  ratings_result: ResolvedListResult<OfficialPerformanceRating>;
  officials_result: ResolvedListResult<Official>;
  fixtures_result: ResolvedListResult<Fixture>;
  stages_result: ResolvedListResult<CompetitionStage>;
}

async function fetch_official_leaderboard_datasets(
  dependencies: OfficialLeaderboardPageDependencies,
): Promise<OfficialLeaderboardDatasetResults> {
  const page_options = { page_size: LEADERBOARD_PAGE_SIZE };
  const [
    organization_result,
    ratings_result,
    officials_result,
    fixtures_result,
    stages_result,
  ] = await Promise.all([
    dependencies.organization_use_cases.list(),
    dependencies.official_performance_rating_use_cases.list({}, page_options),
    dependencies.official_use_cases.list({}, page_options),
    dependencies.fixture_use_cases.list({}, page_options),
    dependencies.competition_stage_use_cases.list({}, page_options),
  ]);
  return {
    organization_result,
    ratings_result,
    officials_result,
    fixtures_result,
    stages_result,
  };
}

function have_required_leaderboard_datasets_loaded(
  results: OfficialLeaderboardDatasetResults,
): boolean {
  return (
    results.ratings_result.success &&
    results.officials_result.success &&
    results.fixtures_result.success &&
    results.stages_result.success
  );
}

function resolve_leaderboard_user_official_id(
  profile_state: OfficialLeaderboardProfileState,
): string {
  return profile_state.status === PRESENCE_STATUS.PRESENT
    ? (get_scope_value(profile_state.profile, "official_id") ?? "")
    : "";
}

function build_official_leaderboard_page_data(
  results: OfficialLeaderboardDatasetResults,
  profile_state: OfficialLeaderboardProfileState,
): OfficialLeaderboardPageData {
  const organizations = resolve_official_leaderboard_organizations(
    results.organization_result.success
      ? (results.organization_result.data?.items ?? [])
      : [],
    profile_state,
  );
  const datasets = {
    selected_organization_id: organizations[0]?.id ?? "",
    user_official_id: resolve_leaderboard_user_official_id(profile_state),
    all_ratings: results.ratings_result.data?.items ?? [],
    all_officials: results.officials_result.data?.items ?? [],
    all_fixtures: results.fixtures_result.data?.items ?? [],
    all_stages: results.stages_result.data?.items ?? [],
  };
  return {
    organizations,
    ...datasets,
    ...rebuild_official_leaderboard_view(datasets),
  };
}

export async function load_official_leaderboard_page_state(command: {
  profile_state: OfficialLeaderboardProfileState;
  dependencies: OfficialLeaderboardPageDependencies;
}): Promise<OfficialLeaderboardPageStateResult> {
  const results = await fetch_official_leaderboard_datasets(
    command.dependencies,
  );

  if (!have_required_leaderboard_datasets_loaded(results)) {
    console.error("[OfficialLeaderboard] Data load failed", {
      event: OFFICIAL_EVENT.LEADERBOARD_LOAD_FAILED,
      ratings_ok: results.ratings_result.success,
      officials_ok: results.officials_result.success,
      fixtures_ok: results.fixtures_result.success,
      stages_ok: results.stages_result.success,
    });
    return {
      success: false,
      error_message: OFFICIAL_MESSAGE.LEADERBOARD_LOAD_FAILED,
    };
  }

  return {
    success: true,
    data: build_official_leaderboard_page_data(results, command.profile_state),
  };
}
