import type {
  CreateOfficialPerformanceRatingInput,
  OfficialPerformanceRating,
  UpdateOfficialPerformanceRatingInput,
} from "$lib/core/entities/OfficialPerformanceRating";
import { validate_rating_input } from "$lib/core/entities/OfficialPerformanceRating";
import type { OfficialPerformanceRatingRepository } from "$lib/core/interfaces/ports";
import { is_official_performance_rating_not_found_error } from "$lib/core/interfaces/ports";
import type { AsyncResult } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  ExistingRatingLookupStatus,
  OfficialPerformanceRatingUseCaseEvent,
} from "./OfficialPerformanceRatingUseCasesConstants";
import { build_rating_target } from "./OfficialPerformanceRatingUseCasesQueries";
import {
  fail_validation,
  forward_dependency_result,
} from "./UseCaseResultGuards";

type ExistingRatingLookup =
  | {
      status: typeof ExistingRatingLookupStatus.FOUND;
      rating: OfficialPerformanceRating;
    }
  | { status: typeof ExistingRatingLookupStatus.NONE };

function build_submit_context(
  input: CreateOfficialPerformanceRatingInput,
): Record<string, unknown> {
  return {
    official_id: input.official_id,
    fixture_id: input.fixture_id,
    rater_user_id: input.rater_user_id,
  };
}

async function lookup_existing_rating(
  repository: OfficialPerformanceRatingRepository,
  input: CreateOfficialPerformanceRatingInput,
): AsyncResult<ExistingRatingLookup> {
  const result = await repository.find_existing_rating(
    input.official_id,
    input.fixture_id,
    input.rater_user_id,
  );
  if (result.success) {
    return create_success_result({
      status: ExistingRatingLookupStatus.FOUND,
      rating: result.data,
    });
  }
  if (
    is_official_performance_rating_not_found_error(
      result.error,
      input.official_id,
      input.fixture_id,
      input.rater_user_id,
    )
  ) {
    return create_success_result({ status: ExistingRatingLookupStatus.NONE });
  }
  return forward_dependency_result(result, {
    ...build_rating_target(
      OfficialPerformanceRatingUseCaseEvent.SUBMIT_LOOKUP_FAILED,
      build_submit_context(input),
    ),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

function build_dimension_update(
  input: CreateOfficialPerformanceRatingInput,
): UpdateOfficialPerformanceRatingInput {
  return {
    overall: input.overall,
    decision_accuracy: input.decision_accuracy,
    game_control: input.game_control,
    communication: input.communication,
    fitness: input.fitness,
    notes: input.notes,
  };
}

async function apply_submission(
  repository: OfficialPerformanceRatingRepository,
  lookup: ExistingRatingLookup,
  input: CreateOfficialPerformanceRatingInput,
): AsyncResult<OfficialPerformanceRating> {
  switch (lookup.status) {
    case ExistingRatingLookupStatus.FOUND:
      return forward_dependency_result(
        await repository.update(
          lookup.rating.id,
          build_dimension_update(input),
        ),
        {
          ...build_rating_target(
            OfficialPerformanceRatingUseCaseEvent.SUBMIT_UPDATE_FAILED,
            { rating_id: lookup.rating.id },
          ),
          code: UseCaseErrorCode.DEPENDENCY_FAILED,
        },
      );
    case ExistingRatingLookupStatus.NONE:
      return forward_dependency_result(await repository.create(input), {
        ...build_rating_target(
          OfficialPerformanceRatingUseCaseEvent.SUBMIT_CREATE_FAILED,
          build_submit_context(input),
        ),
        code: UseCaseErrorCode.DEPENDENCY_FAILED,
      });
  }
}

export async function submit_or_update_rating(
  repository: OfficialPerformanceRatingRepository,
  input: CreateOfficialPerformanceRatingInput,
): AsyncResult<OfficialPerformanceRating> {
  const validation_errors = validate_rating_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      build_rating_target(
        OfficialPerformanceRatingUseCaseEvent.SUBMIT_VALIDATION_FAILED,
        build_submit_context(input),
      ),
      validation_errors,
    );
  }
  const lookup_result = await lookup_existing_rating(repository, input);
  if (!lookup_result.success) {
    return lookup_result;
  }
  return apply_submission(repository, lookup_result.data, input);
}
