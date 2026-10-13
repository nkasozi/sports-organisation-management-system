import type {
  ActivityCategory,
  CreateActivityCategoryInput,
} from "../entities/ActivityCategory";
import { validate_activity_category_input } from "../entities/ActivityCategory";
import type { ActivityCategoryRepository } from "../interfaces/ports";
import type { ActivityCategoryUseCasesPort } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import { ensure_default_categories_exist } from "./ActivityCategoryDefaults";
import {
  ACTIVITY_CATEGORY_EVENT,
  ACTIVITY_CATEGORY_LOG_SCOPE,
  ACTIVITY_CATEGORY_MESSAGE,
} from "./ActivityUseCaseConstants";
import {
  create_log_target_builder,
  fail_missing_identifier,
  fail_validation,
  is_blank_identifier,
  relay_repository_failure,
  relay_repository_result,
} from "./FailureRelay";

type ActivityCategoryUseCases = ActivityCategoryUseCasesPort;

type CategoryId = ScalarValueInput<ActivityCategory["id"]>;

const log_target = create_log_target_builder(ACTIVITY_CATEGORY_LOG_SCOPE);

function fail_missing_category_id(): ReturnType<
  typeof fail_missing_identifier
> {
  return fail_missing_identifier(
    log_target(ACTIVITY_CATEGORY_EVENT.ID_MISSING),
    ACTIVITY_CATEGORY_MESSAGE.ID_REQUIRED,
  );
}

async function create_category(
  repository: ActivityCategoryRepository,
  input: CreateActivityCategoryInput,
): AsyncResult<ActivityCategory> {
  const validation = validate_activity_category_input(input);
  if (!validation.is_valid)
    return fail_validation(
      log_target(ACTIVITY_CATEGORY_EVENT.VALIDATION_FAILED),
      Object.values(validation.errors).join(", "),
    );
  return relay_repository_result(
    repository.create(input),
    log_target(ACTIVITY_CATEGORY_EVENT.CREATE_FAILED),
  );
}

async function delete_category(
  repository: ActivityCategoryRepository,
  id: CategoryId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) return fail_missing_category_id();
  const category_result = await repository.find_by_id(id);
  if (!category_result.success)
    return relay_repository_failure(
      log_target(ACTIVITY_CATEGORY_EVENT.LOOKUP_FAILED, { category_id: id }),
      category_result.error,
    );
  if (category_result.data?.is_system_generated)
    return fail_use_case({
      code: UseCaseErrorCode.PERMISSION_DENIED,
      ...log_target(ACTIVITY_CATEGORY_EVENT.SYSTEM_DELETE_BLOCKED, {
        category_id: id,
      }),
      user_message: ACTIVITY_CATEGORY_MESSAGE.SYSTEM_DELETE_BLOCKED,
    });
  return relay_repository_result(
    repository.delete_by_id(id),
    log_target(ACTIVITY_CATEGORY_EVENT.DELETE_FAILED, { category_id: id }),
  );
}

function create_category_queries(
  repository: ActivityCategoryRepository,
): Pick<
  ActivityCategoryUseCases,
  "list" | "get_by_id" | "list_by_organization"
> {
  return {
    list: async (filter, options) =>
      relay_repository_result(
        repository.find_all(filter ?? {}, options ?? {}),
        log_target(ACTIVITY_CATEGORY_EVENT.LIST_FAILED),
      ),
    get_by_id: async (id) =>
      is_blank_identifier(id)
        ? fail_missing_category_id()
        : relay_repository_result(
            repository.find_by_id(id),
            log_target(ACTIVITY_CATEGORY_EVENT.LOOKUP_FAILED, {
              category_id: id,
            }),
          ),
    list_by_organization: async (organization_id, options) =>
      is_blank_identifier(organization_id)
        ? fail_missing_identifier(
            log_target(ACTIVITY_CATEGORY_EVENT.ORGANIZATION_ID_MISSING),
            ACTIVITY_CATEGORY_MESSAGE.ORGANIZATION_ID_REQUIRED,
          )
        : relay_repository_result(
            repository.find_by_organization(organization_id, options ?? {}),
            log_target(ACTIVITY_CATEGORY_EVENT.LIST_FAILED, {
              organization_id,
            }),
          ),
  };
}

export function create_activity_category_use_cases(
  repository: ActivityCategoryRepository,
): ActivityCategoryUseCases {
  return {
    ...create_category_queries(repository),
    create: (input) => create_category(repository, input),
    update: async (id, input) =>
      is_blank_identifier(id)
        ? fail_missing_category_id()
        : relay_repository_result(
            repository.update(id, input),
            log_target(ACTIVITY_CATEGORY_EVENT.UPDATE_FAILED, {
              category_id: id,
            }),
          ),
    delete: (id) => delete_category(repository, id),
    ensure_default_categories_exist: (organization_id) =>
      ensure_default_categories_exist(repository, organization_id),
  };
}
