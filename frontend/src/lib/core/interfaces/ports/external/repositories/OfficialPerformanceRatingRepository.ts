import type {
  CreateOfficialPerformanceRatingInput,
  OfficialPerformanceRating,
  UpdateOfficialPerformanceRatingInput,
} from "../../../../entities/OfficialPerformanceRating";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { QueryOptions, Repository } from "./Repository";

const OFFICIAL_PERFORMANCE_RATING_NOT_FOUND_ERROR_PREFIX =
  "Official performance rating not found";

export function build_official_performance_rating_not_found_error(
  official_id: ScalarValueInput<OfficialPerformanceRating["official_id"]>,
  fixture_id: ScalarValueInput<OfficialPerformanceRating["fixture_id"]>,
  rater_user_id: ScalarValueInput<OfficialPerformanceRating["rater_user_id"]>,
): string {
  return `${OFFICIAL_PERFORMANCE_RATING_NOT_FOUND_ERROR_PREFIX}: ${official_id}:${fixture_id}:${rater_user_id}`;
}

export function is_official_performance_rating_not_found_error(
  error: string,
  official_id: ScalarValueInput<OfficialPerformanceRating["official_id"]>,
  fixture_id: ScalarValueInput<OfficialPerformanceRating["fixture_id"]>,
  rater_user_id: ScalarValueInput<OfficialPerformanceRating["rater_user_id"]>,
): boolean {
  return (
    error ===
    build_official_performance_rating_not_found_error(
      official_id,
      fixture_id,
      rater_user_id,
    )
  );
}

export interface OfficialPerformanceRatingFilter {
  organization_id?: ScalarValueInput<
    OfficialPerformanceRating["organization_id"]
  >;
  official_id?: ScalarValueInput<OfficialPerformanceRating["official_id"]>;
  fixture_id?: ScalarValueInput<OfficialPerformanceRating["fixture_id"]>;
  rater_user_id?: ScalarValueInput<OfficialPerformanceRating["rater_user_id"]>;
  rater_role?: string;
}

export interface OfficialPerformanceRatingRepository extends Repository<
  OfficialPerformanceRating,
  CreateOfficialPerformanceRatingInput,
  UpdateOfficialPerformanceRatingInput,
  OfficialPerformanceRatingFilter
> {
  find_by_official(
    official_id: ScalarValueInput<OfficialPerformanceRating["official_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialPerformanceRating>;

  find_by_fixture(
    fixture_id: ScalarValueInput<OfficialPerformanceRating["fixture_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialPerformanceRating>;

  find_by_official_and_fixture(
    official_id: ScalarValueInput<OfficialPerformanceRating["official_id"]>,
    fixture_id: ScalarValueInput<OfficialPerformanceRating["fixture_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialPerformanceRating>;

  find_existing_rating(
    official_id: ScalarValueInput<OfficialPerformanceRating["official_id"]>,
    fixture_id: ScalarValueInput<OfficialPerformanceRating["fixture_id"]>,
    rater_user_id: ScalarValueInput<OfficialPerformanceRating["rater_user_id"]>,
  ): AsyncResult<OfficialPerformanceRating>;
}
