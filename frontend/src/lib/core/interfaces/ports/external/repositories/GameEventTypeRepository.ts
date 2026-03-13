import type { Repository, QueryOptions } from "./Repository";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
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
  organization_id?: string;
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
  find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameEventType>;
}

export type {
  GameEventType,
  CreateGameEventTypeInput,
  UpdateGameEventTypeInput,
};
