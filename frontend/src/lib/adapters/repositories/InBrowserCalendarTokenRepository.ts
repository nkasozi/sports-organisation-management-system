import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CalendarToken,
  CreateCalendarTokenInput,
  UpdateCalendarTokenInput,
} from "../../core/entities/CalendarToken";
import { compute_calendar_token_expiry } from "../../core/entities/CalendarToken";
import type {
  CalendarTokenFilter,
  CalendarTokenRepository,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import { build_calendar_token_not_found_error } from "../../core/interfaces/ports";
import type {
  CalendarTokenValue,
  EntityId,
} from "../../core/types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
const ENTITY_PREFIX = "cal_token";
class InBrowserCalendarTokenRepository
  extends InBrowserBaseRepository<
    CalendarToken,
    CreateCalendarTokenInput,
    UpdateCalendarTokenInput,
    CalendarTokenFilter
  >
  implements CalendarTokenRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }
  protected get_table(): Table<CalendarToken, string> {
    return this.database.calendar_tokens;
  }

  protected create_entity_from_input(
    input: CreateCalendarTokenInput,
    id: CalendarToken["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): CalendarToken {
    return {
      id,
      ...timestamps,
      ...input,
      expires_at: compute_calendar_token_expiry(),
      last_accessed_at: "",
      access_count: 0,
    } as CalendarToken;
  }

  protected apply_updates_to_entity(
    entity: CalendarToken,
    updates: UpdateCalendarTokenInput,
  ): CalendarToken {
    return {
      ...entity,
      ...updates,
    } as CalendarToken;
  }

  protected apply_entity_filter(
    entities: CalendarToken[],
    filter: CalendarTokenFilter,
  ): CalendarToken[] {
    let filtered = entities;
    if (filter.user_id) {
      filtered = filtered.filter((token) => token.user_id === filter.user_id);
    }
    if (filter.organization_id) {
      filtered = filtered.filter(
        (token) => token.organization_id === filter.organization_id,
      );
    }
    if (filter.feed_type) {
      filtered = filtered.filter(
        (token) => token.feed_type === filter.feed_type,
      );
    }
    if (filter.entity_id) {
      filtered = filtered.filter(
        (token) => token.entity_id === filter.entity_id,
      );
    }
    if ("is_active" in filter) {
      filtered = filtered.filter(
        (token) => token.is_active === filter.is_active,
      );
    }

    return filtered;
  }

  async find_by_token(token: CalendarTokenValue): AsyncResult<CalendarToken> {
    try {
      const all_tokens = await this.database.calendar_tokens.toArray();
      const found_token = all_tokens.find(
        (t) => t.token === token && t.is_active,
      );
      if (!found_token) {
        return create_failure_result(
          build_calendar_token_not_found_error(token),
        );
      }
      return create_success_result(found_token);
    } catch (error) {
      console.warn("[CalendarTokenRepository] Failed to find token", {
        event: "repository_find_token_failed",
        error: String(error),
      });
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(`Failed to find token: ${error_message}`);
    }
  }

  async find_by_user(
    user_id: EntityId,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken> {
    return this.find_all({ user_id, is_active: true }, options);
  }

  async find_by_organization(
    organization_id: EntityId,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CalendarToken> {
    return this.find_all({ organization_id, is_active: true }, options);
  }

  async record_access(token: CalendarTokenValue): AsyncResult<CalendarToken> {
    try {
      const all_tokens = await this.database.calendar_tokens.toArray();
      const found_token = all_tokens.find((t) => t.token === token);

      if (!found_token) {
        return create_failure_result("Token not found");
      }

      const updated_token: CalendarToken = {
        ...found_token,
        last_accessed_at:
          new Date().toISOString() as CalendarToken["last_accessed_at"],
        access_count: found_token.access_count + 1,
        updated_at: new Date().toISOString() as CalendarToken["updated_at"],
      };

      await this.database.calendar_tokens.put(updated_token);
      return create_success_result(updated_token);
    } catch (error) {
      console.warn("[CalendarTokenRepository] Failed to record access", {
        event: "repository_record_access_failed",
        error: String(error),
      });
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(`Failed to record access: ${error_message}`);
    }
  }

  async deactivate_token(
    token: CalendarTokenValue,
  ): AsyncResult<CalendarToken> {
    try {
      const all_tokens = await this.database.calendar_tokens.toArray();
      const found_token = all_tokens.find((t) => t.token === token);

      if (!found_token) {
        return create_failure_result("Token not found");
      }

      const updated_token: CalendarToken = {
        ...found_token,
        is_active: false,
        updated_at: new Date().toISOString() as CalendarToken["updated_at"],
      };

      await this.database.calendar_tokens.put(updated_token);
      return create_success_result(updated_token);
    } catch (error) {
      console.warn("[CalendarTokenRepository] Failed to deactivate token", {
        event: "repository_deactivate_token_failed",
        error: String(error),
      });
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to deactivate token: ${error_message}`,
      );
    }
  }
}

type CalendarTokenRepositoryState =
  | { status: "uninitialized" }
  | { status: "ready"; repository: InBrowserCalendarTokenRepository };

let calendar_token_repository_state: CalendarTokenRepositoryState = {
  status: "uninitialized",
};

export function get_calendar_token_repository(): CalendarTokenRepository {
  if (calendar_token_repository_state.status === "ready") {
    return calendar_token_repository_state.repository;
  }

  const repository = new InBrowserCalendarTokenRepository();
  calendar_token_repository_state = { status: "ready", repository };

  return repository;
}
