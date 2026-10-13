import type {
  CreateOfficialInput,
  Official,
  UpdateOfficialInput,
} from "../entities/Official";
import { validate_official_input } from "../entities/Official";
import type {
  OfficialRepository,
  OfficialUseCasesPort,
} from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  OfficialUseCaseEvent,
  OfficialUseCaseMessage,
} from "./OfficialUseCasesConstants";
import type { OfficialId } from "./OfficialUseCasesQueries";
import {
  build_official_target,
  fail_missing_official_input,
  get_official_by_id,
  list_available_officials,
  list_officials,
  list_officials_by_organization,
  list_officials_by_role_id,
} from "./OfficialUseCasesQueries";
import {
  fail_validation,
  forward_dependency_result,
  is_blank_identifier,
} from "./UseCaseResultGuards";

export type OfficialUseCases = OfficialUseCasesPort;

async function create_official(
  repository: OfficialRepository,
  input: CreateOfficialInput,
): AsyncResult<Official> {
  const context = { organization_id: input.organization_id };
  const validation_errors = validate_official_input(input);
  if (validation_errors.length > 0) {
    return fail_validation(
      build_official_target(
        OfficialUseCaseEvent.CREATE_VALIDATION_FAILED,
        context,
      ),
      validation_errors,
    );
  }
  return forward_dependency_result(await repository.create(input), {
    ...build_official_target(OfficialUseCaseEvent.CREATE_FAILED, context),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function update_official(
  repository: OfficialRepository,
  id: OfficialId,
  input: UpdateOfficialInput,
): AsyncResult<Official> {
  if (is_blank_identifier(id)) {
    return fail_missing_official_input(
      OfficialUseCaseEvent.UPDATE_ID_MISSING,
      OfficialUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.update(id, input), {
    ...build_official_target(OfficialUseCaseEvent.UPDATE_FAILED, {
      official_id: id,
    }),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function delete_official(
  repository: OfficialRepository,
  id: OfficialId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_official_input(
      OfficialUseCaseEvent.DELETE_ID_MISSING,
      OfficialUseCaseMessage.ID_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_id(id), {
    ...build_official_target(OfficialUseCaseEvent.DELETE_FAILED, {
      official_id: id,
    }),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

async function delete_officials(
  repository: OfficialRepository,
  ids: OfficialId[],
): AsyncResult<number> {
  if (ids.length === 0) {
    return fail_missing_official_input(
      OfficialUseCaseEvent.BULK_DELETE_IDS_MISSING,
      OfficialUseCaseMessage.IDS_REQUIRED,
    );
  }
  return forward_dependency_result(await repository.delete_by_ids(ids), {
    ...build_official_target(OfficialUseCaseEvent.BULK_DELETE_FAILED, {
      official_ids: ids,
    }),
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
  });
}

export function create_official_use_cases(
  repository: OfficialRepository,
): OfficialUseCases {
  return {
    list: (filter, options) =>
      list_officials(repository, filter ?? {}, options ?? {}),
    get_by_id: (id) => get_official_by_id(repository, id),
    create: (input) => create_official(repository, input),
    update: (id, input) => update_official(repository, id, input),
    delete: (id) => delete_official(repository, id),
    delete_officials: (ids) => delete_officials(repository, ids),
    list_officials_by_organization: (organization_id, options) =>
      list_officials_by_organization(
        repository,
        organization_id,
        options ?? {},
      ),
    list_officials_by_role_id: (role_id, options) =>
      list_officials_by_role_id(repository, role_id, options),
    list_available_officials: (date, organization_id, options) =>
      list_available_officials(repository, date, organization_id, options),
  };
}
