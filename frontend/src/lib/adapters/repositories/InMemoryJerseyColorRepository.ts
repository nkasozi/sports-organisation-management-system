import type {
  JerseyColorRepository,
  JerseyColorFilter,
} from "../../core/interfaces/adapters/JerseyColorRepository";
import type {
  JerseyColor,
  CreateJerseyColorInput,
  UpdateJerseyColorInput,
  JerseyColorHolderType,
} from "../../core/entities/JerseyColor";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_jersey_colors";
const ENTITY_PREFIX = "jersey";

export class InMemoryJerseyColorRepository
  extends InMemoryBaseRepository<
    JerseyColor,
    CreateJerseyColorInput,
    UpdateJerseyColorInput
  >
  implements JerseyColorRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateJerseyColorInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): JerseyColor {
    return {
      id,
      ...timestamps,
      holder_type: input.holder_type,
      holder_id: input.holder_id,
      nickname: input.nickname,
      main_color: input.main_color,
      secondary_color: input.secondary_color || "",
      tertiary_color: input.tertiary_color || "",
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: JerseyColor,
    updates: UpdateJerseyColorInput,
  ): JerseyColor {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: JerseyColorFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<JerseyColor> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter.holder_type) {
      filtered_entities = filtered_entities.filter(
        (jersey) => jersey.holder_type === filter.holder_type,
      );
    }

    if (filter.holder_id) {
      filtered_entities = filtered_entities.filter(
        (jersey) => jersey.holder_id === filter.holder_id,
      );
    }

    if (filter.nickname) {
      const nickname_lower = filter.nickname.toLowerCase();
      filtered_entities = filtered_entities.filter((jersey) =>
        jersey.nickname.toLowerCase().includes(nickname_lower),
      );
    }

    if (filter.main_color) {
      const color_lower = filter.main_color.toLowerCase();
      filtered_entities = filtered_entities.filter(
        (jersey) => jersey.main_color.toLowerCase() === color_lower,
      );
    }

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (jersey) => jersey.status === filter.status,
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

  async find_by_holder(
    holder_type: JerseyColorHolderType,
    holder_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<JerseyColor> {
    return this.find_by_filter({ holder_type, holder_id }, options);
  }

  seed_with_data(items: JerseyColor[]): void {
    this.ensure_cache_initialized();
    for (const item of items) {
      this.entity_cache.set(item.id, item);
    }
    this.save_to_local_storage();
  }
}

let repository_instance: InMemoryJerseyColorRepository | null = null;

export function get_jersey_color_repository(): InMemoryJerseyColorRepository {
  if (!repository_instance) {
    repository_instance = new InMemoryJerseyColorRepository();
  }
  return repository_instance;
}
