import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateLiveGameLogInput,
  LiveGameLog,
  UpdateLiveGameLogInput,
} from "../../core/entities/LiveGameLog";
import {
  ENTITY_STATUS,
  GAME_PERIOD,
  GAME_STATUS,
} from "../../core/entities/StatusConstants";
import type {
  LiveGameLogFilter,
  LiveGameLogRepository,
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
} from "./InBrowserRepositoryFilterRules";
import {
  convert_page_pagination_to_query_options,
  map_paginated_items,
  type PagePagination,
  select_first_paginated_item,
} from "./InBrowserRepositoryPagedQueries";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
const ENTITY_PREFIX = "livegame";

const LIVE_GAME_FILTER_RULES: EntityFilterRule<
  LiveGameLog,
  LiveGameLogFilter
>[] = [
  equals_rule("organization_id"),
  equals_rule("fixture_id"),
  equals_rule("game_status"),
  equals_rule("started_by_user_id"),
];

class InBrowserLiveGameLogRepository
  extends InBrowserBaseRepository<
    LiveGameLog,
    CreateLiveGameLogInput,
    UpdateLiveGameLogInput,
    LiveGameLogFilter
  >
  implements LiveGameLogRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<LiveGameLog, string> {
    return this.database.live_game_logs;
  }

  protected create_entity_from_input(
    input: CreateLiveGameLogInput,
    id: LiveGameLog["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): LiveGameLog {
    return {
      id,
      ...timestamps,
      organization_id: input.organization_id,
      fixture_id: input.fixture_id,
      home_lineup_id: input.home_lineup_id || "",
      away_lineup_id: input.away_lineup_id || "",
      current_period: input.current_period || GAME_PERIOD.PRE_GAME,
      current_minute: 0,
      stoppage_time_minutes: 0,
      clock_running: false,
      clock_paused_at_seconds: 0,
      home_team_score: 0,
      away_team_score: 0,
      game_status: input.game_status || GAME_STATUS.PRE_GAME,
      started_at: "",
      ended_at: "",
      started_by_user_id: input.started_by_user_id || "",
      ended_by_user_id: "",
      notes: input.notes || "",
      status: input.status || ENTITY_STATUS.ACTIVE,
    } as LiveGameLog;
  }

  protected apply_updates_to_entity(
    entity: LiveGameLog,
    updates: UpdateLiveGameLogInput,
  ): LiveGameLog {
    const now = new Date().toISOString() as LiveGameLog["started_at"];
    let started_at = entity.started_at;
    let ended_at = entity.ended_at;

    if (
      updates.game_status === GAME_STATUS.IN_PROGRESS &&
      entity.game_status === GAME_STATUS.PRE_GAME
    ) {
      started_at = now;
    }

    if (
      (updates.game_status === GAME_STATUS.COMPLETED ||
        updates.game_status === GAME_STATUS.ABANDONED) &&
      entity.game_status !== GAME_STATUS.COMPLETED &&
      entity.game_status !== GAME_STATUS.ABANDONED
    ) {
      ended_at = now;
    }

    return {
      ...entity,
      ...updates,
      started_at,
      ended_at,
    } as LiveGameLog;
  }

  protected apply_entity_filter(
    entities: LiveGameLog[],
    filter: LiveGameLogFilter,
  ): LiveGameLog[] {
    return apply_entity_filter_rules(entities, filter, LIVE_GAME_FILTER_RULES);
  }

  async get_live_game_log_for_fixture(
    fixture_id: LiveGameLog["fixture_id"],
  ): AsyncResult<LiveGameLog> {
    return select_first_paginated_item(
      await this.find_all({ fixture_id }),
      "No live game log found for this fixture",
    );
  }

  async get_active_games(
    organization_id?: LiveGameLog["organization_id"],
  ): AsyncResult<LiveGameLog[]> {
    const filter: LiveGameLogFilter = organization_id
      ? { organization_id }
      : {};
    return map_paginated_items(await this.find_all(filter), (items) =>
      items
        .filter(
          (l) =>
            l.game_status === GAME_STATUS.IN_PROGRESS ||
            l.game_status === GAME_STATUS.PAUSED,
        )
        .sort(
          (a, b) =>
            new Date(b.started_at || b.created_at).getTime() -
            new Date(a.started_at || a.created_at).getTime(),
        ),
    );
  }

  async find_by_organization(
    organization_id: LiveGameLog["organization_id"],
    options?: PagePagination,
  ): PaginatedAsyncResult<LiveGameLog> {
    return this.find_all(
      { organization_id },
      convert_page_pagination_to_query_options(options),
    );
  }

  async find_completed_games(
    organization_id?: string,
    options?: PagePagination,
  ): PaginatedAsyncResult<LiveGameLog> {
    const filter: LiveGameLogFilter = {
      game_status: GAME_STATUS.COMPLETED,
    };
    if (organization_id) {
      filter.organization_id = organization_id;
    }
    return this.find_all(
      filter,
      convert_page_pagination_to_query_options(options),
    );
  }
}

export const get_live_game_log_repository: () => LiveGameLogRepository =
  create_lazy_repository_accessor(() => new InBrowserLiveGameLogRepository());
