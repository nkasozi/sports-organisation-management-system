import type {
  CreateOrganizationSettingsInput,
  OrganizationSettings,
  UpdateOrganizationSettingsInput,
} from "../entities/OrganizationSettings";
import { validate_organization_settings_input } from "../entities/OrganizationSettings";
import type { OrganizationSettingsRepository } from "../interfaces/ports/external/repositories/OrganizationSettingsRepository";
import type { OrganizationSettingsUseCasesPort } from "../interfaces/ports/internal/usecases/OrganizationSettingsUseCasesPort";
import type { AsyncResult } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  ORGANIZATION_SETTINGS_USE_CASES_LOG_SCOPE,
  OrganizationSettingsLookupStatus,
  OrganizationSettingsUseCaseEvent,
  OrganizationSettingsUseCaseMessage,
} from "./OrganizationSettingsUseCasesConstants";
import type { OrganizationSettingsLookup } from "./OrganizationSettingsUseCasesLookup";
import {
  build_default_create_input,
  build_organization_settings_target,
  lookup_organization_settings,
} from "./OrganizationSettingsUseCasesLookup";
import type { OrganizationId } from "./OrganizationSettingsUseCasesQueries";
import {
  fail_missing_id,
  get_by_organization_id,
  is_write_permitted,
  reject_unauthorized_write,
} from "./OrganizationSettingsUseCasesQueries";
import {
  fail_validation,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

async function save_settings(
  repository: OrganizationSettingsRepository,
  caller_role: string,
  input: CreateOrganizationSettingsInput,
): AsyncResult<OrganizationSettings> {
  if (!is_write_permitted(caller_role)) {
    return reject_unauthorized_write(
      OrganizationSettingsUseCaseEvent.SAVE_PERMISSION_DENIED,
    );
  }
  const context = { organization_id: input.organization_id };
  const validation_errors = validate_organization_settings_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      build_organization_settings_target(
        OrganizationSettingsUseCaseEvent.SAVE_VALIDATION_FAILED,
        context,
      ),
      validation_errors,
    );
  }
  console.log(ORGANIZATION_SETTINGS_USE_CASES_LOG_SCOPE, {
    event: OrganizationSettingsUseCaseEvent.SAVE_REQUESTED,
    ...context,
    caller_role,
  });
  return forward_dependency_result(await repository.create(input), {
    ...build_organization_settings_target(
      OrganizationSettingsUseCaseEvent.SAVE_FAILED,
      context,
    ),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function update_settings(
  repository: OrganizationSettingsRepository,
  caller_role: string,
  id: OrganizationSettings["id"],
  input: UpdateOrganizationSettingsInput,
): AsyncResult<OrganizationSettings> {
  if (!is_write_permitted(caller_role)) {
    return reject_unauthorized_write(
      OrganizationSettingsUseCaseEvent.UPDATE_PERMISSION_DENIED,
    );
  }
  if (is_blank_identifier(id)) {
    return fail_missing_id(
      OrganizationSettingsUseCaseEvent.UPDATE_ID_MISSING,
      OrganizationSettingsUseCaseMessage.SETTINGS_ID_REQUIRED,
    );
  }
  console.log(ORGANIZATION_SETTINGS_USE_CASES_LOG_SCOPE, {
    event: OrganizationSettingsUseCaseEvent.UPDATE_REQUESTED,
    settings_id: id,
    caller_role,
  });
  return forward_dependency_result(await repository.update(id, input), {
    ...build_organization_settings_target(
      OrganizationSettingsUseCaseEvent.UPDATE_FAILED,
      { settings_id: id },
    ),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

function persist_for_lookup(
  repository: OrganizationSettingsRepository,
  caller_role: string,
  organization_id: OrganizationId,
  lookup: OrganizationSettingsLookup,
  input: UpdateOrganizationSettingsInput,
): AsyncResult<OrganizationSettings> {
  switch (lookup.status) {
    case OrganizationSettingsLookupStatus.FOUND:
      return update_settings(
        repository,
        caller_role,
        lookup.settings.id,
        input,
      );
    case OrganizationSettingsLookupStatus.MISSING:
      return save_settings(
        repository,
        caller_role,
        build_default_create_input(organization_id, input),
      );
  }
}

async function save_or_update(
  repository: OrganizationSettingsRepository,
  caller_role: string,
  organization_id: OrganizationId,
  input: UpdateOrganizationSettingsInput,
): AsyncResult<OrganizationSettings> {
  if (!is_write_permitted(caller_role)) {
    return reject_unauthorized_write(
      OrganizationSettingsUseCaseEvent.SAVE_OR_UPDATE_PERMISSION_DENIED,
    );
  }
  if (is_blank_identifier(organization_id)) {
    return fail_missing_id(
      OrganizationSettingsUseCaseEvent.SAVE_OR_UPDATE_ID_MISSING,
      OrganizationSettingsUseCaseMessage.ORGANIZATION_ID_REQUIRED,
    );
  }
  const lookup_result = await lookup_organization_settings(
    repository,
    organization_id,
  );
  if (!lookup_result.success) {
    return lookup_result;
  }
  return persist_for_lookup(
    repository,
    caller_role,
    organization_id,
    lookup_result.data,
    input,
  );
}

export function create_organization_settings_use_cases(
  repository: OrganizationSettingsRepository,
): OrganizationSettingsUseCasesPort {
  return {
    get_by_organization_id: (organization_id: OrganizationId) =>
      get_by_organization_id(repository, organization_id),
    save_settings: (caller_role, input) =>
      save_settings(repository, caller_role, input),
    update_settings: (caller_role, id: OrganizationSettings["id"], input) =>
      update_settings(repository, caller_role, id, input),
    save_or_update: (caller_role, organization_id: OrganizationId, input) =>
      save_or_update(repository, caller_role, organization_id, input),
  };
}
