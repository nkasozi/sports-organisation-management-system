import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Official } from "$lib/core/entities/Official";
import type { OfficialPerformanceRating } from "$lib/core/entities/OfficialPerformanceRating";
import type { Organization } from "$lib/core/entities/Organization";
import {
  get_scope_value,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports";

import {
  type OfficialLeaderboardViewState,
  rebuild_official_leaderboard_view,
  resolve_official_leaderboard_organizations,
} from "./officialLeaderboardPageState";

const LEADERBOARD_PAGE_SIZE = 1000;
const LEADERBOARD_LOAD_ERROR_MESSAGE =
  "Failed to load leaderboard data. Please try again.";

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
  user_official_id: string | null;
  all_ratings: OfficialPerformanceRating[];
  all_officials: Official[];
  all_fixtures: Fixture[];
  all_stages: CompetitionStage[];
}

type OfficialLeaderboardPageStateResult =
  | { success: false; error_message: string }
  | { success: true; data: OfficialLeaderboardPageData };

export async function load_official_leaderboard_page_state(command: {
  profile: UserScopeProfile | null;
  dependencies: OfficialLeaderboardPageDependencies;
}): Promise<OfficialLeaderboardPageStateResult> {
  const [
    organization_result,
    ratings_result,
    officials_result,
    fixtures_result,
    stages_result,
  ] = await Promise.all([
    command.dependencies.organization_use_cases.list(),
    command.dependencies.official_performance_rating_use_cases.list(undefined, {
      page_size: LEADERBOARD_PAGE_SIZE,
    }),
    command.dependencies.official_use_cases.list(undefined, {
      page_size: LEADERBOARD_PAGE_SIZE,
    }),
    command.dependencies.fixture_use_cases.list(undefined, {
      page_size: LEADERBOARD_PAGE_SIZE,
    }),
    command.dependencies.competition_stage_use_cases.list(undefined, {
      page_size: LEADERBOARD_PAGE_SIZE,
    }),
  ]);

  if (
    !ratings_result.success ||
    !officials_result.success ||
    !fixtures_result.success ||
    !stages_result.success
  ) {
    console.error("[OfficialLeaderboard] Data load failed", {
      event: "official_leaderboard_load_failed",
      ratings_ok: ratings_result.success,
      officials_ok: officials_result.success,
      fixtures_ok: fixtures_result.success,
      stages_ok: stages_result.success,
    });
    return { success: false, error_message: LEADERBOARD_LOAD_ERROR_MESSAGE };
  }

  const organizations = resolve_official_leaderboard_organizations(
    organization_result.success ? (organization_result.data?.items ?? []) : [],
    command.profile,
  );
  const selected_organization_id = organizations[0]?.id ?? "";
  const all_ratings = ratings_result.data?.items ?? [];
  const all_officials = officials_result.data?.items ?? [];
  const all_fixtures = fixtures_result.data?.items ?? [];
  const all_stages = stages_result.data?.items ?? [];
  const user_official_id = get_scope_value(command.profile, "official_id");
  const rebuilt_view = rebuild_official_leaderboard_view({
    all_ratings,
    all_officials,
    all_fixtures,
    all_stages,
    selected_organization_id,
    user_official_id,
  });

  return {
    success: true,
    data: {
      organizations,
      selected_organization_id,
      user_official_id,
      all_ratings,
      all_officials,
      all_fixtures,
      all_stages,
      ...rebuilt_view,
    },
  };
}
