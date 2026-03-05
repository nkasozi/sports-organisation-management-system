import type { Repository } from "./Repository";
import type { AsyncResult } from "../../../../types/Result";
import type {
  GameEventType,
  CreateGameEventTypeInput,
  UpdateGameEventTypeInput,
  EventCategory,
} from "../../../../entities/GameEventType";

export interface GameEventTypeFilter {
  name_contains?: string;
  code?: string;
  sport_id?: string | null;
  category?: EventCategory;
  affects_score?: boolean;
  requires_player?: boolean;
  status?: GameEventType["status"];
}

export interface GameEventTypeRepository extends Repository<
  GameEventType,
  CreateGameEventTypeInput,
  UpdateGameEventTypeInput,
  GameEventTypeFilter
> {
  find_by_sport(sport_id: string | null): AsyncResult<GameEventType[]>;
  find_by_category(category: EventCategory): AsyncResult<GameEventType[]>;
  find_by_code(code: string): AsyncResult<GameEventType | null>;
  find_scoring_events(): AsyncResult<GameEventType[]>;
}

export type {
  GameEventType,
  CreateGameEventTypeInput,
  UpdateGameEventTypeInput,
};
