import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateGameEventLogInput,
  GameEventLog,
  UpdateGameEventLogInput,
} from "../../core/entities/GameEventLog";
import {
  is_card_event,
  is_scoring_event,
} from "../../core/entities/GameEventLog";
import type {
  GameEventLogFilter,
  GameEventLogRepository,
} from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import {
  apply_entity_filter_rules,
  type EntityFilterRule,
  equals_rule,
  FILTER_RULE_ACTIVATION,
  predicate_rule,
} from "./InBrowserRepositoryFilterRules";
import {
  convert_page_pagination_to_query_options,
  map_paginated_items,
  type PagePagination,
} from "./InBrowserRepositoryPagedQueries";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
const ENTITY_PREFIX = "gameevent";

const EVENT_LOG_FILTER_RULES: EntityFilterRule<
  GameEventLog,
  GameEventLogFilter
>[] = [
  equals_rule("organization_id"),
  equals_rule("live_game_log_id"),
  equals_rule("fixture_id"),
  equals_rule("event_type"),
  equals_rule("team_side"),
  predicate_rule(
    "player_id",
    (event, filter) =>
      event.player_id === filter.player_id ||
      event.secondary_player_id === filter.player_id,
  ),
  equals_rule("voided", FILTER_RULE_ACTIVATION.WHEN_KEY_PRESENT),
];

class InBrowserGameEventLogRepository
  extends InBrowserBaseRepository<
    GameEventLog,
    CreateGameEventLogInput,
    UpdateGameEventLogInput,
    GameEventLogFilter
  >
  implements GameEventLogRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<GameEventLog, string> {
    return this.database.game_event_logs;
  }

  protected create_entity_from_input(
    input: CreateGameEventLogInput,
    id: GameEventLog["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): GameEventLog {
    const now = new Date().toISOString();
    return {
      id,
      ...timestamps,
      organization_id: input.organization_id,
      live_game_log_id: input.live_game_log_id,
      fixture_id: input.fixture_id,
      event_type: input.event_type,
      minute: input.minute,
      stoppage_time_minute: input.stoppage_time_minute,
      team_side: input.team_side,
      player_id: input.player_id || "",
      player_name: input.player_name || "",
      secondary_player_id: input.secondary_player_id || "",
      secondary_player_name: input.secondary_player_name || "",
      description: input.description || "",
      affects_score: input.affects_score || false,
      score_change_home: input.score_change_home || 0,
      score_change_away: input.score_change_away || 0,
      recorded_by_user_id: input.recorded_by_user_id || "",
      recorded_at: now,
      reviewed: false,
      reviewed_by_user_id: "",
      reviewed_at: "",
      voided: false,
      voided_reason: "",
      status: input.status || "active",
    } as GameEventLog;
  }

  protected apply_updates_to_entity(
    entity: GameEventLog,
    updates: UpdateGameEventLogInput,
  ): GameEventLog {
    return { ...entity, ...updates } as GameEventLog;
  }

  protected apply_entity_filter(
    entities: GameEventLog[],
    filter: GameEventLogFilter,
  ): GameEventLog[] {
    return apply_entity_filter_rules(entities, filter, EVENT_LOG_FILTER_RULES);
  }

  async get_events_for_live_game(
    live_game_log_id: GameEventLog["live_game_log_id"],
    options?: PagePagination,
  ): PaginatedAsyncResult<GameEventLog> {
    return this.find_all(
      { live_game_log_id, voided: false },
      convert_page_pagination_to_query_options(options),
    );
  }

  async get_events_for_fixture(
    fixture_id: GameEventLog["fixture_id"],
    options?: PagePagination,
  ): PaginatedAsyncResult<GameEventLog> {
    return this.find_all(
      { fixture_id, voided: false },
      convert_page_pagination_to_query_options(options),
    );
  }

  async get_events_for_player(
    player_id: GameEventLog["player_id"],
    options?: PagePagination,
  ): PaginatedAsyncResult<GameEventLog> {
    return this.find_all(
      { player_id, voided: false },
      convert_page_pagination_to_query_options(options),
    );
  }

  async get_scoring_events_for_live_game(
    live_game_log_id: GameEventLog["live_game_log_id"],
  ): AsyncResult<GameEventLog[]> {
    return map_paginated_items(
      await this.find_all({ live_game_log_id, voided: false }),
      (items) => items.filter((e) => is_scoring_event(e.event_type)),
    );
  }

  async get_card_events_for_live_game(
    live_game_log_id: GameEventLog["live_game_log_id"],
  ): AsyncResult<GameEventLog[]> {
    return map_paginated_items(
      await this.find_all({ live_game_log_id, voided: false }),
      (items) => items.filter((e) => is_card_event(e.event_type)),
    );
  }

  async void_event(
    id: GameEventLog["id"],
    reason: string,
    voided_by_user_id: GameEventLog["reviewed_by_user_id"],
  ): AsyncResult<GameEventLog> {
    return this.update(id, {
      voided: true,
      voided_reason: reason,
      reviewed: true,
      reviewed_by_user_id: voided_by_user_id,
      reviewed_at: new Date().toISOString(),
    });
  }
}

export const get_game_event_log_repository: () => GameEventLogRepository =
  create_lazy_repository_accessor(() => new InBrowserGameEventLogRepository());
