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

export interface OfficialPerformanceRatingFilter {
  organization_id?: ScalarValueInput<OfficialPerformanceRating["organization_id"]>;
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
  ): AsyncResult<OfficialPerformanceRating | null>;
}
