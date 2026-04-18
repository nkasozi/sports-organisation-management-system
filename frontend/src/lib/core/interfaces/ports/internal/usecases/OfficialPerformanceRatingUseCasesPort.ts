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
import type { OfficialPerformanceRatingFilter } from "../../external/repositories/OfficialPerformanceRatingRepository";
import type { QueryOptions } from "../../external/repositories/Repository";

export interface OfficialPerformanceRatingUseCasesPort {
  create(
    input: CreateOfficialPerformanceRatingInput,
  ): AsyncResult<OfficialPerformanceRating>;

  update(
    id: ScalarValueInput<OfficialPerformanceRating["id"]>,
    input: UpdateOfficialPerformanceRatingInput,
  ): AsyncResult<OfficialPerformanceRating>;

  delete(
    id: ScalarValueInput<OfficialPerformanceRating["id"]>,
  ): AsyncResult<boolean>;

  get_by_id(
    id: ScalarValueInput<OfficialPerformanceRating["id"]>,
  ): AsyncResult<OfficialPerformanceRating>;

  list(
    filter?: OfficialPerformanceRatingFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialPerformanceRating>;

  list_by_official(
    official_id: ScalarValueInput<OfficialPerformanceRating["official_id"]>,
  ): PaginatedAsyncResult<OfficialPerformanceRating>;

  list_by_fixture(
    fixture_id: ScalarValueInput<OfficialPerformanceRating["fixture_id"]>,
  ): PaginatedAsyncResult<OfficialPerformanceRating>;

  list_all(): PaginatedAsyncResult<OfficialPerformanceRating>;

  submit_or_update_rating(
    input: CreateOfficialPerformanceRatingInput,
  ): AsyncResult<OfficialPerformanceRating>;
}
