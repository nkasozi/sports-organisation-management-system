import type {
  CalendarToken,
  CreateCalendarTokenInput,
  UpdateCalendarTokenInput,
  CalendarFeedType,
} from "../entities/CalendarToken";
import {
  generate_calendar_token,
  build_ical_feed_url,
  build_webcal_feed_url,
} from "../entities/CalendarToken";
import type {
  CalendarTokenRepository,
  CalendarTokenFilter,
} from "../interfaces/adapters/CalendarTokenRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  PaginatedResult,
} from "../types/Result";
import { create_success_result, create_failure_result } from "../types/Result";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import type {
  CalendarTokenUseCasesPort,
  CalendarFeedInfo,
} from "../interfaces/ports/CalendarTokenUseCasesPort";

export type CalendarTokenUseCases = CalendarTokenUseCasesPort;

const DEFAULT_REMINDER_MINUTES = 60;

export interface CalendarTokenUseCasesDependencies {
  calendar_token_repository: CalendarTokenRepository;
  get_base_url: () => string;
}

export function create_calendar_token_use_cases(
  dependencies: CalendarTokenUseCasesDependencies,
): CalendarTokenUseCases {
  const { calendar_token_repository, get_base_url } = dependencies;

  return {
    async list(
      filter?: CalendarTokenFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<CalendarToken>> {
      const result = await calendar_token_repository.find_by_filter(
        filter ?? {},
        options,
      );

      if (!result.success) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message:
            "error" in result ? result.error : "Failed to list tokens",
        };
      }

      const paginated_data = result.data as PaginatedResult<CalendarToken>;
      return {
        success: true,
        data: paginated_data.items,
        total_count: paginated_data.total_count,
      };
    },

    async get_by_id(id: string): Promise<EntityOperationResult<CalendarToken>> {
      const result = await calendar_token_repository.find_by_id(id);

      if (!result.success) {
        return {
          success: false,
          error_message:
            "error" in result ? result.error : "Failed to get token",
        };
      }

      if (!result.data) {
        return { success: false, error_message: "Calendar token not found" };
      }

      return { success: true, data: result.data };
    },

    async create(
      input: CreateCalendarTokenInput,
    ): Promise<EntityOperationResult<CalendarToken>> {
      const result = await calendar_token_repository.create(input);

      if (!result.success) {
        return {
          success: false,
          error_message:
            "error" in result ? result.error : "Failed to create token",
        };
      }

      return { success: true, data: result.data! };
    },

    async update(
      id: string,
      updates: UpdateCalendarTokenInput,
    ): Promise<EntityOperationResult<CalendarToken>> {
      const result = await calendar_token_repository.update(id, updates);

      if (!result.success) {
        return {
          success: false,
          error_message:
            "error" in result ? result.error : "Failed to update token",
        };
      }

      return { success: true, data: result.data! };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      const result = await calendar_token_repository.delete_by_id(id);

      if (!result.success) {
        return {
          success: false,
          error_message:
            "error" in result ? result.error : "Failed to delete token",
        };
      }

      return { success: true, data: true };
    },

    async create_feed(
      user_id: string,
      organization_id: string,
      feed_type: CalendarFeedType,
      entity_id: string | null,
      entity_name: string | null,
      reminder_minutes_before: number = DEFAULT_REMINDER_MINUTES,
    ): Promise<EntityOperationResult<CalendarFeedInfo>> {
      const token = generate_calendar_token();

      const input: CreateCalendarTokenInput = {
        token,
        user_id,
        organization_id,
        feed_type,
        entity_id,
        entity_name,
        reminder_minutes_before,
        is_active: true,
      };

      const create_result = await calendar_token_repository.create(input);

      if (!create_result.success || !create_result.data) {
        return {
          success: false,
          error_message:
            "error" in create_result
              ? create_result.error
              : "Failed to create calendar token",
        };
      }

      const base_url = get_base_url();

      return {
        success: true,
        data: {
          token: create_result.data,
          https_url: build_ical_feed_url(base_url, token),
          webcal_url: build_webcal_feed_url(base_url, token),
        },
      };
    },

    async list_user_feeds(
      user_id: string,
      options?: QueryOptions,
    ): PaginatedAsyncResult<CalendarToken> {
      return calendar_token_repository.find_by_user(user_id, options);
    },

    async get_feed_by_token(token: string): AsyncResult<CalendarToken | null> {
      return calendar_token_repository.find_by_token(token);
    },

    async revoke_feed(token: string): AsyncResult<CalendarToken> {
      return calendar_token_repository.deactivate_token(token);
    },

    async update_feed_settings(
      token: string,
      reminder_minutes_before: number,
    ): AsyncResult<CalendarToken> {
      const find_result = await calendar_token_repository.find_by_token(token);

      if (!find_result.success || !find_result.data) {
        return create_failure_result("Token not found");
      }

      return calendar_token_repository.update(find_result.data.id, {
        reminder_minutes_before,
      });
    },

    async record_feed_access(token: string): AsyncResult<CalendarToken> {
      return calendar_token_repository.record_access(token);
    },
  };
}
