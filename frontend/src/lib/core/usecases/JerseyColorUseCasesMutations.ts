import type {
  CreateJerseyColorInput,
  JerseyColor,
  UpdateJerseyColorInput,
} from "$lib/core/entities/JerseyColor";
import { validate_jersey_color_input } from "$lib/core/entities/JerseyColor";
import type {
  JerseyColorRepository,
  JerseyColorUseCasesPort,
} from "$lib/core/interfaces/ports";
import type { AsyncResult, Result } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  JerseyColorUseCaseEvent,
  JerseyColorUseCaseMessage,
} from "./JerseyColorUseCasesConstants";
import {
  fail_jersey_color_validation,
  fail_missing_jersey_color_identifier,
  forward_jersey_color_result,
} from "./JerseyColorUseCasesFailures";
import { is_blank_identifier } from "./UseCaseResultGuards";

type JerseyColorId = JerseyColor["id"];

async function create_jersey_color(
  repository: JerseyColorRepository,
  input: CreateJerseyColorInput,
): AsyncResult<JerseyColor> {
  const validation_errors = validate_jersey_color_input(input);
  if (validation_errors.length > 0) {
    return fail_jersey_color_validation(
      { event: JerseyColorUseCaseEvent.CREATE_VALIDATION_FAILED, context: {} },
      validation_errors,
    );
  }
  return forward_jersey_color_result(await repository.create(input), {
    event: JerseyColorUseCaseEvent.CREATE_FAILED,
    context: {},
  });
}

function validate_merged_jersey_color(
  id: JerseyColorId,
  existing: JerseyColor,
  input: UpdateJerseyColorInput,
): Result<CreateJerseyColorInput> {
  const merged_input: CreateJerseyColorInput = { ...existing, ...input };
  const validation_errors = validate_jersey_color_input(merged_input);
  if (validation_errors.length > 0) {
    return fail_jersey_color_validation(
      {
        event: JerseyColorUseCaseEvent.UPDATE_VALIDATION_FAILED,
        context: { jersey_color_id: id },
      },
      validation_errors,
    );
  }
  return create_success_result(merged_input);
}

async function update_jersey_color(
  repository: JerseyColorRepository,
  id: JerseyColorId,
  input: UpdateJerseyColorInput,
): AsyncResult<JerseyColor> {
  if (is_blank_identifier(id)) {
    return fail_missing_jersey_color_identifier(
      JerseyColorUseCaseEvent.UPDATE_ID_MISSING,
    );
  }
  const existing_result = forward_jersey_color_result(
    await repository.find_by_id(id),
    {
      event: JerseyColorUseCaseEvent.UPDATE_TARGET_NOT_FOUND,
      code: UseCaseErrorCode.NOT_FOUND,
      context: { jersey_color_id: id },
      user_message: JerseyColorUseCaseMessage.NOT_FOUND,
    },
  );
  if (!existing_result.success) {
    return existing_result;
  }
  const merged_result = validate_merged_jersey_color(
    id,
    existing_result.data,
    input,
  );
  if (!merged_result.success) {
    return merged_result;
  }
  return forward_jersey_color_result(await repository.update(id, input), {
    event: JerseyColorUseCaseEvent.UPDATE_FAILED,
    context: { jersey_color_id: id },
  });
}

async function delete_jersey_color(
  repository: JerseyColorRepository,
  id: JerseyColorId,
): AsyncResult<boolean> {
  if (is_blank_identifier(id)) {
    return fail_missing_jersey_color_identifier(
      JerseyColorUseCaseEvent.DELETE_ID_MISSING,
    );
  }
  return forward_jersey_color_result(await repository.delete_by_id(id), {
    event: JerseyColorUseCaseEvent.DELETE_FAILED,
    context: { jersey_color_id: id },
  });
}

async function get_jersey_color_by_id(
  repository: JerseyColorRepository,
  id: JerseyColorId,
): AsyncResult<JerseyColor> {
  if (is_blank_identifier(id)) {
    return fail_missing_jersey_color_identifier(
      JerseyColorUseCaseEvent.GET_ID_MISSING,
    );
  }
  return forward_jersey_color_result(await repository.find_by_id(id), {
    event: JerseyColorUseCaseEvent.GET_FAILED,
    code: UseCaseErrorCode.NOT_FOUND,
    context: { jersey_color_id: id },
  });
}

export function create_jersey_color_mutations(
  repository: JerseyColorRepository,
): Pick<JerseyColorUseCasesPort, "create" | "update" | "delete" | "get_by_id"> {
  return {
    create: (input) => create_jersey_color(repository, input),
    update: (id, input) => update_jersey_color(repository, id, input),
    delete: (id) => delete_jersey_color(repository, id),
    get_by_id: (id) => get_jersey_color_by_id(repository, id),
  };
}
