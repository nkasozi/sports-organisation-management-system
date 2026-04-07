import type {
  CreateOfficialPerformanceRatingInput,
  OfficialPerformanceRating,
  UpdateOfficialPerformanceRatingInput,
} from "../../../../entities/OfficialPerformanceRating";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { QueryOptions, Repository } from "./Repository";

export interface OfficialPerformanceRatingFilter {
  organization_id?: string;
  official_id?: string;
  fixture_id?: string;
  rater_user_id?: string;
  rater_role?: string;
}

export interface OfficialPerformanceRatingRepository extends Repository<
  OfficialPerformanceRating,
  CreateOfficialPerformanceRatingInput,
  UpdateOfficialPerformanceRatingInput,
  OfficialPerformanceRatingFilter
> {
  find_by_official(
    official_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialPerformanceRating>;

  find_by_fixture(
    fixture_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialPerformanceRating>;

  find_by_official_and_fixture(
    official_id: string,
    fixture_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialPerformanceRating>;

  find_existing_rating(
    official_id: string,
    fixture_id: string,
    rater_user_id: string,
  ): AsyncResult<OfficialPerformanceRating | null>;
}
