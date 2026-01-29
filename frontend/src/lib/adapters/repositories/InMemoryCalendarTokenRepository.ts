import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  PaginatedResult,
} from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import {
  type CalendarToken,
  type CreateCalendarTokenInput,
  type UpdateCalendarTokenInput,
} from "../../core/entities/CalendarToken";
import type {
  CalendarTokenRepository,
  CalendarTokenFilter,
} from "../../core/interfaces/adapters/CalendarTokenRepository";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_calendar_tokens";
const ENTITY_PREFIX = "cal_token";

export class InMemoryCalendarTokenRepository
  extends InMemoryBaseRepository<
    CalendarToken,
    CreateCalendarTokenInput,
    UpdateCalendarTokenInput
  >
  implements CalendarTokenRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateCalendarTokenInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): CalendarToken {
    return {
      id,
      ...timestamps,
      ...input,
      last_accessed_at: null,
      access_count: 0,
    };
  }

  protected apply_updates_to_entity(
    entity: CalendarToken,
    updates: UpdateCalendarTokenInput,
  ): CalendarToken {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: CalendarTokenFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_tokens = Array.from(this.entity_cache.values());

    if (filter.user_id) {
      filtered_tokens = filtered_tokens.filter(
        (token) => token.user_id === filter.user_id,
      );
    }

    if (filter.organization_id) {
      filtered_tokens = filtered_tokens.filter(
        (token) => token.organization_id === filter.organization_id,
      );
    }

    if (filter.feed_type) {
      filtered_tokens = filtered_tokens.filter(
        (token) => token.feed_type === filter.feed_type,
      );
    }

    if (filter.entity_id) {
      filtered_tokens = filtered_tokens.filter(
        (token) => token.entity_id === filter.entity_id,
      );
    }

    if (filter.is_active !== undefined) {
      filtered_tokens = filtered_tokens.filter(
        (token) => token.is_active === filter.is_active,
      );
    }

    filtered_tokens.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const page_number = options?.page_number ?? 1;
    const page_size = options?.page_size ?? 20;
    const start_index = (page_number - 1) * page_size;
    const end_index = start_index + page_size;
    const paginated_tokens = filtered_tokens.slice(start_index, end_index);

    const paginated_result: PaginatedResult<CalendarToken> = {
      items: paginated_tokens,
      total_count: filtered_tokens.length,
      page_number,
      page_size,
      total_pages: Math.ceil(filtered_tokens.length / page_size),
    };

    return create_success_result(paginated_result);
  }

  async find_by_token(token: string): AsyncResult<CalendarToken | null> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const found_token = Array.from(this.entity_cache.values()).find(
      (t) => t.token === token && t.is_active,
    );

    return create_success_result(found_token ?? null);
  }

  async find_by_user(
    user_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken> {
    return this.find_by_filter({ user_id, is_active: true }, options);
  }

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken> {
    return this.find_by_filter({ organization_id, is_active: true }, options);
  }

  async record_access(token: string): AsyncResult<CalendarToken> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const found_token = Array.from(this.entity_cache.values()).find(
      (t) => t.token === token,
    );

    if (!found_token) {
      return create_failure_result("Token not found");
    }

    const updated_token: CalendarToken = {
      ...found_token,
      last_accessed_at: new Date().toISOString(),
      access_count: found_token.access_count + 1,
      updated_at: new Date().toISOString(),
    };

    this.entity_cache.set(found_token.id, updated_token);
    this.save_to_local_storage();

    return create_success_result(updated_token);
  }

  async deactivate_token(token: string): AsyncResult<CalendarToken> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const found_token = Array.from(this.entity_cache.values()).find(
      (t) => t.token === token,
    );

    if (!found_token) {
      return create_failure_result("Token not found");
    }

    const updated_token: CalendarToken = {
      ...found_token,
      is_active: false,
      updated_at: new Date().toISOString(),
    };

    this.entity_cache.set(found_token.id, updated_token);
    this.save_to_local_storage();

    return create_success_result(updated_token);
  }
}
