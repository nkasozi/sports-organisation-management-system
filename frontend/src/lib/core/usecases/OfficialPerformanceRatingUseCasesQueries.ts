import type { OfficialPerformanceRating } from "$lib/core/entities/OfficialPerformanceRating";
import type {
  OfficialPerformanceRatingFilter,
  OfficialPerformanceRatingRepository,
  QueryOptions,
} from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  OFFICIAL_PERFORMANCE_RATING_USE_CASES_LOG_SCOPE,
  OFFICIAL_PERFORMANCE_RATING_WIDE_QUERY_OPTIONS,
  OfficialPerformanceRatingUseCaseEvent,
} from "./OfficialPerformanceRatingUseCasesConstants";
import type { UseCaseFailureTarget } from "./UseCaseResultGuards";
import { forward_dependency_result } from "./UseCaseResultGuards";

export type RatingId = ScalarValueInput<OfficialPerformanceRating["id"]>;

export function build_rating_target(
  event: string,
  context: Record<string, unknown>,
): UseCaseFailureTarget {
  return {
    log_scope: OFFICIAL_PERFORMANCE_RATING_USE_CASES_LOG_SCOPE,
    event,
    context,
  };
}

export async function get_rating_by_id(
  repository: OfficialPerformanceRatingRepository,
  id: RatingId,
): AsyncResult<OfficialPerformanceRating> {
  return forward_dependency_result(await repository.find_by_id(id), {
    ...build_rating_target(OfficialPerformanceRatingUseCaseEvent.GET_FAILED, {
      rating_id: id,
    }),
    code: UseCaseErrorCode.NOT_FOUND,
  });
}

export function build_rating_filter(
  filter: OfficialPerformanceRatingFilter | Record<string, string> | undefined,
): OfficialPerformanceRatingFilter {
  if (!filter) {
    return {};
  }
  return {
    ...(filter.organization_id
      ? { organization_id: filter.organization_id }
      : {}),
    ...(filter.official_id ? { official_id: filter.official_id } : {}),
    ...(filter.fixture_id ? { fixture_id: filter.fixture_id } : {}),
    ...(filter.rater_user_id ? { rater_user_id: filter.rater_user_id } : {}),
    ...(filter.rater_role ? { rater_role: filter.rater_role } : {}),
  };
}

export async function list_ratings(
  repository: OfficialPerformanceRatingRepository,
  filter: OfficialPerformanceRatingFilter,
  options: QueryOptions,
): PaginatedAsyncResult<OfficialPerformanceRating> {
  return forward_dependency_result(await repository.find_all(filter, options), {
    ...build_rating_target(
      OfficialPerformanceRatingUseCaseEvent.LIST_FAILED,
      {},
    ),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

export async function list_ratings_by_official(
  repository: OfficialPerformanceRatingRepository,
  official_id: ScalarValueInput<OfficialPerformanceRating["official_id"]>,
): PaginatedAsyncResult<OfficialPerformanceRating> {
  const result = await repository.find_by_official(official_id, {
    ...OFFICIAL_PERFORMANCE_RATING_WIDE_QUERY_OPTIONS,
  });
  return forward_dependency_result(result, {
    ...build_rating_target(
      OfficialPerformanceRatingUseCaseEvent.LIST_BY_OFFICIAL_FAILED,
      { official_id },
    ),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

export async function list_ratings_by_fixture(
  repository: OfficialPerformanceRatingRepository,
  fixture_id: ScalarValueInput<OfficialPerformanceRating["fixture_id"]>,
): PaginatedAsyncResult<OfficialPerformanceRating> {
  const result = await repository.find_by_fixture(fixture_id, {
    ...OFFICIAL_PERFORMANCE_RATING_WIDE_QUERY_OPTIONS,
  });
  return forward_dependency_result(result, {
    ...build_rating_target(
      OfficialPerformanceRatingUseCaseEvent.LIST_BY_FIXTURE_FAILED,
      { fixture_id },
    ),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}
