export type {
  AccessDeniedPayload,
  EntityCreatedPayload,
  EntityDeletedPayload,
  EntityUpdatedPayload,
  PageViewedPayload,
  UserContext,
} from "./EventBusTypes";
import type {
  IsoDateTimeString,
  ScalarInput,
} from "$lib/core/types/DomainScalars";

import type {
  AccessDeniedPayload,
  EntityCreatedPayload,
  EntityDeletedPayload,
  EntityUpdatedPayload,
  EventHandler,
  EventSubscription,
  EventType,
  PageViewedPayload,
  UserContext,
} from "./EventBusTypes";

class EventBusImpl {
  private handlers: Map<EventType, Set<EventHandler<unknown>>> = new Map();
  private is_enabled: boolean = true;

  subscribe<T>(
    event_type: EventType,
    handler: EventHandler<T>,
  ): EventSubscription {
    const handlers_for_event = this.handlers.get(event_type) ?? new Set();
    handlers_for_event.add(handler as EventHandler<unknown>);
    this.handlers.set(event_type, handlers_for_event);

    return {
      unsubscribe: () => {
        handlers_for_event.delete(handler as EventHandler<unknown>);
      },
    };
  }

  emit<T>(event_type: EventType, payload: T): void {
    if (!this.is_enabled) return;

    const handlers_for_event = this.handlers.get(event_type);
    if (!handlers_for_event || handlers_for_event.size === 0) return;

    for (const handler of handlers_for_event) {
      try {
        const result = handler(payload);
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error("[EventBus] Async handler error", {
              event: "event_bus_async_handler_error",
              event_type,
              error: String(error),
            });
          });
        }
      } catch (error) {
        console.error("[EventBus] Handler error", {
          event: "event_bus_handler_error",
          event_type,
          error: String(error),
        });
      }
    }
  }

  emit_entity_created(
    entity_type: EntityCreatedPayload["entity_type"],
    entity_id: ScalarInput<EntityCreatedPayload>["entity_id"],
    entity_display_name: EntityCreatedPayload["entity_display_name"],
    entity_data: EntityCreatedPayload["entity_data"],
  ): void {
    const payload: EntityCreatedPayload = {
      entity_type,
      entity_id: entity_id as EntityCreatedPayload["entity_id"],
      entity_display_name,
      entity_data,
      timestamp: create_event_timestamp(),
      user_context: get_current_user_context(),
    };
    this.emit("entity_created", payload);
  }

  emit_entity_updated(
    entity_type: EntityUpdatedPayload["entity_type"],
    entity_id: ScalarInput<EntityUpdatedPayload>["entity_id"],
    entity_display_name: EntityUpdatedPayload["entity_display_name"],
    old_entity_data: EntityUpdatedPayload["old_entity_data"],
    new_entity_data: EntityUpdatedPayload["entity_data"],
    changed_fields: EntityUpdatedPayload["changed_fields"],
  ): void {
    const payload: EntityUpdatedPayload = {
      entity_type,
      entity_id: entity_id as EntityUpdatedPayload["entity_id"],
      entity_display_name,
      entity_data: new_entity_data,
      old_entity_data,
      changed_fields,
      timestamp: create_event_timestamp(),
      user_context: get_current_user_context(),
    };
    this.emit("entity_updated", payload);
  }

  emit_entity_deleted(
    entity_type: EntityDeletedPayload["entity_type"],
    entity_id: ScalarInput<EntityDeletedPayload>["entity_id"],
    entity_display_name: EntityDeletedPayload["entity_display_name"],
    entity_data: EntityDeletedPayload["entity_data"],
  ): void {
    const payload: EntityDeletedPayload = {
      entity_type,
      entity_id: entity_id as EntityDeletedPayload["entity_id"],
      entity_display_name,
      entity_data,
      timestamp: create_event_timestamp(),
      user_context: get_current_user_context(),
    };
    this.emit("entity_deleted", payload);
  }

  emit_access_denied(
    entity_type: string,
    entity_id: string,
    attempted_action: string,
    data_category: string,
    denial_reason: string,
    role: NonNullable<AccessDeniedPayload["user_context"]>["role"],
    context?: string,
  ): void {
    const base_context = get_current_user_context();
    const payload: AccessDeniedPayload = {
      entity_type,
      entity_id,
      attempted_action,
      data_category,
      denial_reason,
      context,
      timestamp: create_event_timestamp(),
      user_context: base_context ? { ...base_context, role } : undefined,
    };
    this.emit("access_denied", payload);
  }

  emit_page_viewed(page_path: string, page_title: string): void {
    const payload: PageViewedPayload = {
      page_path,
      page_title,
      timestamp: create_event_timestamp(),
      user_context: get_current_user_context(),
    };
    this.emit("page_viewed", payload);
  }

  enable(): void {
    this.is_enabled = true;
  }

  disable(): void {
    this.is_enabled = false;
  }

  clear_all_handlers(): void {
    this.handlers.clear();
  }
}

let current_user_context: UserContext | undefined;

function create_event_timestamp(): IsoDateTimeString {
  return new Date().toISOString() as IsoDateTimeString;
}

export function set_user_context(
  context: UserContext | ScalarInput<UserContext> | undefined,
): void {
  current_user_context = context as UserContext | undefined;
}

function get_current_user_context(): UserContext | undefined {
  return current_user_context;
}

export function clear_user_context(): void {
  current_user_context = undefined;
}

export const EventBus = new EventBusImpl();
