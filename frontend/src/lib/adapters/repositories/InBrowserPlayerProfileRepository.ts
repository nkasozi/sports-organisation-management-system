import type { Table } from "dexie";
import type {
  PlayerProfile,
  CreatePlayerProfileInput,
  UpdatePlayerProfileInput,
} from "../../core/entities/PlayerProfile";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  PlayerProfileRepository,
  PlayerProfileFilter,
} from "../../core/interfaces/adapters/PlayerProfileRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type {
  PaginatedAsyncResult,
  AsyncResult,
} from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "profile";

export class InBrowserPlayerProfileRepository
  extends InBrowserBaseRepository<
    PlayerProfile,
    CreatePlayerProfileInput,
    UpdatePlayerProfileInput
  >
  implements PlayerProfileRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<PlayerProfile, string> {
    return this.database.player_profiles;
  }

  protected create_entity_from_input(
    input: CreatePlayerProfileInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): PlayerProfile {
    return {
      id,
      ...timestamps,
      player_id: input.player_id,
      profile_summary: input.profile_summary,
      visibility: input.visibility,
      profile_slug: input.profile_slug,
      featured_image_url: input.featured_image_url || "",
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: PlayerProfile,
    updates: UpdatePlayerProfileInput,
  ): PlayerProfile {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: PlayerProfileFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerProfile> {
    try {
      let filtered_entities = await this.database.player_profiles.toArray();

      if (filter.player_id) {
        filtered_entities = filtered_entities.filter(
          (profile) => profile.player_id === filter.player_id,
        );
      }

      if (filter.visibility) {
        filtered_entities = filtered_entities.filter(
          (profile) => profile.visibility === filter.visibility,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (profile) => profile.status === filter.status,
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
        `Failed to filter player profiles: ${error_message}`,
      );
    }
  }

  async find_by_player_id(player_id: string): AsyncResult<PlayerProfile> {
    try {
      const profiles = await this.database.player_profiles
        .where("player_id")
        .equals(player_id)
        .toArray();

      if (profiles.length === 0) {
        return create_failure_result(
          `No profile found for player: ${player_id}`,
        );
      }

      return create_success_result(profiles[0]);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to find profile by player_id: ${error_message}`,
      );
    }
  }

  async find_by_slug(slug: string): AsyncResult<PlayerProfile> {
    try {
      const profiles = await this.database.player_profiles
        .where("profile_slug")
        .equals(slug)
        .toArray();

      if (profiles.length === 0) {
        return create_failure_result(`No profile found with slug: ${slug}`);
      }

      return create_success_result(profiles[0]);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to find profile by slug: ${error_message}`,
      );
    }
  }

  async find_public_profiles(
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerProfile> {
    return this.find_by_filter(
      { visibility: "public", status: "active" },
      options,
    );
  }
}

export function create_default_player_profiles(): PlayerProfile[] {
  const now = new Date().toISOString();

  return [
    {
      id: "profile_default_1",
      player_id: "player_default_1",
      profile_summary:
        "Experienced midfielder with over 10 years of competitive hockey experience. Known for excellent ball control and strategic playmaking abilities.",
      visibility: "public",
      profile_slug: "john-doe-hockey",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "profile_default_2",
      player_id: "player_default_2",
      profile_summary:
        "Rising star goalkeeper with exceptional reflexes and leadership skills. Captain of the U-21 national team.",
      visibility: "public",
      profile_slug: "jane-smith-hockey",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserPlayerProfileRepository | null = null;

export function get_player_profile_repository(): PlayerProfileRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserPlayerProfileRepository();
  }
  return singleton_instance;
}

export async function initialize_player_profile_repository(): Promise<void> {
  const repository =
    get_player_profile_repository() as InBrowserPlayerProfileRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_player_profiles());
  }
}

export async function reset_player_profile_repository(): Promise<void> {
  const repository =
    get_player_profile_repository() as InBrowserPlayerProfileRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_player_profiles());
}
