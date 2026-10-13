import type {
  IdentificationRepository,
  IdentificationUseCasesPort,
} from "$lib/core/interfaces/ports";

import { create_identification_mutations } from "./IdentificationUseCasesMutations";
import { create_identification_queries } from "./IdentificationUseCasesQueries";

export type IdentificationUseCases = IdentificationUseCasesPort;

export function create_identification_use_cases(
  repository: IdentificationRepository,
): IdentificationUseCases {
  return {
    ...create_identification_mutations(repository),
    ...create_identification_queries(repository),
  };
}
