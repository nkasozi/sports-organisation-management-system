import type {
  CreateQualificationInput,
  Qualification,
  UpdateQualificationInput,
} from "$lib/core/entities/Qualification";
import { validate_qualification_input } from "$lib/core/entities/Qualification";
import type {
  QualificationRepository,
  QualificationUseCasesPort,
} from "$lib/core/interfaces/ports";
import type { AsyncResult, Result } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  QualificationUseCaseEvent,
  QualificationUseCaseMessage,
} from "./QualificationUseCasesConstants";
import {
  fail_qualification_validation,
  forward_qualification_result,
} from "./QualificationUseCasesFailures";

type QualificationId = Qualification["id"];

async function create_qualification(
  repository: QualificationRepository,
  input: CreateQualificationInput,
): AsyncResult<Qualification> {
  const validation_errors = validate_qualification_input(input);
  if (validation_errors.length > 0) {
    return fail_qualification_validation(
      {
        event: QualificationUseCaseEvent.CREATE_VALIDATION_FAILED,
        context: {},
      },
      validation_errors,
    );
  }
  return forward_qualification_result(await repository.create(input), {
    event: QualificationUseCaseEvent.CREATE_FAILED,
    context: {},
  });
}

function validate_merged_qualification(
  id: QualificationId,
  existing: Qualification,
  input: UpdateQualificationInput,
): Result<CreateQualificationInput> {
  const merged_input: CreateQualificationInput = { ...existing, ...input };
  const validation_errors = validate_qualification_input(merged_input);
  if (validation_errors.length > 0) {
    return fail_qualification_validation(
      {
        event: QualificationUseCaseEvent.UPDATE_VALIDATION_FAILED,
        context: { qualification_id: id },
      },
      validation_errors,
    );
  }
  return create_success_result(merged_input);
}

async function update_qualification(
  repository: QualificationRepository,
  id: QualificationId,
  input: UpdateQualificationInput,
): AsyncResult<Qualification> {
  const existing_result = forward_qualification_result(
    await repository.find_by_id(id),
    {
      event: QualificationUseCaseEvent.UPDATE_TARGET_NOT_FOUND,
      code: UseCaseErrorCode.NOT_FOUND,
      context: { qualification_id: id },
      user_message: QualificationUseCaseMessage.NOT_FOUND,
    },
  );
  if (!existing_result.success) {
    return existing_result;
  }
  const merged_result = validate_merged_qualification(
    id,
    existing_result.data,
    input,
  );
  if (!merged_result.success) {
    return merged_result;
  }
  return forward_qualification_result(await repository.update(id, input), {
    event: QualificationUseCaseEvent.UPDATE_FAILED,
    context: { qualification_id: id },
  });
}

async function delete_qualification(
  repository: QualificationRepository,
  id: QualificationId,
): AsyncResult<boolean> {
  return forward_qualification_result(await repository.delete_by_id(id), {
    event: QualificationUseCaseEvent.DELETE_FAILED,
    context: { qualification_id: id },
  });
}

async function get_qualification_by_id(
  repository: QualificationRepository,
  id: QualificationId,
): AsyncResult<Qualification> {
  return forward_qualification_result(await repository.find_by_id(id), {
    event: QualificationUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { qualification_id: id },
  });
}

export function create_qualification_mutations(
  repository: QualificationRepository,
): Pick<
  QualificationUseCasesPort,
  "create" | "update" | "delete" | "get_by_id"
> {
  return {
    create: (input) => create_qualification(repository, input),
    update: (id, input) => update_qualification(repository, id, input),
    delete: (id) => delete_qualification(repository, id),
    get_by_id: (id) => get_qualification_by_id(repository, id),
  };
}
