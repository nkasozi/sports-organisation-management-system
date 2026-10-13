import type {
  CreateVenueInput,
  UpdateVenueInput,
  Venue,
} from "../entities/Venue";
import { validate_venue_input } from "../entities/Venue";
import type {
  QueryOptions,
  VenueFilter,
  VenueRepository,
  VenueUseCasesPort,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import type { UseCaseFailureTarget } from "./UseCaseResultGuards";
import {
  fail_missing_identifier,
  fail_validation,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";
import {
  VENUE_USE_CASES_LOG_SCOPE,
  VenueUseCaseEvent,
  VenueUseCaseMessage,
} from "./VenueUseCasesConstants";

export type VenueUseCases = VenueUseCasesPort;

type VenueId = ScalarValueInput<Venue["id"]>;

function build_target(
  event: string,
  context: Record<string, unknown>,
): UseCaseFailureTarget {
  return { log_scope: VENUE_USE_CASES_LOG_SCOPE, event, context };
}

function fail_missing_venue_id(
  event: string,
  user_message: string,
): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier({
    ...build_target(event, {}),
    user_message,
  });
}

async function list_venues(
  repository: VenueRepository,
  filter: VenueFilter,
  options: QueryOptions,
): PaginatedAsyncResult<Venue> {
  return forward_dependency_result(await repository.find_all(filter, options), {
    ...build_target(VenueUseCaseEvent.LIST_FAILED, {}),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function get_venue_by_id(
  repository: VenueRepository,
  id: VenueId,
): AsyncResult<Venue> {
  if (is_blank_identifier(id)) {
    return fail_missing_venue_id(
      VenueUseCaseEvent.GET_ID_MISSING,
      VenueUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    ...build_target(VenueUseCaseEvent.GET_FAILED, { venue_id: id }),
    code: UseCaseErrorCode.NOT_FOUND,
  });
}

async function create_venue(
  repository: VenueRepository,
  input: CreateVenueInput,
): AsyncResult<Venue> {
  const context = { organization_id: input.organization_id };
  const validation_errors = validate_venue_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      build_target(VenueUseCaseEvent.CREATE_VALIDATION_FAILED, context),
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.create(input), {
    ...build_target(VenueUseCaseEvent.CREATE_FAILED, context),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function update_venue(
  repository: VenueRepository,
  id: VenueId,
  input: UpdateVenueInput,
): AsyncResult<Venue> {
  if (is_blank_identifier(id)) {
    return fail_missing_venue_id(
      VenueUseCaseEvent.UPDATE_ID_MISSING,
      VenueUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.update(id, input), {
    ...build_target(VenueUseCaseEvent.UPDATE_FAILED, { venue_id: id }),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function delete_venue(
  repository: VenueRepository,
  id: VenueId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_venue_id(
      VenueUseCaseEvent.DELETE_ID_MISSING,
      VenueUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    ...build_target(VenueUseCaseEvent.DELETE_FAILED, { venue_id: id }),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function delete_venues(
  repository: VenueRepository,
  ids: VenueId[],
): AsyncResult<number> {
  if (ids.length === 0) {
    return fail_missing_venue_id(
      VenueUseCaseEvent.BULK_DELETE_IDS_MISSING,
      VenueUseCaseMessage.IDS_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_ids(ids), {
    ...build_target(VenueUseCaseEvent.BULK_DELETE_FAILED, { venue_ids: ids }),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

export function create_venue_use_cases(
  repository: VenueRepository,
): VenueUseCases {
  return {
    list: (filter, options) =>
      list_venues(repository, filter ?? {}, options ?? {}),
    get_by_id: (id) => get_venue_by_id(repository, id),
    create: (input) => create_venue(repository, input),
    update: (id, input) => update_venue(repository, id, input),
    delete: (id) => delete_venue(repository, id),
    delete_venues: (ids) => delete_venues(repository, ids),
  };
}
