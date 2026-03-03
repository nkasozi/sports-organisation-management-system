import type { Table } from "dexie";
import type {
  PlayerTeamTransferHistory,
  CreatePlayerTeamTransferHistoryInput,
  UpdatePlayerTeamTransferHistoryInput,
} from "../../core/entities/PlayerTeamTransferHistory";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  PlayerTeamTransferHistoryRepository,
  PlayerTeamTransferHistoryFilter,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "player_team_transfer_history";

export class InBrowserPlayerTeamTransferHistoryRepository
  extends InBrowserBaseRepository<
    PlayerTeamTransferHistory,
    CreatePlayerTeamTransferHistoryInput,
    UpdatePlayerTeamTransferHistoryInput
  >
  implements PlayerTeamTransferHistoryRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<PlayerTeamTransferHistory, string> {
    return this.database.player_team_transfer_histories;
  }

  protected create_entity_from_input(
    input: CreatePlayerTeamTransferHistoryInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): PlayerTeamTransferHistory {
    return {
      id,
      ...timestamps,
      organization_id: input.organization_id,
      player_id: input.player_id,
      from_team_id: input.from_team_id,
      to_team_id: input.to_team_id,
      transfer_date: input.transfer_date,
      status: input.status,
      approved_by: input.approved_by,
      notes: input.notes,
    };
  }

  protected apply_updates_to_entity(
    entity: PlayerTeamTransferHistory,
    updates: UpdatePlayerTeamTransferHistoryInput,
  ): PlayerTeamTransferHistory {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: PlayerTeamTransferHistoryFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory> {
    try {
      let filtered_entities =
        await this.database.player_team_transfer_histories.toArray();

      if (filter.player_id) {
        filtered_entities = filtered_entities.filter(
          (transfer) => transfer.player_id === filter.player_id,
        );
      }

      if (filter.from_team_id) {
        filtered_entities = filtered_entities.filter(
          (transfer) => transfer.from_team_id === filter.from_team_id,
        );
      }

      if (filter.to_team_id) {
        filtered_entities = filtered_entities.filter(
          (transfer) => transfer.to_team_id === filter.to_team_id,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (transfer) => transfer.status === filter.status,
        );
      }

      const total_count = filtered_entities.length;
      const sorted_entities = this.apply_sort(filtered_entities, options);
      const paginated_entities = this.apply_pagination(
        sorted_entities,
        options,
      );

      return create_success_result(
        this.create_paginated_result(paginated_entities, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter player team transfer histories: ${error_message}`,
      );
    }
  }

  async find_by_player(
    player_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory> {
    return this.find_by_filter({ player_id }, options);
  }

  async find_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory> {
    try {
      let filtered_entities =
        await this.database.player_team_transfer_histories.toArray();

      filtered_entities = filtered_entities.filter(
        (transfer) =>
          transfer.from_team_id === team_id || transfer.to_team_id === team_id,
      );

      const total_count = filtered_entities.length;
      const sorted_entities = this.apply_sort(filtered_entities, options);
      const paginated_entities = this.apply_pagination(
        sorted_entities,
        options,
      );

      return create_success_result(
        this.create_paginated_result(paginated_entities, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to find transfers by team: ${error_message}`,
      );
    }
  }

  async find_pending_transfers(
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamTransferHistory> {
    return this.find_by_filter({ status: "pending" }, options);
  }
}
