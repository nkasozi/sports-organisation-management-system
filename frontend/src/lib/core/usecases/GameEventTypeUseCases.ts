import type {
  GameEventTypeRepository,
  GameEventTypeUseCasesPort,
} from "../interfaces/ports";
import { create_game_event_type_mutations } from "./GameEventTypeUseCasesMutations";
import { create_game_event_type_queries } from "./GameEventTypeUseCasesQueries";

export type GameEventTypeUseCases = GameEventTypeUseCasesPort;

export function create_game_event_type_use_cases(
  repository: GameEventTypeRepository,
): GameEventTypeUseCases {
  return {
    ...create_game_event_type_queries(repository),
    ...create_game_event_type_mutations(repository),
  };
}
