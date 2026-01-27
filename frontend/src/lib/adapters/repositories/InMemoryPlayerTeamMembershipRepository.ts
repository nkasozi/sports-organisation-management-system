import type {
  PlayerTeamMembership,
  CreatePlayerTeamMembershipInput,
  UpdatePlayerTeamMembershipInput,
} from "../../core/entities/PlayerTeamMembership";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  PlayerTeamMembershipRepository,
  PlayerTeamMembershipFilter,
} from "../../core/interfaces/adapters/PlayerTeamMembershipRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_player_team_memberships";
const ENTITY_PREFIX = "player_team_membership";

export class InMemoryPlayerTeamMembershipRepository
  extends InMemoryBaseRepository<
    PlayerTeamMembership,
    CreatePlayerTeamMembershipInput,
    UpdatePlayerTeamMembershipInput
  >
  implements PlayerTeamMembershipRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreatePlayerTeamMembershipInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): PlayerTeamMembership {
    return {
      id,
      ...timestamps,
      player_id: input.player_id,
      team_id: input.team_id,
      start_date: input.start_date,
      jersey_number: input.jersey_number,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: PlayerTeamMembership,
    updates: UpdatePlayerTeamMembershipInput,
  ): PlayerTeamMembership {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: PlayerTeamMembershipFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter.player_id) {
      filtered_entities = filtered_entities.filter(
        (membership) => membership.player_id === filter.player_id,
      );
    }

    if (filter.team_id) {
      filtered_entities = filtered_entities.filter(
        (membership) => membership.team_id === filter.team_id,
      );
    }

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (membership) => membership.status === filter.status,
      );
    }

    const total_count = filtered_entities.length;
    const paginated_entities = this.apply_pagination_and_sort(
      filtered_entities,
      options,
    );

    return create_success_result(
      this.create_paginated_result(paginated_entities, total_count, options),
    );
  }

  async find_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership> {
    return this.find_by_filter({ team_id }, options);
  }

  async find_by_player(
    player_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership> {
    return this.find_by_filter({ player_id }, options);
  }
}

function create_default_player_team_memberships(): PlayerTeamMembership[] {
  const now = new Date().toISOString();

  return [
    {
      id: "player_team_membership_default_1",
      player_id: "player_default_1",
      team_id: "team_default_1",
      start_date: "2024-01-01",
      jersey_number: 9,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_team_membership_default_2",
      player_id: "player_default_2",
      team_id: "team_default_1",
      start_date: "2024-01-01",
      jersey_number: 10,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_team_membership_default_3",
      player_id: "player_default_3",
      team_id: "team_default_2",
      start_date: "2024-01-01",
      jersey_number: 1,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_team_membership_default_4",
      player_id: "player_default_4",
      team_id: "team_default_4",
      start_date: "2024-01-01",
      jersey_number: 23,
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InMemoryPlayerTeamMembershipRepository | null = null;

export function get_player_team_membership_repository(): PlayerTeamMembershipRepository {
  if (!singleton_instance) {
    singleton_instance = new InMemoryPlayerTeamMembershipRepository();
    singleton_instance["ensure_cache_initialized"]();
  }

  return singleton_instance;
}

export function reset_player_team_membership_repository(): void {
  if (singleton_instance) {
    singleton_instance.clear_all_data();
  }
}
