import type {
  IdentificationTypeRepository,
  IdentificationTypeUseCasesPort,
} from "$lib/core/interfaces/ports";

import { create_identification_type_mutations } from "./IdentificationTypeUseCasesMutations";
import { create_identification_type_queries } from "./IdentificationTypeUseCasesQueries";

export type IdentificationTypeUseCases = IdentificationTypeUseCasesPort;

export function create_identification_type_use_cases(
  repository: IdentificationTypeRepository,
): IdentificationTypeUseCases {
  return {
    ...create_identification_type_mutations(repository),
    ...create_identification_type_queries(repository),
  };
}
