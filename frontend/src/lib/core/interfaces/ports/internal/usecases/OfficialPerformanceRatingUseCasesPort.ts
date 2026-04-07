import type {
  CreateOfficialPerformanceRatingInput,
  OfficialPerformanceRating,
  UpdateOfficialPerformanceRatingInput,
} from "../../../../entities/OfficialPerformanceRating";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { OfficialPerformanceRatingFilter } from "../../external/repositories/OfficialPerformanceRatingRepository";
import type { QueryOptions } from "../../external/repositories/Repository";

export interface OfficialPerformanceRatingUseCasesPort {
  create(
    input: CreateOfficialPerformanceRatingInput,
  ): AsyncResult<OfficialPerformanceRating>;

  update(
    id: string,
    input: UpdateOfficialPerformanceRatingInput,
  ): AsyncResult<OfficialPerformanceRating>;

  delete(id: string): AsyncResult<boolean>;

  get_by_id(id: string): AsyncResult<OfficialPerformanceRating>;

  list(
    filter?: OfficialPerformanceRatingFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialPerformanceRating>;

  list_by_official(
    official_id: string,
  ): PaginatedAsyncResult<OfficialPerformanceRating>;

  list_by_fixture(
    fixture_id: string,
  ): PaginatedAsyncResult<OfficialPerformanceRating>;

  list_all(): PaginatedAsyncResult<OfficialPerformanceRating>;

  submit_or_update_rating(
    input: CreateOfficialPerformanceRatingInput,
  ): AsyncResult<OfficialPerformanceRating>;
}
