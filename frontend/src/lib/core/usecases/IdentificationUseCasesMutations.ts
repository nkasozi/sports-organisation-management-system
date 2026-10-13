import type {
  CreateIdentificationInput,
  Identification,
  UpdateIdentificationInput,
} from "$lib/core/entities/Identification";
import { validate_identification_input } from "$lib/core/entities/Identification";
import type {
  IdentificationRepository,
  IdentificationUseCasesPort,
} from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult, Result } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  check_identification_write_access,
  type IdentificationActorProvider,
} from "./IdentificationUseCasesAccess";
import {
  IdentificationUseCaseEvent,
  IdentificationUseCaseMessage,
} from "./IdentificationUseCasesConstants";
import {
  authorize_identification_delete,
  type IdentificationMutationDependencies,
  NO_EXISTING_RECORD,
} from "./IdentificationUseCasesDeleteAccess";
import {
  fail_identification_validation,
  fail_missing_identification_identifier,
  forward_identification_result,
} from "./IdentificationUseCasesFailures";
import { is_blank_identifier } from "./UseCaseResultGuards";

type IdentificationId = ScalarValueInput<Identification["id"]>;

async function create_identification(
  { repository, get_actor }: IdentificationMutationDependencies,
  input: CreateIdentificationInput,
): AsyncResult<Identification> {
  const access_result = check_identification_write_access({
    actor: get_actor(),
    action: "create",
    records: [input],
    incoming_record: input,
    existing_record: NO_EXISTING_RECORD,
  });
  if (!access_result.success) return access_result;
  const validation_errors = validate_identification_input(input);
  if (validation_errors.length > 0) {
    return fail_identification_validation(
      {
        event: IdentificationUseCaseEvent.CREATE_VALIDATION_FAILED,
        context: {},
      },
      validation_errors,
    );
  }
  return forward_identification_result(await repository.create(input), {
    event: IdentificationUseCaseEvent.CREATE_FAILED,
    context: {},
  });
}

function validate_merged_identification(
  id: IdentificationId,
  existing: Identification,
  input: UpdateIdentificationInput,
): Result<CreateIdentificationInput> {
  const merged_input: CreateIdentificationInput = { ...existing, ...input };
  const validation_errors = validate_identification_input(merged_input);
  if (validation_errors.length > 0) {
    return fail_identification_validation(
      {
        event: IdentificationUseCaseEvent.UPDATE_VALIDATION_FAILED,
        context: { identification_id: id },
      },
      validation_errors,
    );
  }
  return create_success_result(merged_input);
}

async function load_identification_to_update(
  repository: IdentificationRepository,
  id: IdentificationId,
): AsyncResult<Identification> {
  return forward_identification_result(await repository.find_by_id(id), {
    event: IdentificationUseCaseEvent.UPDATE_TARGET_NOT_FOUND,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { identification_id: id },
    user_message: IdentificationUseCaseMessage.NOT_FOUND,
  });
}

async function update_identification(
  { repository, get_actor }: IdentificationMutationDependencies,
  id: IdentificationId,
  input: UpdateIdentificationInput,
): AsyncResult<Identification> {
  if (is_blank_identifier(id)) {
    return fail_missing_identification_identifier(
      IdentificationUseCaseEvent.UPDATE_ID_MISSING,
    );
  }
  const existing_result = await load_identification_to_update(repository, id);
  if (!existing_result.success) {
    return existing_result;
  }
  const merged_result = validate_merged_identification(
    id,
    existing_result.data,
    input,
  );
  if (!merged_result.success) {
    return merged_result;
  }
  const access_result = check_identification_write_access({
    actor: get_actor(),
    action: "update",
    records: [existing_result.data, merged_result.data],
    incoming_record: input,
    existing_record: existing_result.data,
  });
  if (!access_result.success) return access_result;
  return forward_identification_result(await repository.update(id, input), {
    event: IdentificationUseCaseEvent.UPDATE_FAILED,
    context: { identification_id: id },
  });
}

async function delete_identification(
  dependencies: IdentificationMutationDependencies,
  id: IdentificationId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_identification_identifier(
      IdentificationUseCaseEvent.DELETE_ID_MISSING,
    );
  }
  const access_result = await authorize_identification_delete(dependencies, id);
  if (!access_result.success) return access_result;
  const { repository } = dependencies;
  return forward_identification_result(await repository.delete_by_id(id), {
    event: IdentificationUseCaseEvent.DELETE_FAILED,
    context: { identification_id: id },
  });
}

async function get_identification_by_id(
  repository: IdentificationRepository,
  id: IdentificationId,
): AsyncResult<Identification> {
  if (is_blank_identifier(id)) {
    return fail_missing_identification_identifier(
      IdentificationUseCaseEvent.GET_ID_MISSING,
    );
  }
  return forward_identification_result(await repository.find_by_id(id), {
    event: IdentificationUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { identification_id: id },
  });
}

export function create_identification_mutations(
  repository: IdentificationRepository,
  get_actor: IdentificationActorProvider,
): Pick<
  IdentificationUseCasesPort,
  "create" | "update" | "delete" | "get_by_id"
> {
  const dependencies = { repository, get_actor };
  return {
    create: (input) => create_identification(dependencies, input),
    update: (id, input) => update_identification(dependencies, id, input),
    delete: (id) => delete_identification(dependencies, id),
    get_by_id: (id) => get_identification_by_id(repository, id),
  };
}
