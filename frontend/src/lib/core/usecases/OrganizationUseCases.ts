import type {
  CreateOrganizationInput,
  Organization,
  UpdateOrganizationInput,
} from "../entities/Organization";
import { validate_organization_input } from "../entities/Organization";
import type {
  OrganizationRepository,
  OrganizationUseCasesPort,
} from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  ORGANIZATION_USE_CASES_LOG_SCOPE,
  OrganizationUseCaseEvent,
  OrganizationUseCaseMessage,
} from "./OrganizationUseCasesConstants";
import type { OrganizationId } from "./OrganizationUseCasesQueries";
import {
  build_target,
  fail_missing_organization_id,
  get_organization_by_id,
  list_organizations,
} from "./OrganizationUseCasesQueries";
import {
  fail_validation,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type OrganizationUseCases = OrganizationUseCasesPort;

async function create_organization(
  repository: OrganizationRepository,
  input: CreateOrganizationInput,
): AsyncResult<Organization> {
  const validation_errors = validate_organization_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      build_target(OrganizationUseCaseEvent.CREATE_VALIDATION_FAILED, {}),
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.create(input), {
    ...build_target(OrganizationUseCaseEvent.CREATE_FAILED, {}),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function update_organization(
  repository: OrganizationRepository,
  id: OrganizationId,
  input: UpdateOrganizationInput,
): AsyncResult<Organization> {
  if (is_blank_identifier(id)) {
    return fail_missing_organization_id(
      OrganizationUseCaseEvent.UPDATE_ID_MISSING,
      OrganizationUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.update(id, input), {
    ...build_target(OrganizationUseCaseEvent.UPDATE_FAILED, {
      organization_id: id,
    }),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function delete_organization(
  repository: OrganizationRepository,
  id: OrganizationId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_organization_id(
      OrganizationUseCaseEvent.DELETE_ID_MISSING,
      OrganizationUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    ...build_target(OrganizationUseCaseEvent.DELETE_FAILED, {
      organization_id: id,
    }),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function delete_organizations(
  repository: OrganizationRepository,
  ids: OrganizationId[],
): AsyncResult<number> {
  if (ids.length === 0) {
    return fail_missing_organization_id(
      OrganizationUseCaseEvent.BULK_DELETE_IDS_MISSING,
      OrganizationUseCaseMessage.IDS_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_ids(ids), {
    ...build_target(OrganizationUseCaseEvent.BULK_DELETE_FAILED, {
      organization_ids: ids,
    }),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

export function create_organization_use_cases(
  repository: OrganizationRepository,
): OrganizationUseCases {
  return {
    list: (filter, options) =>
      list_organizations(repository, filter ?? {}, options ?? {}),
    get_by_id: (id) => get_organization_by_id(repository, id),
    create: (input) => create_organization(repository, input),
    update: (id, input) => update_organization(repository, id, input),
    delete: (id) => delete_organization(repository, id),
    delete_organizations: (ids) => delete_organizations(repository, ids),
  };
}

type OrganizationDefaultSeeder = (
  organization_id: OrganizationId,
) => Promise<void>;

function log_seed_defaults_failure(
  organization_id: OrganizationId,
  error: unknown,
): void {
  console.error(ORGANIZATION_USE_CASES_LOG_SCOPE, {
    event: OrganizationUseCaseEvent.SEED_DEFAULTS_FAILED,
    error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
    technical_detail: String(error),
    organization_id,
  });
}

async function create_organization_and_seed_defaults(
  base: OrganizationUseCases,
  seed_defaults: OrganizationDefaultSeeder,
  input: CreateOrganizationInput,
): AsyncResult<Organization> {
  const result = await base.create(input);
  if (!result.success) {
    return result;
  }
  const organization_id = result.data.id;
  seed_defaults(organization_id).catch((error: unknown) =>
    log_seed_defaults_failure(organization_id, error),
  );
  return result;
}

export function create_organization_use_cases_with_default_seeder(
  org_repo: OrganizationRepository,
  seed_defaults: OrganizationDefaultSeeder,
): OrganizationUseCases {
  const base = create_organization_use_cases(org_repo);
  return {
    ...base,
    create: (input) =>
      create_organization_and_seed_defaults(base, seed_defaults, input),
  };
}
