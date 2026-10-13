import type { Official } from "../entities/Official";
import type {
  OfficialFilter,
  OfficialRepository,
  QueryOptions,
} from "../interfaces/ports";
import type {
  EntityId,
  IsoDateString,
  ScalarValueInput,
} from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  OFFICIAL_USE_CASES_LOG_SCOPE,
  OfficialUseCaseEvent,
  OfficialUseCaseMessage,
} from "./OfficialUseCasesConstants";
import type { UseCaseFailureTarget } from "./UseCaseResultGuards";
import {
  fail_missing_identifier,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type OfficialId = ScalarValueInput<Official["id"]>;
type OrganizationId = ScalarValueInput<Official["organization_id"]>;

export function build_official_target(
  event: string,
  context: Record<string, unknown>,
): UseCaseFailureTarget {
  return { log_scope: OFFICIAL_USE_CASES_LOG_SCOPE, event, context };
}

export function fail_missing_official_input(
  event: string,
  user_message: string,
): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier({
    ...build_official_target(event, {}),
    user_message,
  });
}

export async function list_officials(
  repository: OfficialRepository,
  filter: OfficialFilter,
  options: QueryOptions,
): PaginatedAsyncResult<Official> {
  return forward_dependency_result(await repository.find_all(filter, options), {
    ...build_official_target(OfficialUseCaseEvent.LIST_FAILED, {}),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

export async function get_official_by_id(
  repository: OfficialRepository,
  id: OfficialId,
): AsyncResult<Official> {
  if (is_blank_identifier(id)) {
    return fail_missing_official_input(
      OfficialUseCaseEvent.GET_ID_MISSING,
      OfficialUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    ...build_official_target(OfficialUseCaseEvent.GET_FAILED, {
      official_id: id,
    }),
    code: UseCaseErrorCode.NOT_FOUND,
  });
}

export async function list_officials_by_organization(
  repository: OfficialRepository,
  organization_id: OrganizationId,
  options: QueryOptions,
): PaginatedAsyncResult<Official> {
  if (is_blank_identifier(organization_id)) {
    return fail_missing_official_input(
      OfficialUseCaseEvent.LIST_BY_ORGANIZATION_ID_MISSING,
      OfficialUseCaseMessage.ORGANIZATION_ID_REQUIRED,
    );
  }
  const result = await repository.find_by_organization(
    organization_id,
    options,
  );
  return forward_dependency_result(result, {
    ...build_official_target(OfficialUseCaseEvent.LIST_BY_ORGANIZATION_FAILED, {
      organization_id,
    }),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

export async function list_officials_by_role_id(
  repository: OfficialRepository,
  role_id: ScalarValueInput<EntityId>,
  options: QueryOptions | undefined,
): PaginatedAsyncResult<Official> {
  if (is_blank_identifier(role_id)) {
    return fail_missing_official_input(
      OfficialUseCaseEvent.LIST_BY_ROLE_ID_MISSING,
      OfficialUseCaseMessage.ROLE_ID_REQUIRED,
    );
  }
  return forward_dependency_result(
    await repository.find_all({ role_id }, options),
    {
      ...build_official_target(OfficialUseCaseEvent.LIST_BY_ROLE_FAILED, {
        role_id,
      }),
      code: UseCaseErrorCode.DEPENDENCY_FAILED,
    },
  );
}

export async function list_available_officials(
  repository: OfficialRepository,
  date: ScalarValueInput<IsoDateString>,
  organization_id: OrganizationId | undefined,
  options: QueryOptions | undefined,
): PaginatedAsyncResult<Official> {
  if (!date) {
    return fail_missing_official_input(
      OfficialUseCaseEvent.LIST_AVAILABLE_DATE_MISSING,
      OfficialUseCaseMessage.DATE_REQUIRED,
    );
  }
  const result = await repository.find_available_for_date(
    date,
    organization_id,
    options,
  );
  return forward_dependency_result(result, {
    ...build_official_target(OfficialUseCaseEvent.LIST_AVAILABLE_FAILED, {
      organization_id,
    }),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}
