import type {
  QualificationRepository,
  QualificationUseCasesPort,
} from "$lib/core/interfaces/ports";

import { create_qualification_mutations } from "./QualificationUseCasesMutations";
import { create_qualification_queries } from "./QualificationUseCasesQueries";

export type QualificationUseCases = QualificationUseCasesPort;

export function create_qualification_use_cases(
  repository: QualificationRepository,
): QualificationUseCases {
  return {
    ...create_qualification_mutations(repository),
    ...create_qualification_queries(repository),
  };
}
