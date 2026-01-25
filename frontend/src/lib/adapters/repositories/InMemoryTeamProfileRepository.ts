import type {
  TeamProfile,
  CreateTeamProfileInput,
  UpdateTeamProfileInput,
} from "../../core/entities/TeamProfile";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  TeamProfileRepository,
  TeamProfileFilter,
} from "../../core/interfaces/adapters/TeamProfileRepository";
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

const STORAGE_KEY = "sports_org_team_profiles";
const ENTITY_PREFIX = "teamprofile";

export class InMemoryTeamProfileRepository
  extends InMemoryBaseRepository<
    TeamProfile,
    CreateTeamProfileInput,
    UpdateTeamProfileInput
  >
  implements TeamProfileRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateTeamProfileInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): TeamProfile {
    return {
      id,
      ...timestamps,
      team_id: input.team_id,
      profile_summary: input.profile_summary,
      visibility: input.visibility,
      profile_slug: input.profile_slug,
      featured_image_url: input.featured_image_url || "",
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: TeamProfile,
    updates: UpdateTeamProfileInput,
  ): TeamProfile {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: TeamProfileFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamProfile> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter.team_id) {
      filtered_entities = filtered_entities.filter(
        (profile) => profile.team_id === filter.team_id,
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

  async find_by_team_id(team_id: string): AsyncResult<TeamProfile> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const profiles = Array.from(this.entity_cache.values());
    const found = profiles.find((p) => p.team_id === team_id);

    if (!found) {
      return create_failure_result(`No profile found for team: ${team_id}`);
    }

    return create_success_result(found);
  }

  async find_by_slug(slug: string): AsyncResult<TeamProfile> {
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
  ): PaginatedAsyncResult<TeamProfile> {
    return this.find_by_filter(
      { visibility: "public", status: "active" },
      options,
    );
  }
}

let repository_instance: InMemoryTeamProfileRepository | null = null;

export function get_team_profile_repository(): TeamProfileRepository {
  if (!repository_instance) {
    repository_instance = new InMemoryTeamProfileRepository();
  }
  return repository_instance;
}

export function reset_team_profile_repository(): void {
  repository_instance = null;
}
