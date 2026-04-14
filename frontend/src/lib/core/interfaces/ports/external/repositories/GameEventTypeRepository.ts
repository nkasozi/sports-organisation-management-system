import type {
  CreateGameEventTypeInput,
  EventCategory,
  GameEventType,
  UpdateGameEventTypeInput,
} from "../../../../entities/GameEventType";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { QueryOptions, Repository } from "./Repository";

export interface GameEventTypeFilter {
  name_contains?: string;
  code?: string;
  sport_id?: ScalarValueInput<NonNullable<GameEventType["sport_id"]>> | null;
  category?: EventCategory;
  affects_score?: boolean;
  requires_player?: boolean;
  status?: GameEventType["status"];
  organization_id?: ScalarValueInput<GameEventType["organization_id"]>;
}

export interface GameEventTypeRepository extends Repository<
  GameEventType,
  CreateGameEventTypeInput,
  UpdateGameEventTypeInput,
  GameEventTypeFilter
> {
  find_by_sport(
    sport_id: ScalarValueInput<NonNullable<GameEventType["sport_id"]>>,
  ): AsyncResult<GameEventType[]>;
  find_by_category(category: EventCategory): AsyncResult<GameEventType[]>;
  find_by_code(code: string): AsyncResult<GameEventType | null>;
  find_scoring_events(): AsyncResult<GameEventType[]>;
  find_by_organization(
    organization_id: ScalarValueInput<GameEventType["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameEventType>;
}

export type {
  CreateGameEventTypeInput,
  GameEventType,
  UpdateGameEventTypeInput,
};
