import type {
  CreateIdentificationTypeInput,
  IdentificationType,
  UpdateIdentificationTypeInput,
} from "$lib/core/entities/IdentificationType";
import { validate_identification_type_input } from "$lib/core/entities/IdentificationType";
import type {
  IdentificationTypeRepository,
  IdentificationTypeUseCasesPort,
} from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult, Result } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  IdentificationTypeUseCaseEvent,
  IdentificationTypeUseCaseMessage,
} from "./IdentificationTypeUseCasesConstants";
import {
  fail_identification_type_validation,
  fail_missing_identification_type_identifier,
  forward_identification_type_result,
} from "./IdentificationTypeUseCasesFailures";
import { is_blank_identifier } from "./UseCaseResultGuards";

type IdentificationTypeId = ScalarValueInput<IdentificationType["id"]>;

async function create_identification_type(
  repository: IdentificationTypeRepository,
  input: CreateIdentificationTypeInput,
): AsyncResult<IdentificationType> {
  const validation_errors = validate_identification_type_input(input);
  if (validation_errors.length > 0) {
    return fail_identification_type_validation(
      {
        event: IdentificationTypeUseCaseEvent.CREATE_VALIDATION_FAILED,
        context: {},
      },
      validation_errors,
    );
  }
  return forward_identification_type_result(await repository.create(input), {
    event: IdentificationTypeUseCaseEvent.CREATE_FAILED,
    context: {},
  });
}

function validate_merged_identification_type(
  id: IdentificationTypeId,
  existing: IdentificationType,
  input: UpdateIdentificationTypeInput,
): Result<CreateIdentificationTypeInput> {
  const merged_input: CreateIdentificationTypeInput = { ...existing, ...input };
  const validation_errors = validate_identification_type_input(merged_input);
  if (validation_errors.length > 0) {
    return fail_identification_type_validation(
      {
        event: IdentificationTypeUseCaseEvent.UPDATE_VALIDATION_FAILED,
        context: { identification_type_id: id },
      },
      validation_errors,
    );
  }
  return create_success_result(merged_input);
}

async function update_identification_type(
  repository: IdentificationTypeRepository,
  id: IdentificationTypeId,
  input: UpdateIdentificationTypeInput,
): AsyncResult<IdentificationType> {
  if (is_blank_identifier(id)) {
    return fail_missing_identification_type_identifier(
      IdentificationTypeUseCaseEvent.UPDATE_ID_MISSING,
    );
  }
  const existing_result = forward_identification_type_result(
    await repository.find_by_id(id),
    {
      event: IdentificationTypeUseCaseEvent.UPDATE_TARGET_NOT_FOUND,
      code: UseCaseErrorCode.NOT_FOUND,
      context: { identification_type_id: id },
      user_message: IdentificationTypeUseCaseMessage.NOT_FOUND,
    },
  );
  if (!existing_result.success) {
    return existing_result;
  }
  const merged_result = validate_merged_identification_type(
    id,
    existing_result.data,
    input,
  );
  if (!merged_result.success) {
    return merged_result;
  }
  return forward_identification_type_result(
    await repository.update(id, input),
    {
      event: IdentificationTypeUseCaseEvent.UPDATE_FAILED,
      context: { identification_type_id: id },
    },
  );
}

async function delete_identification_type(
  repository: IdentificationTypeRepository,
  id: IdentificationTypeId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_identification_type_identifier(
      IdentificationTypeUseCaseEvent.DELETE_ID_MISSING,
    );
  }
  return forward_identification_type_result(await repository.delete_by_id(id), {
    event: IdentificationTypeUseCaseEvent.DELETE_FAILED,
    context: { identification_type_id: id },
  });
}

export function create_identification_type_mutations(
  repository: IdentificationTypeRepository,
): Pick<IdentificationTypeUseCasesPort, "create" | "update" | "delete"> {
  return {
    create: (input) => create_identification_type(repository, input),
    update: (id, input) => update_identification_type(repository, id, input),
    delete: (id) => delete_identification_type(repository, id),
  };
}
