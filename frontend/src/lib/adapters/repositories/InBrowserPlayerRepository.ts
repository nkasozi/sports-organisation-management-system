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
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import {
  ALL_PLAYERS_SELECTION,
  apply_player_entity_filter,
  filter_players_by_player_ids,
  get_membership_player_ids_by_jersey_number,
  restrict_players,
} from "./InBrowserPlayerRepositoryFilters";
import {
  load_team_member_selection,
  load_team_memberships,
} from "./InBrowserPlayerRepositoryMemberships";
import { get_player_team_membership_repository } from "./InBrowserPlayerTeamMembershipRepository";
import {
  create_warning_failure_details,
  execute_repository_operation,
  type RepositoryFailureDetails,
} from "./InBrowserRepositoryQueryRunner";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";

const ENTITY_PREFIX = "player";
function describe_player_failure(
  operation: string,
  event_name: string,
): RepositoryFailureDetails {
  return create_warning_failure_details(
    `[PlayerRepository] Failed to ${operation}`,
    `repository_${event_name}_failed`,
    operation,
  );
}

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
    if (filter && Object.keys(filter).length > 0) {
      return this.find_by_filter(filter, options);
    }
    return super.find_all({}, options);
  }

  protected create_entity_from_input(
    input: CreatePlayerInput,
    id: Player["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Player {
    return { id, ...timestamps, ...input } as Player;
  }

  protected apply_updates_to_entity(
    entity: Player,
    updates: UpdatePlayerInput,
  ): Player {
    return { ...entity, ...updates } as Player;
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
    const team_member_ids_result = filter.team_id
      ? await load_team_member_selection(
          this.membership_repository,
          filter.team_id,
        )
      : create_success_result(ALL_PLAYERS_SELECTION);
    if (!team_member_ids_result.success) return team_member_ids_result;
    return execute_repository_operation(
      describe_player_failure("filter players", "filter_players"),
      async () => {
        const all_players = await this.database.players.toArray();
        const filtered_entities = this.apply_entity_filter(
          restrict_players(all_players, team_member_ids_result.data),
          filter,
        );
        const sorted = this.apply_sort(filtered_entities, options);
        return this.create_paginated_result(
          this.apply_pagination(sorted, options),
          filtered_entities.length,
          options,
        );
      },
    );
  }

  async find_by_team(
    team_id: ScalarValueInput<Player["id"]>,
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
    team_id: ScalarValueInput<Player["id"]>,
    jersey_number: number,
  ): PaginatedAsyncResult<Player> {
    const memberships_result = await load_team_memberships(
      this.membership_repository,
      team_id,
    );
    if (!memberships_result.success) return memberships_result;
    return execute_repository_operation(
      describe_player_failure(
        "find players by jersey number",
        "find_players_by_jersey_number",
      ),
      async () => {
        const matching_players = filter_players_by_player_ids(
          await this.database.players.toArray(),
          get_membership_player_ids_by_jersey_number(
            memberships_result.data,
            jersey_number,
          ),
        );
        return this.create_paginated_result(
          matching_players,
          matching_players.length,
        );
      },
    );
  }
}

export const get_player_repository: () => PlayerRepository =
  create_lazy_repository_accessor(
    () =>
      new InBrowserPlayerRepository(get_player_team_membership_repository()),
  );

export function reset_player_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<boolean> {
  return (get_player_repository() as InBrowserPlayerRepository)
    .with_write_origin(origin)
    .clear_all_data();
}
