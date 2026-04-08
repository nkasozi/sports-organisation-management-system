import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreatePlayerInput,
  Player,
  UpdatePlayerInput,
} from "../../core/entities/Player";
import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import type {
  PlayerFilter,
  PlayerRepository,
  PlayerTeamMembershipRepository,
  QueryOptions,
} from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import {
  apply_player_entity_filter,
  filter_players_by_player_ids,
  get_membership_player_ids_by_jersey_number,
} from "./InBrowserPlayerRepositoryFilters";
import { get_player_team_membership_repository } from "./InBrowserPlayerTeamMembershipRepository";

const ENTITY_PREFIX = "player";

export class InBrowserPlayerRepository
  extends InBrowserBaseRepository<
    Player,
    CreatePlayerInput,
    UpdatePlayerInput,
    PlayerFilter
  >
  implements PlayerRepository
{
  private membership_repository: PlayerTeamMembershipRepository;

  constructor(membership_repository: PlayerTeamMembershipRepository) {
    super(ENTITY_PREFIX);
    this.membership_repository = membership_repository;
  }

  protected get_table(): Table<Player, string> {
    return this.database.players;
  }

  async find_all(
    filter?: PlayerFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Player> {
    if (filter) {
      return this.find_by_filter(filter, options);
    }
    return super.find_all(undefined, options);
  }

  protected create_entity_from_input(
    input: CreatePlayerInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Player {
    return { id, ...timestamps, ...input };
  }

  protected apply_updates_to_entity(
    entity: Player,
    updates: UpdatePlayerInput,
  ): Player {
    return { ...entity, ...updates };
  }

  protected apply_entity_filter(
    entities: Player[],
    filter: PlayerFilter,
  ): Player[] {
    return apply_player_entity_filter(entities, filter);
  }

  async find_by_filter(
    filter: PlayerFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Player> {
    try {
      let filtered_entities = await this.database.players.toArray();
      if (filter.team_id) {
        const membership_result = await this.membership_repository.find_by_team(
          filter.team_id,
          { page_number: 1, page_size: 10000 },
        );
        if (membership_result.success && membership_result.data) {
          const player_id_set = new Set(
            membership_result.data.items.map((m) => m.player_id),
          );
          filtered_entities = filter_players_by_player_ids(
            filtered_entities,
            player_id_set,
          );
        } else {
          filtered_entities = [];
        }
      }
      filtered_entities = this.apply_entity_filter(filtered_entities, filter);
      const total_count = filtered_entities.length;
      const sorted = this.apply_sort(filtered_entities, options);
      const paginated = this.apply_pagination(sorted, options);
      return create_success_result(
        this.create_paginated_result(paginated, total_count, options),
      );
    } catch (error) {
      console.warn("[PlayerRepository] Failed to filter players", {
        event: "repository_filter_players_failed",
        error: String(error),
      });
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter players: ${error_message}`,
      );
    }
  }

  async find_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Player> {
    return this.find_by_filter({ team_id }, options);
  }

  async find_active_players(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Player> {
    return this.find_by_filter(
      { status: ENTITY_STATUS.ACTIVE as "active" },
      options,
    );
  }

  async find_by_jersey_number(
    team_id: string,
    jersey_number: number,
  ): PaginatedAsyncResult<Player> {
    try {
      const membership_result = await this.membership_repository.find_by_team(
        team_id,
        { page_number: 1, page_size: 10000 },
      );
      if (!membership_result.success || !membership_result.data) {
        return create_success_result(this.create_paginated_result([], 0));
      }
      const matching_player_ids = get_membership_player_ids_by_jersey_number(
        membership_result.data.items,
        jersey_number,
      );
      const all_players = await this.database.players.toArray();
      const matching_players = filter_players_by_player_ids(
        all_players,
        matching_player_ids,
      );
      return create_success_result(
        this.create_paginated_result(matching_players, matching_players.length),
      );
    } catch (error) {
      console.warn(
        "[PlayerRepository] Failed to find players by jersey number",
        {
          event: "repository_find_players_by_jersey_number_failed",
          error: String(error),
        },
      );
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to find players by jersey number: ${error_message}`,
      );
    }
  }
}

let singleton_instance: InBrowserPlayerRepository | null = null;

export function get_player_repository(): PlayerRepository {
  if (!singleton_instance) {
    const membership_repository = get_player_team_membership_repository();
    singleton_instance = new InBrowserPlayerRepository(membership_repository);
  }
  return singleton_instance;
}

export async function reset_player_repository(): Promise<void> {
  const repository = get_player_repository() as InBrowserPlayerRepository;
  await repository.clear_all_data();
}
