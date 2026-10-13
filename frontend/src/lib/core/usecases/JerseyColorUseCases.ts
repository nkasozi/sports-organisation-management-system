import type {
  JerseyColorRepository,
  JerseyColorUseCasesPort,
} from "$lib/core/interfaces/ports";

import { create_jersey_color_mutations } from "./JerseyColorUseCasesMutations";
import { create_jersey_color_queries } from "./JerseyColorUseCasesQueries";

export type JerseyColorUseCases = JerseyColorUseCasesPort;

export function create_jersey_color_use_cases(
  repository: JerseyColorRepository,
): JerseyColorUseCases {
  return {
    ...create_jersey_color_mutations(repository),
    ...create_jersey_color_queries(repository),
  };
}
