import type {
  Player,
  CreatePlayerInput,
  UpdatePlayerInput,
} from "../../core/entities/Player";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  PlayerRepository,
  PlayerFilter,
} from "../../core/interfaces/adapters/PlayerRepository";
import type { PlayerTeamMembershipRepository } from "../../core/interfaces/adapters/PlayerTeamMembershipRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";
import { get_player_team_membership_repository } from "./InMemoryPlayerTeamMembershipRepository";

const STORAGE_KEY = "sports_org_players";
const ENTITY_PREFIX = "player";

export class InMemoryPlayerRepository
  extends InMemoryBaseRepository<Player, CreatePlayerInput, UpdatePlayerInput>
  implements PlayerRepository
{
  private membership_repository: PlayerTeamMembershipRepository;

  constructor(membership_repository: PlayerTeamMembershipRepository) {
    super(STORAGE_KEY, ENTITY_PREFIX);
    this.membership_repository = membership_repository;
  }

  protected create_entity_from_input(
    input: CreatePlayerInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Player {
    return {
      id,
      ...timestamps,
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone,
      date_of_birth: input.date_of_birth,
      position_id: input.position_id,
      height_cm: input.height_cm,
      weight_kg: input.weight_kg,
      nationality: input.nationality,
      profile_image_url: input.profile_image_url,
      emergency_contact_name: input.emergency_contact_name,
      emergency_contact_phone: input.emergency_contact_phone,
      medical_notes: input.medical_notes,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: Player,
    updates: UpdatePlayerInput,
  ): Player {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: PlayerFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Player> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter.name_contains) {
      const search_term = filter.name_contains.toLowerCase();
      filtered_entities = filtered_entities.filter(
        (player) =>
          player.first_name.toLowerCase().includes(search_term) ||
          player.last_name.toLowerCase().includes(search_term),
      );
    }

    if (filter.team_id) {
      const membership_result = await this.membership_repository.find_by_team(
        filter.team_id,
        { page_number: 1, page_size: 10000 },
      );

      if (membership_result.success && membership_result.data) {
        const player_id_set = new Set(
          membership_result.data.items.map(
            (membership) => membership.player_id,
          ),
        );
        filtered_entities = filtered_entities.filter((player) =>
          player_id_set.has(player.id),
        );
      } else {
        filtered_entities = [];
      }
    }

    if (filter.position_id) {
      filtered_entities = filtered_entities.filter(
        (player) => player.position_id === filter.position_id,
      );
    }

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (player) => player.status === filter.status,
      );
    }

    if (filter.nationality) {
      filtered_entities = filtered_entities.filter(
        (player) => player.nationality === filter.nationality,
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
  ): PaginatedAsyncResult<Player> {
    return this.find_by_filter({ team_id }, options);
  }

  async find_active_players(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Player> {
    return this.find_by_filter({ status: "active" }, options);
  }

  async find_by_jersey_number(
    team_id: string,
    jersey_number: number,
  ): PaginatedAsyncResult<Player> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const membership_result = await this.membership_repository.find_by_team(
      team_id,
      { page_number: 1, page_size: 10000 },
    );

    if (!membership_result.success || !membership_result.data) {
      return create_success_result(this.create_paginated_result([], 0));
    }

    const matching_player_ids = new Set(
      membership_result.data.items
        .filter((membership) => membership.jersey_number === jersey_number)
        .map((membership) => membership.player_id),
    );

    const matching_players = Array.from(this.entity_cache.values()).filter(
      (player) => matching_player_ids.has(player.id),
    );

    return create_success_result(
      this.create_paginated_result(matching_players, matching_players.length),
    );
  }
}

function create_default_players(): Player[] {
  const now = new Date().toISOString();

  return [
    {
      id: "player_default_1",
      first_name: "Carlos",
      last_name: "Martinez",
      email: "c.martinez@reddragons.com",
      phone: "+1-555-2001",
      date_of_birth: "1995-03-15",
      position_id: "",
      height_cm: 180,
      weight_kg: 75,
      nationality: "Spain",
      profile_image_url: "",
      emergency_contact_name: "Maria Martinez",
      emergency_contact_phone: "+1-555-2101",
      medical_notes: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_default_2",
      first_name: "John",
      last_name: "Smith",
      email: "j.smith@reddragons.com",
      phone: "+1-555-2002",
      date_of_birth: "1998-07-22",
      position_id: "",
      height_cm: 175,
      weight_kg: 72,
      nationality: "United States",
      profile_image_url: "",
      emergency_contact_name: "Jane Smith",
      emergency_contact_phone: "+1-555-2102",
      medical_notes: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_default_3",
      first_name: "Yuki",
      last_name: "Tanaka",
      email: "y.tanaka@bluethunder.com",
      phone: "+1-555-2003",
      date_of_birth: "1997-11-08",
      position_id: "",
      height_cm: 188,
      weight_kg: 82,
      nationality: "Japan",
      profile_image_url: "",
      emergency_contact_name: "Kenji Tanaka",
      emergency_contact_phone: "+1-555-2103",
      medical_notes: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "player_default_4",
      first_name: "Marcus",
      last_name: "Johnson",
      email: "m.johnson@stormbasketball.com",
      phone: "+1-555-2004",
      date_of_birth: "1996-05-30",
      position_id: "",
      height_cm: 190,
      weight_kg: 85,
      nationality: "United States",
      profile_image_url: "",
      emergency_contact_name: "Linda Johnson",
      emergency_contact_phone: "+1-555-2104",
      medical_notes: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InMemoryPlayerRepository | null = null;

export function get_player_repository(): PlayerRepository {
  if (!singleton_instance) {
    const membership_repository = get_player_team_membership_repository();
    singleton_instance = new InMemoryPlayerRepository(membership_repository);
    singleton_instance["ensure_cache_initialized"]();
  }

  return singleton_instance;
}

export function reset_player_repository(): void {
  if (singleton_instance) {
    singleton_instance.clear_all_data();
  }
}
