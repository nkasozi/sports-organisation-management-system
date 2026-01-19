import type {
  GameEventType,
  CreateGameEventTypeInput,
  UpdateGameEventTypeInput,
  EventCategory,
} from "../../entities/GameEventType";
import type { GameEventTypeFilter } from "../adapters/GameEventTypeRepository";
import type { AsyncResult } from "../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface GameEventTypeUseCasesPort extends BaseUseCasesPort<
  GameEventType,
  CreateGameEventTypeInput,
  UpdateGameEventTypeInput,
  GameEventTypeFilter
> {
  get_event_type_by_code(code: string): AsyncResult<GameEventType | null>;
  list_event_types_for_sport(
    sport_id: string | null,
  ): AsyncResult<GameEventType[]>;
  list_event_types_by_category(
    category: EventCategory,
  ): AsyncResult<GameEventType[]>;
  list_scoring_event_types(): AsyncResult<GameEventType[]>;
}
