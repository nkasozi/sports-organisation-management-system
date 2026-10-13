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
  IdentificationUseCaseEvent,
  IdentificationUseCaseMessage,
} from "./IdentificationUseCasesConstants";
import {
  fail_identification_validation,
  fail_missing_identification_identifier,
  forward_identification_result,
} from "./IdentificationUseCasesFailures";
import { is_blank_identifier } from "./UseCaseResultGuards";

type IdentificationId = ScalarValueInput<Identification["id"]>;

async function create_identification(
  repository: IdentificationRepository,
  input: CreateIdentificationInput,
): AsyncResult<Identification> {
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

async function update_identification(
  repository: IdentificationRepository,
  id: IdentificationId,
  input: UpdateIdentificationInput,
): AsyncResult<Identification> {
  if (is_blank_identifier(id)) {
    return fail_missing_identification_identifier(
      IdentificationUseCaseEvent.UPDATE_ID_MISSING,
    );
  }
  const existing_result = forward_identification_result(
    await repository.find_by_id(id),
    {
      event: IdentificationUseCaseEvent.UPDATE_TARGET_NOT_FOUND,
      code: UseCaseErrorCode.NOT_FOUND,
      context: { identification_id: id },
      user_message: IdentificationUseCaseMessage.NOT_FOUND,
    },
  );
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
  return forward_identification_result(await repository.update(id, input), {
    event: IdentificationUseCaseEvent.UPDATE_FAILED,
    context: { identification_id: id },
  });
}

async function delete_identification(
  repository: IdentificationRepository,
  id: IdentificationId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_identification_identifier(
      IdentificationUseCaseEvent.DELETE_ID_MISSING,
    );
  }
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
): Pick<
  IdentificationUseCasesPort,
  "create" | "update" | "delete" | "get_by_id"
> {
  return {
    create: (input) => create_identification(repository, input),
    update: (id, input) => update_identification(repository, id, input),
    delete: (id) => delete_identification(repository, id),
    get_by_id: (id) => get_identification_by_id(repository, id),
  };
}
