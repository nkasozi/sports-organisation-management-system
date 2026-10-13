import type {
  CreateOfficialPerformanceRatingInput,
  OfficialPerformanceRating,
  UpdateOfficialPerformanceRatingInput,
} from "$lib/core/entities/OfficialPerformanceRating";
import { validate_rating_input } from "$lib/core/entities/OfficialPerformanceRating";
import type {
  OfficialPerformanceRatingRepository,
  OfficialPerformanceRatingUseCasesPort,
} from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  CurrentUserStatus,
  OFFICIAL_PERFORMANCE_RATING_DEFAULT_QUERY_OPTIONS,
  OFFICIAL_PERFORMANCE_RATING_WIDE_QUERY_OPTIONS,
  OfficialPerformanceRatingUseCaseEvent,
  OfficialPerformanceRatingUseCaseMessage,
} from "./OfficialPerformanceRatingUseCasesConstants";
import type { RatingId } from "./OfficialPerformanceRatingUseCasesQueries";
import {
  build_rating_filter,
  build_rating_target,
  get_rating_by_id,
  list_ratings,
  list_ratings_by_fixture,
  list_ratings_by_official,
} from "./OfficialPerformanceRatingUseCasesQueries";
import { submit_or_update_rating } from "./OfficialPerformanceRatingUseCasesSubmit";
import {
  fail_validation,
  forward_dependency_result,
} from "./UseCaseResultGuards";

export type OfficialPerformanceRatingUseCases =
  OfficialPerformanceRatingUseCasesPort;

type CurrentUser =
  | {
      status: typeof CurrentUserStatus.AVAILABLE;
      id: ScalarValueInput<OfficialPerformanceRating["rater_user_id"]>;
      role: string;
    }
  | { status: typeof CurrentUserStatus.ANONYMOUS };

type CurrentUserProvider = () => CurrentUser;

type RaterIdentity = Pick<
  CreateOfficialPerformanceRatingInput,
  "rater_user_id" | "rater_role"
>;

const ANONYMOUS_CURRENT_USER: CurrentUser = {
  status: CurrentUserStatus.ANONYMOUS,
};

function resolve_rater_identity(
  current_user: CurrentUser,
  input: CreateOfficialPerformanceRatingInput,
): RaterIdentity {
  switch (current_user.status) {
    case CurrentUserStatus.AVAILABLE:
      return {
        rater_user_id: current_user.id || input.rater_user_id || "",
        rater_role: current_user.role || input.rater_role || "",
      };
    case CurrentUserStatus.ANONYMOUS:
      return {
        rater_user_id: input.rater_user_id || "",
        rater_role: input.rater_role || "",
      };
  }
}

async function create_rating(
  repository: OfficialPerformanceRatingRepository,
  current_user: CurrentUser,
  input: CreateOfficialPerformanceRatingInput,
): AsyncResult<OfficialPerformanceRating> {
  const enriched_input: CreateOfficialPerformanceRatingInput = {
    ...input,
    ...resolve_rater_identity(current_user, input),
  };
  const context = {
    official_id: enriched_input.official_id,
    fixture_id: enriched_input.fixture_id,
  };
  const validation_errors = validate_rating_input(enriched_input);
  if (validation_errors.length > 0) {
    return fail_validation(
      build_rating_target(
        OfficialPerformanceRatingUseCaseEvent.CREATE_VALIDATION_FAILED,
        context,
      ),
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.create(enriched_input), {
    ...build_rating_target(
      OfficialPerformanceRatingUseCaseEvent.CREATE_FAILED,
      context,
    ),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function update_rating(
  repository: OfficialPerformanceRatingRepository,
  id: RatingId,
  input: UpdateOfficialPerformanceRatingInput,
): AsyncResult<OfficialPerformanceRating> {
  const context = { rating_id: id };
  const existing_result = await repository.find_by_id(id);
  if (!existing_result.success) {
    return forward_dependency_result(existing_result, {
      ...build_rating_target(
        OfficialPerformanceRatingUseCaseEvent.UPDATE_TARGET_NOT_FOUND,
        context,
      ),
      code: UseCaseErrorCode.NOT_FOUND,
      user_message: OfficialPerformanceRatingUseCaseMessage.NOT_FOUND,
    });
  }
  const merged_input: CreateOfficialPerformanceRatingInput = {
    ...existing_result.data,
    ...input,
  };
  const validation_errors = validate_rating_input(merged_input);
  if (validation_errors.length > 0) {
    return fail_validation(
      build_rating_target(
        OfficialPerformanceRatingUseCaseEvent.UPDATE_VALIDATION_FAILED,
        context,
      ),
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.update(id, input), {
    ...build_rating_target(
      OfficialPerformanceRatingUseCaseEvent.UPDATE_FAILED,
      context,
    ),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function delete_rating(
  repository: OfficialPerformanceRatingRepository,
  id: RatingId,
): AsyncResult<boolean> {
  return forward_dependency_result(await repository.delete_by_id(id), {
    ...build_rating_target(
      OfficialPerformanceRatingUseCaseEvent.DELETE_FAILED,
      {
        rating_id: id,
      },
    ),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

function create_official_performance_rating_use_cases(
  repository: OfficialPerformanceRatingRepository,
  get_current_user: CurrentUserProvider = () => ANONYMOUS_CURRENT_USER,
): OfficialPerformanceRatingUseCases {
  return {
    create: (input) => create_rating(repository, get_current_user(), input),
    update: (id, input) => update_rating(repository, id, input),
    delete: (id) => delete_rating(repository, id),
    get_by_id: (id) => get_rating_by_id(repository, id),
    list: (filter, options) =>
      list_ratings(
        repository,
        build_rating_filter(filter),
        options || { ...OFFICIAL_PERFORMANCE_RATING_DEFAULT_QUERY_OPTIONS },
      ),
    list_by_official: (official_id) =>
      list_ratings_by_official(repository, official_id),
    list_by_fixture: (fixture_id) =>
      list_ratings_by_fixture(repository, fixture_id),
    list_all: () =>
      list_ratings(
        repository,
        {},
        {
          ...OFFICIAL_PERFORMANCE_RATING_WIDE_QUERY_OPTIONS,
        },
      ),
    submit_or_update_rating: (input) =>
      submit_or_update_rating(repository, input),
  };
}

export { create_official_performance_rating_use_cases };
