import type {
  ProfileLink,
  CreateProfileLinkInput,
  UpdateProfileLinkInput,
} from "../../core/entities/ProfileLink";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  ProfileLinkRepository,
  ProfileLinkFilter,
} from "../../core/interfaces/adapters/ProfileLinkRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_profile_links";
const ENTITY_PREFIX = "profilelink";

export class InMemoryProfileLinkRepository
  extends InMemoryBaseRepository<
    ProfileLink,
    CreateProfileLinkInput,
    UpdateProfileLinkInput
  >
  implements ProfileLinkRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateProfileLinkInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): ProfileLink {
    return {
      id,
      ...timestamps,
      profile_id: input.profile_id,
      platform: input.platform,
      title: input.title,
      url: input.url,
      display_order: input.display_order || 0,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: ProfileLink,
    updates: UpdateProfileLinkInput,
  ): ProfileLink {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: ProfileLinkFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ProfileLink> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter.profile_id) {
      filtered_entities = filtered_entities.filter(
        (link) => link.profile_id === filter.profile_id,
      );
    }

    if (filter.platform) {
      filtered_entities = filtered_entities.filter(
        (link) => link.platform === filter.platform,
      );
    }

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (link) => link.status === filter.status,
      );
    }

    filtered_entities.sort((a, b) => a.display_order - b.display_order);

    const page_number = options?.page_number || 1;
    const page_size = options?.page_size || 100;
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

  async find_by_profile_id(
    profile_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ProfileLink> {
    return this.find_by_filter({ profile_id, status: "active" }, options);
  }
}

let repository_instance: InMemoryProfileLinkRepository | null = null;

export function get_profile_link_repository(): ProfileLinkRepository {
  if (!repository_instance) {
    repository_instance = new InMemoryProfileLinkRepository();
  }
  return repository_instance;
}

export function reset_profile_link_repository(): void {
  repository_instance = null;
}
