import type {
  CreateProfileLinkInput,
  ProfileLink,
  UpdateProfileLinkInput,
} from "$lib/core/entities/ProfileLink";
import { validate_profile_link_input } from "$lib/core/entities/ProfileLink";
import type {
  ProfileLinkFilter,
  ProfileLinkRepository,
  QueryOptions,
} from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  PROFILE_LINK_USE_CASES_LOG_SCOPE,
  ProfileLinkUseCaseEvent,
  ProfileLinkUseCaseMessage,
} from "./ProfileLinkUseCasesConstants";
import {
  fail_missing_identifier,
  fail_validation,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

type ProfileLinkId = ScalarValueInput<ProfileLink["id"]>;
type ProfileId = ScalarValueInput<ProfileLink["profile_id"]>;
type ProfileLinkListFilter = ProfileLinkFilter | Record<string, string>;

export interface ProfileLinkUseCases {
  list(
    filter?: ProfileLinkFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ProfileLink>;
  get_by_id(id: ScalarValueInput<ProfileLink["id"]>): AsyncResult<ProfileLink>;
  create(input: CreateProfileLinkInput): AsyncResult<ProfileLink>;
  update(
    id: ScalarValueInput<ProfileLink["id"]>,
    input: UpdateProfileLinkInput,
  ): AsyncResult<ProfileLink>;
  delete(id: ScalarValueInput<ProfileLink["id"]>): AsyncResult<boolean>;
  list_by_profile(
    profile_id: ScalarValueInput<ProfileLink["profile_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ProfileLink>;
}

function fail_missing_link_id(
  event: string,
): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier({
    log_scope: PROFILE_LINK_USE_CASES_LOG_SCOPE,
    event,
    context: {},
    user_message: ProfileLinkUseCaseMessage.ID_REQUIRED,
  });
}

function build_profile_link_filter(
  filter: ProfileLinkListFilter | undefined,
): ProfileLinkFilter {
  if (!filter) {
    return {};
  }
  return {
    ...(filter.profile_id
      ? { profile_id: filter.profile_id as ProfileLink["profile_id"] }
      : {}),
    ...(filter.platform ? { platform: filter.platform } : {}),
    ...(filter.status
      ? { status: filter.status as ProfileLink["status"] }
      : {}),
  };
}

async function list_profile_links(
  repository: ProfileLinkRepository,
  filter: ProfileLinkListFilter | undefined,
  options: QueryOptions | undefined,
): PaginatedAsyncResult<ProfileLink> {
  const result = await repository.find_all(
    build_profile_link_filter(filter),
    options ?? {},
  );
  return forward_dependency_result(result, {
    log_scope: PROFILE_LINK_USE_CASES_LOG_SCOPE,
    event: ProfileLinkUseCaseEvent.LIST_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: {},
  });
}

async function get_profile_link_by_id(
  repository: ProfileLinkRepository,
  id: ProfileLinkId,
): AsyncResult<ProfileLink> {
  if (is_blank_identifier(id)) {
    return fail_missing_link_id(ProfileLinkUseCaseEvent.GET_ID_MISSING);
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    log_scope: PROFILE_LINK_USE_CASES_LOG_SCOPE,
    event: ProfileLinkUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { profile_link_id: id },
  });
}

async function create_profile_link(
  repository: ProfileLinkRepository,
  input: CreateProfileLinkInput,
): AsyncResult<ProfileLink> {
  const context = { profile_id: input.profile_id };
  const validation_errors = validate_profile_link_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      {
        log_scope: PROFILE_LINK_USE_CASES_LOG_SCOPE,
        event: ProfileLinkUseCaseEvent.CREATE_VALIDATION_FAILED,
        context,
      },
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.create(input), {
    log_scope: PROFILE_LINK_USE_CASES_LOG_SCOPE,
    event: ProfileLinkUseCaseEvent.CREATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context,
  });
}

async function update_profile_link(
  repository: ProfileLinkRepository,
  id: ProfileLinkId,
  input: UpdateProfileLinkInput,
): AsyncResult<ProfileLink> {
  if (is_blank_identifier(id)) {
    return fail_missing_link_id(ProfileLinkUseCaseEvent.UPDATE_ID_MISSING);
  }
  return forward_dependency_result(await repository.update(id, input), {
    log_scope: PROFILE_LINK_USE_CASES_LOG_SCOPE,
    event: ProfileLinkUseCaseEvent.UPDATE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { profile_link_id: id },
  });
}

async function delete_profile_link(
  repository: ProfileLinkRepository,
  id: ProfileLinkId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_link_id(ProfileLinkUseCaseEvent.DELETE_ID_MISSING);
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    log_scope: PROFILE_LINK_USE_CASES_LOG_SCOPE,
    event: ProfileLinkUseCaseEvent.DELETE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { profile_link_id: id },
  });
}

async function list_profile_links_by_profile(
  repository: ProfileLinkRepository,
  profile_id: ProfileId,
  options: QueryOptions | undefined,
): PaginatedAsyncResult<ProfileLink> {
  const result = await repository.find_by_profile_id(profile_id, options ?? {});
  return forward_dependency_result(result, {
    log_scope: PROFILE_LINK_USE_CASES_LOG_SCOPE,
    event: ProfileLinkUseCaseEvent.LIST_BY_PROFILE_FAILED,
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    context: { profile_id },
  });
}

export function create_profile_link_use_cases(
  repository: ProfileLinkRepository,
): ProfileLinkUseCases {
  return {
    list: (filter, options) => list_profile_links(repository, filter, options),
    get_by_id: (id) => get_profile_link_by_id(repository, id),
    create: (input) => create_profile_link(repository, input),
    update: (id, input) => update_profile_link(repository, id, input),
    delete: (id) => delete_profile_link(repository, id),
    list_by_profile: (profile_id, options) =>
      list_profile_links_by_profile(repository, profile_id, options),
  };
}
