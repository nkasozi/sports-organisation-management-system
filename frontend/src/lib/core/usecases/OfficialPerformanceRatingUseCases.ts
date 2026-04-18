import type {
  CreateOfficialPerformanceRatingInput,
  OfficialPerformanceRating,
  UpdateOfficialPerformanceRatingInput,
} from "$lib/core/entities/OfficialPerformanceRating";
import { validate_rating_input } from "$lib/core/entities/OfficialPerformanceRating";
import type {
  OfficialPerformanceRatingFilter,
  OfficialPerformanceRatingRepository,
} from "$lib/core/interfaces/ports";
import type { QueryOptions } from "$lib/core/interfaces/ports";
import type { OfficialPerformanceRatingUseCasesPort } from "$lib/core/interfaces/ports";
import { is_official_performance_rating_not_found_error } from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import { create_failure_result } from "$lib/core/types/Result";

export type OfficialPerformanceRatingUseCases =
  OfficialPerformanceRatingUseCasesPort;

type CurrentUserProvider = () =>
  | {
      status: "available";
      id: ScalarValueInput<OfficialPerformanceRating["rater_user_id"]>;
      role: string;
    }
  | {
      status: "anonymous";
    };

const ANONYMOUS_CURRENT_USER: ReturnType<CurrentUserProvider> = {
  status: "anonymous",
};

function create_official_performance_rating_use_cases(
  repository: OfficialPerformanceRatingRepository,
  get_current_user: CurrentUserProvider = () => ANONYMOUS_CURRENT_USER,
): OfficialPerformanceRatingUseCases {
  return {
    async create(
      input: CreateOfficialPerformanceRatingInput,
    ): AsyncResult<OfficialPerformanceRating> {
      const current_user = get_current_user();
      const current_user_id =
        current_user.status === "available" ? current_user.id : "";
      const current_user_role =
        current_user.status === "available" ? current_user.role : "";
      const enriched_input: CreateOfficialPerformanceRatingInput = {
        ...input,
        rater_user_id: current_user_id || input.rater_user_id || "",
        rater_role: current_user_role || input.rater_role || "",
      };
      const validation_errors = validate_rating_input(enriched_input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }
      return repository.create(enriched_input);
    },

    async update(
      id: OfficialPerformanceRating["id"],
      input: UpdateOfficialPerformanceRatingInput,
    ): AsyncResult<OfficialPerformanceRating> {
      const existing_result = await repository.find_by_id(id);
      if (!existing_result.success || !existing_result.data) {
        return create_failure_result("Rating not found");
      }

      const merged_input: CreateOfficialPerformanceRatingInput = {
        ...existing_result.data,
        ...input,
      };

      const validation_errors = validate_rating_input(merged_input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.update(id, input);
    },

    async delete(id: OfficialPerformanceRating["id"]): AsyncResult<boolean> {
      return repository.delete_by_id(id);
    },

    async get_by_id(
      id: OfficialPerformanceRating["id"],
    ): AsyncResult<OfficialPerformanceRating> {
      return repository.find_by_id(id);
    },

    async list(
      filter?: OfficialPerformanceRatingFilter | Record<string, string>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<OfficialPerformanceRating> {
      const query_options = options || { page_number: 1, page_size: 100 };
      if (!filter) {
        return repository.find_all({}, query_options);
      }

      const typed_filter: OfficialPerformanceRatingFilter = {
        ...(filter.organization_id
          ? {
              organization_id:
                filter.organization_id as OfficialPerformanceRating["organization_id"],
            }
          : {}),
        ...(filter.official_id
          ? {
              official_id:
                filter.official_id as OfficialPerformanceRating["official_id"],
            }
          : {}),
        ...(filter.fixture_id
          ? {
              fixture_id:
                filter.fixture_id as OfficialPerformanceRating["fixture_id"],
            }
          : {}),
        ...(filter.rater_user_id
          ? {
              rater_user_id:
                filter.rater_user_id as OfficialPerformanceRating["rater_user_id"],
            }
          : {}),
        ...(filter.rater_role ? { rater_role: filter.rater_role } : {}),
      };

      return repository.find_all(typed_filter, query_options);
    },

    async list_by_official(
      official_id: OfficialPerformanceRating["official_id"],
    ): PaginatedAsyncResult<OfficialPerformanceRating> {
      return repository.find_by_official(official_id, {
        page_number: 1,
        page_size: 200,
      });
    },

    async list_by_fixture(
      fixture_id: OfficialPerformanceRating["fixture_id"],
    ): PaginatedAsyncResult<OfficialPerformanceRating> {
      return repository.find_by_fixture(fixture_id, {
        page_number: 1,
        page_size: 200,
      });
    },

    async list_all(): PaginatedAsyncResult<OfficialPerformanceRating> {
      return repository.find_all({}, { page_number: 1, page_size: 200 });
    },

    async submit_or_update_rating(
      input: CreateOfficialPerformanceRatingInput,
    ): AsyncResult<OfficialPerformanceRating> {
      const validation_errors = validate_rating_input(input);
      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      const existing_result = await repository.find_existing_rating(
        input.official_id,
        input.fixture_id,
        input.rater_user_id,
      );

      if (
        !existing_result.success &&
        !is_official_performance_rating_not_found_error(
          existing_result.error,
          input.official_id,
          input.fixture_id,
          input.rater_user_id,
        )
      ) {
        return create_failure_result(existing_result.error);
      }

      if (existing_result.success) {
        const update_input: UpdateOfficialPerformanceRatingInput = {
          overall: input.overall,
          decision_accuracy: input.decision_accuracy,
          game_control: input.game_control,
          communication: input.communication,
          fitness: input.fitness,
          notes: input.notes,
        };
        return repository.update(existing_result.data.id, update_input);
      }

      return repository.create(input);
    },
  };
}

export { create_official_performance_rating_use_cases };
