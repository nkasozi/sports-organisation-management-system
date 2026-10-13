import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreatePlayerTeamMembershipInput,
  PlayerTeamMembership,
  UpdatePlayerTeamMembershipInput,
} from "../../core/entities/PlayerTeamMembership";
import type {
  PlayerTeamMembershipFilter,
  PlayerTeamMembershipRepository,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";

const ENTITY_PREFIX = "player_team_membership";

export class InBrowserPlayerTeamMembershipRepository
  extends InBrowserBaseRepository<
    PlayerTeamMembership,
    CreatePlayerTeamMembershipInput,
    UpdatePlayerTeamMembershipInput,
    PlayerTeamMembershipFilter
  >
  implements PlayerTeamMembershipRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<PlayerTeamMembership, string> {
    return this.database.player_team_memberships;
  }

  protected create_entity_from_input(
    input: CreatePlayerTeamMembershipInput,
    id: PlayerTeamMembership["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): PlayerTeamMembership {
    return {
      id,
      ...timestamps,
      organization_id: input.organization_id,
      player_id: input.player_id,
      team_id: input.team_id,
      start_date: input.start_date,
      jersey_number: input.jersey_number,
      status: input.status,
    } as PlayerTeamMembership;
  }

  protected apply_updates_to_entity(
    entity: PlayerTeamMembership,
    updates: UpdatePlayerTeamMembershipInput,
  ): PlayerTeamMembership {
    return {
      ...entity,
      ...updates,
    } as PlayerTeamMembership;
  }

  protected apply_entity_filter(
    entities: PlayerTeamMembership[],
    filter: PlayerTeamMembershipFilter,
  ): PlayerTeamMembership[] {
    let filtered = entities;

    if (filter.organization_id) {
      filtered = filtered.filter(
        (m) => m.organization_id === filter.organization_id,
      );
    }

    if (filter.player_id) {
      filtered = filtered.filter((m) => m.player_id === filter.player_id);
    }

    if (filter.team_id) {
      filtered = filtered.filter((m) => m.team_id === filter.team_id);
    }

    if (filter.status) {
      filtered = filtered.filter((m) => m.status === filter.status);
    }

    return filtered;
  }

  async find_by_team(
    team_id: ScalarValueInput<PlayerTeamMembership["team_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership> {
    return this.find_all({ team_id }, options);
  }

  async find_by_player(
    player_id: ScalarValueInput<PlayerTeamMembership["player_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership> {
    return this.find_all({ player_id }, options);
  }
}

const get_concrete_repository: () => InBrowserPlayerTeamMembershipRepository =
  create_lazy_repository_accessor(
    () => new InBrowserPlayerTeamMembershipRepository(),
  );

export function get_player_team_membership_repository(): PlayerTeamMembershipRepository {
  return get_concrete_repository();
}

export function reset_player_team_membership_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<boolean> {
  return get_concrete_repository().with_write_origin(origin).clear_all_data();
}
