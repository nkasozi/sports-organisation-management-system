import type { Identification } from "$lib/core/entities/Identification";
import type { IdentificationRepository } from "$lib/core/interfaces/ports";
import { ENTITY_PERMISSION_SCOPE } from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  check_identification_write_access,
  type IdentificationActorProvider,
  resolve_identification_actor_scope,
} from "./IdentificationUseCasesAccess";
import {
  IdentificationUseCaseEvent,
  IdentificationUseCaseMessage,
} from "./IdentificationUseCasesConstants";
import { forward_identification_result } from "./IdentificationUseCasesFailures";

type IdentificationId = ScalarValueInput<Identification["id"]>;

export const NO_EXISTING_RECORD: object = {};

export interface IdentificationMutationDependencies {
  repository: IdentificationRepository;
  get_actor: IdentificationActorProvider;
}

export async function authorize_identification_delete(
  { repository, get_actor }: IdentificationMutationDependencies,
  id: IdentificationId,
): AsyncResult<true> {
  const actor = get_actor();
  const scope = resolve_identification_actor_scope(actor, "delete");
  if (scope === ENTITY_PERMISSION_SCOPE.ALL_RECORDS)
    return create_success_result(true);
  const existing_result = forward_identification_result(
    await repository.find_by_id(id),
    {
      event: IdentificationUseCaseEvent.DELETE_TARGET_NOT_FOUND,
      code: UseCaseErrorCode.NOT_FOUND,
      context: { identification_id: id },
      user_message: IdentificationUseCaseMessage.NOT_FOUND,
    },
  );
  if (!existing_result.success) return existing_result;
  return check_identification_write_access({
    actor,
    action: "delete",
    records: [existing_result.data],
    incoming_record: NO_EXISTING_RECORD,
    existing_record: existing_result.data,
  });
}
