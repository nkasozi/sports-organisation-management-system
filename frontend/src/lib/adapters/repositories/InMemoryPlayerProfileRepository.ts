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
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_player_profiles";
const ENTITY_PREFIX = "profile";

export class InMemoryPlayerProfileRepository
  extends InMemoryBaseRepository<
    PlayerProfile,
    CreatePlayerProfileInput,
    UpdatePlayerProfileInput
  >
  implements PlayerProfileRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
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
      social_media_links: input.social_media_links || [],
      website_links: input.website_links || [],
      video_links: input.video_links || [],
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
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

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

    const page_number = options?.page_number || 1;
    const page_size = options?.page_size || 20;
    const start_index = (page_number - 1) * page_size;
    const paginated_items = filtered_entities.slice(
      start_index,
      start_index + page_size,
    );

    return create_success_result({
      items: paginated_items,
      total_count: filtered_entities.length,
      page_number,
      page_size,
      total_pages: Math.ceil(filtered_entities.length / page_size),
    });
  }

  async find_by_player_id(player_id: string): AsyncResult<PlayerProfile> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const profiles = Array.from(this.entity_cache.values());
    const found = profiles.find((p) => p.player_id === player_id);

    if (!found) {
      return create_failure_result(`No profile found for player: ${player_id}`);
    }

    return create_success_result(found);
  }

  async find_by_slug(slug: string): AsyncResult<PlayerProfile> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const profiles = Array.from(this.entity_cache.values());
    const found = profiles.find((p) => p.profile_slug === slug);

    if (!found) {
      return create_failure_result(`No profile found with slug: ${slug}`);
    }

    return create_success_result(found);
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

let repository_instance: InMemoryPlayerProfileRepository | null = null;

export function get_player_profile_repository(): PlayerProfileRepository {
  if (!repository_instance) {
    repository_instance = new InMemoryPlayerProfileRepository();
  }
  return repository_instance;
}

export function reset_player_profile_repository(): void {
  repository_instance = null;
}
