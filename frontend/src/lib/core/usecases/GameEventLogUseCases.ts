import type {
  GameEventLogRepository,
  GameEventLogUseCasesPort,
} from "../interfaces/ports";
import { create_game_event_log_mutations } from "./GameEventLogUseCasesMutations";
import { create_game_event_log_queries } from "./GameEventLogUseCasesQueries";
import { create_game_event_log_voiding } from "./GameEventLogUseCasesVoiding";
import { create_game_event_recorder } from "./GameEventRecorderUseCases";

export type GameEventLogUseCases = GameEventLogUseCasesPort;

export function create_game_event_log_use_cases(
  repository: GameEventLogRepository,
): GameEventLogUseCases {
  return {
    ...create_game_event_log_queries(repository),
    ...create_game_event_log_mutations(repository),
    ...create_game_event_log_voiding(repository),
    ...create_game_event_recorder(repository),
  };
}
