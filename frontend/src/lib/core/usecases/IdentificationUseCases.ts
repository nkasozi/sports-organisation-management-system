import type {
  IdentificationRepository,
  IdentificationUseCasesPort,
} from "$lib/core/interfaces/ports";

import {
  ANONYMOUS_IDENTIFICATION_ACTOR,
  type IdentificationActorProvider,
} from "./IdentificationUseCasesAccess";
import { create_identification_mutations } from "./IdentificationUseCasesMutations";
import { create_identification_queries } from "./IdentificationUseCasesQueries";

export type IdentificationUseCases = IdentificationUseCasesPort;

export function create_identification_use_cases(
  repository: IdentificationRepository,
  get_actor: IdentificationActorProvider = () => ANONYMOUS_IDENTIFICATION_ACTOR,
): IdentificationUseCases {
  return {
    ...create_identification_mutations(repository, get_actor),
    ...create_identification_queries(repository),
  };
}
