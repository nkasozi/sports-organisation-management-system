import type { Repository } from "./Repository";
import type {
  GameEventType,
  CreateGameEventTypeInput,
  UpdateGameEventTypeInput,
  EventCategory,
} from "../../entities/GameEventType";

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
  UpdateGameEventTypeInput
> {
  find_by_sport(sport_id: string | null): Promise<GameEventType[]>;
  find_by_category(category: EventCategory): Promise<GameEventType[]>;
  find_by_code(code: string): Promise<GameEventType | null>;
  find_scoring_events(): Promise<GameEventType[]>;
}

export type {
  GameEventType,
  CreateGameEventTypeInput,
  UpdateGameEventTypeInput,
};
