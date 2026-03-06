import type { Table } from "dexie";
import type {
  PlayerTeamMembership,
  CreatePlayerTeamMembershipInput,
  UpdatePlayerTeamMembershipInput,
} from "../../core/entities/PlayerTeamMembership";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  PlayerTeamMembershipRepository,
  PlayerTeamMembershipFilter,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

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
    id: string,
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
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership> {
    return this.find_all({ team_id }, options);
  }

  async find_by_player(
    player_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerTeamMembership> {
    return this.find_all({ player_id }, options);
  }
}

export function create_default_player_team_memberships(): PlayerTeamMembership[] {
  const now = new Date().toISOString();

  return [
    {
      id: "player_team_membership_default_1",
      organization_id: "org_default_1",
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
      organization_id: "org_default_1",
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
      organization_id: "org_default_1",
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
      organization_id: "org_default_1",
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

let singleton_instance: InBrowserPlayerTeamMembershipRepository | null = null;

export function get_player_team_membership_repository(): PlayerTeamMembershipRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserPlayerTeamMembershipRepository();
  }
  return singleton_instance;
}

export async function initialize_player_team_membership_repository(): Promise<void> {
  const repository =
    get_player_team_membership_repository() as InBrowserPlayerTeamMembershipRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_player_team_memberships());
  }
}

export async function reset_player_team_membership_repository(): Promise<void> {
  const repository =
    get_player_team_membership_repository() as InBrowserPlayerTeamMembershipRepository;
  await repository.clear_all_data();
}
