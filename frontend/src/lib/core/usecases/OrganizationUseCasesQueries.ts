import type { Organization } from "../entities/Organization";
import type {
  OrganizationFilter,
  OrganizationRepository,
  QueryOptions,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  ORGANIZATION_USE_CASES_LOG_SCOPE,
  OrganizationUseCaseEvent,
  OrganizationUseCaseMessage,
} from "./OrganizationUseCasesConstants";
import type { UseCaseFailureTarget } from "./UseCaseResultGuards";
import {
  fail_missing_identifier,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type OrganizationId = ScalarValueInput<Organization["id"]>;

export function build_target(
  event: string,
  context: Record<string, unknown>,
): UseCaseFailureTarget {
  return { log_scope: ORGANIZATION_USE_CASES_LOG_SCOPE, event, context };
}

export function fail_missing_organization_id(
  event: string,
  user_message: string,
): ReturnType<typeof fail_missing_identifier> {
  return fail_missing_identifier({ ...build_target(event, {}), user_message });
}

export async function list_organizations(
  repository: OrganizationRepository,
  filter: OrganizationFilter,
  options: QueryOptions,
): PaginatedAsyncResult<Organization> {
  return forward_dependency_result(await repository.find_all(filter, options), {
    ...build_target(OrganizationUseCaseEvent.LIST_FAILED, {}),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

export async function get_organization_by_id(
  repository: OrganizationRepository,
  id: OrganizationId,
): AsyncResult<Organization> {
  if (is_blank_identifier(id)) {
    return fail_missing_organization_id(
      OrganizationUseCaseEvent.GET_ID_MISSING,
      OrganizationUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.find_by_id(id), {
    ...build_target(OrganizationUseCaseEvent.GET_FAILED, {
      organization_id: id,
    }),
    code: UseCaseErrorCode.NOT_FOUND,
  });
}
