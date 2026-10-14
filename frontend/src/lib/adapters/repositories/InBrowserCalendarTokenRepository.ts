import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CalendarToken,
  CreateCalendarTokenInput,
  UpdateCalendarTokenInput,
} from "../../core/entities/CalendarToken";
import { compute_calendar_token_expiry } from "../../core/entities/CalendarToken";
import { cap_calendar_token_expiry } from "../../core/entities/CalendarTokenLifetime";
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
import {
  apply_entity_filter_rules,
  type EntityFilterRule,
  equals_rule,
  FILTER_RULE_ACTIVATION,
} from "./InBrowserRepositoryFilterRules";
import {
  create_warning_failure_details,
  type RepositoryFailureDetails,
  run_repository_query,
} from "./InBrowserRepositoryQueryRunner";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
const ENTITY_PREFIX = "cal_token";
const TOKEN_NOT_FOUND_ERROR = "Token not found";

const TOKEN_FILTER_RULES: EntityFilterRule<
  CalendarToken,
  CalendarTokenFilter
>[] = [
  equals_rule("user_id"),
  equals_rule("organization_id"),
  equals_rule("feed_type"),
  equals_rule("entity_id"),
  equals_rule("is_active", FILTER_RULE_ACTIVATION.WHEN_KEY_PRESENT),
];

function describe_token_failure(
  summary: string,
  event_name: string,
): RepositoryFailureDetails {
  return create_warning_failure_details(
    `[CalendarTokenRepository] ${summary}`,
    `repository_${event_name}_failed`,
    summary.replace("Failed to ", ""),
  );
}

export class InBrowserCalendarTokenRepository
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
    const updated = { ...entity, ...updates } as CalendarToken;
    return {
      ...updated,
      expires_at: cap_calendar_token_expiry({
        expires_at: updated.expires_at,
        lifetime_started_at: entity.created_at,
      }),
    };
  }

  protected apply_entity_filter(
    entities: CalendarToken[],
    filter: CalendarTokenFilter,
  ): CalendarToken[] {
    return apply_entity_filter_rules(entities, filter, TOKEN_FILTER_RULES);
  }

  async find_by_token(token: CalendarTokenValue): AsyncResult<CalendarToken> {
    return run_repository_query(
      describe_token_failure("Failed to find token", "find_token"),
      async () => {
        const found_token = (
          await this.database.calendar_tokens.toArray()
        ).find((t) => t.token === token && t.is_active);
        return found_token
          ? create_success_result(found_token)
          : create_failure_result(build_calendar_token_not_found_error(token));
      },
    );
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
    return this.update_token_by_value(
      token,
      describe_token_failure("Failed to record access", "record_access"),
      (found_token) => ({
        ...found_token,
        last_accessed_at:
          new Date().toISOString() as CalendarToken["last_accessed_at"],
        access_count: found_token.access_count + 1,
      }),
    );
  }

  async deactivate_token(
    token: CalendarTokenValue,
  ): AsyncResult<CalendarToken> {
    return this.update_token_by_value(
      token,
      describe_token_failure("Failed to deactivate token", "deactivate_token"),
      (found_token) => ({ ...found_token, is_active: false }),
    );
  }

  private update_token_by_value(
    token: CalendarTokenValue,
    failure: RepositoryFailureDetails,
    change: (found_token: CalendarToken) => CalendarToken,
  ): AsyncResult<CalendarToken> {
    return run_repository_query(failure, async () => {
      const found_token = (await this.database.calendar_tokens.toArray()).find(
        (t) => t.token === token,
      );
      if (!found_token) return create_failure_result(TOKEN_NOT_FOUND_ERROR);
      const updated_token: CalendarToken = {
        ...change(found_token),
        updated_at: new Date().toISOString() as CalendarToken["updated_at"],
      };
      await this.database.calendar_tokens.put(updated_token);
      return create_success_result(updated_token);
    });
  }
}

export const get_calendar_token_repository: () => CalendarTokenRepository =
  create_lazy_repository_accessor(() => new InBrowserCalendarTokenRepository());
