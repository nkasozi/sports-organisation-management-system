import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreatePlayerPositionInput,
  PlayerPosition,
  PlayerPositionFilter,
  UpdatePlayerPositionInput,
} from "../../core/entities/PlayerPosition";
import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import type {
  PlayerPositionRepository,
  QueryOptions,
} from "../../core/interfaces/ports";
import { build_player_position_not_found_by_code_error } from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  Result,
} from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import {
  apply_player_position_filter,
  sort_player_positions,
} from "./InBrowserPlayerPositionRepositoryHelpers";
import {
  create_warning_failure_details,
  execute_repository_operation,
  type RepositoryFailureDetails,
  run_repository_query,
} from "./InBrowserRepositoryQueryRunner";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";
export { create_default_player_positions_for_organization } from "./InBrowserPlayerPositionRepositoryDefaults";

const ENTITY_PREFIX = "player_position";

function describe_position_failure(subject: string): RepositoryFailureDetails {
  return create_warning_failure_details(
    `[PlayerPositionRepository] Failed to find ${subject}`,
    `repository_find_${subject.replaceAll(" ", "_")}_failed`,
    `find ${subject}`,
  );
}

export class InBrowserPlayerPositionRepository
  extends InBrowserBaseRepository<
    PlayerPosition,
    CreatePlayerPositionInput,
    UpdatePlayerPositionInput,
    PlayerPositionFilter
  >
  implements PlayerPositionRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<PlayerPosition, string> {
    return this.database.player_positions;
  }

  protected create_entity_from_input(
    input: CreatePlayerPositionInput,
    id: PlayerPosition["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): PlayerPosition {
    return { id, ...timestamps, ...input } as PlayerPosition;
  }

  protected apply_updates_to_entity(
    entity: PlayerPosition,
    updates: UpdatePlayerPositionInput,
  ): PlayerPosition {
    return { ...entity, ...updates } as PlayerPosition;
  }

  protected apply_entity_filter(
    entities: PlayerPosition[],
    filter: PlayerPositionFilter,
  ): PlayerPosition[] {
    return apply_player_position_filter(entities, filter);
  }

  async find_by_code(code: string): Promise<Result<PlayerPosition>> {
    return run_repository_query(
      describe_position_failure("position by code"),
      async () => {
        const found_position = (
          await this.database.player_positions.toArray()
        ).find(
          (position) => position.code.toLowerCase() === code.toLowerCase(),
        );
        return found_position
          ? create_success_result(found_position)
          : create_failure_result(
              build_player_position_not_found_by_code_error(code),
            );
      },
    );
  }

  async find_by_sport_type(
    sport_type: string,
  ): Promise<Result<PlayerPosition[]>> {
    return this.list_sorted_positions(
      describe_position_failure("positions by sport type"),
      (p) => p.sport_type === sport_type,
    );
  }

  async find_by_category(
    category: PlayerPosition["category"],
  ): Promise<Result<PlayerPosition[]>> {
    return this.list_sorted_positions(
      describe_position_failure("positions by category"),
      (p) => p.category === category,
    );
  }

  async find_available_positions(): Promise<Result<PlayerPosition[]>> {
    return this.list_sorted_positions(
      describe_position_failure("available positions"),
      (p) => p.is_available && p.status === ENTITY_STATUS.ACTIVE,
    );
  }

  async find_by_filter(
    filter: PlayerPositionFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerPosition> {
    return execute_repository_operation(
      create_warning_failure_details(
        "[PlayerPositionRepository] Failed to filter player positions",
        "repository_filter_player_positions_failed",
        "filter player positions",
      ),
      async () => {
        const filtered_entities = sort_player_positions(
          this.apply_entity_filter(
            await this.database.player_positions.toArray(),
            filter,
          ),
        );
        const sorted = this.apply_sort(filtered_entities, options);
        const paginated = this.apply_pagination(sorted, options);
        return this.create_paginated_result(
          paginated,
          filtered_entities.length,
          options,
        );
      },
    );
  }

  private list_sorted_positions(
    failure: RepositoryFailureDetails,
    matches: (position: PlayerPosition) => boolean,
  ): Promise<Result<PlayerPosition[]>> {
    return execute_repository_operation(failure, async () =>
      sort_player_positions(
        (await this.database.player_positions.toArray()).filter(matches),
      ),
    );
  }

  async find_by_organization(
    organization_id: PlayerPosition["organization_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerPosition> {
    return this.find_all({ organization_id }, options);
  }
}

export const get_player_position_repository: () => PlayerPositionRepository =
  create_lazy_repository_accessor(
    () => new InBrowserPlayerPositionRepository(),
  );

export function reset_player_position_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<boolean> {
  return (get_player_position_repository() as InBrowserPlayerPositionRepository)
    .with_write_origin(origin)
    .clear_all_data();
}
