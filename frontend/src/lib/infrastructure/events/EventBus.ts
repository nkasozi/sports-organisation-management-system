type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

interface EventSubscription {
  unsubscribe: () => void;
}

interface EntityEventPayload {
  entity_type: string;
  entity_id: string;
  entity_display_name: string;
  entity_data: Record<string, unknown>;
  timestamp: string;
  user_context?: {
    user_id: string;
    user_email: string;
    user_display_name: string;
  };
}

interface EntityUpdatedPayload extends EntityEventPayload {
  old_entity_data: Record<string, unknown>;
  changed_fields: string[];
}

export type EntityCreatedPayload = EntityEventPayload;
export type EntityDeletedPayload = EntityEventPayload;
export type { EntityUpdatedPayload };

export type EventType = "entity_created" | "entity_updated" | "entity_deleted";

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
            console.error(
              `[EventBus] Async handler error for ${event_type}:`,
              error,
            );
          });
        }
      } catch (error) {
        console.error(`[EventBus] Handler error for ${event_type}:`, error);
      }
    }
  }

  emit_entity_created(
    entity_type: string,
    entity_id: string,
    entity_display_name: string,
    entity_data: Record<string, unknown>,
  ): void {
    const payload: EntityCreatedPayload = {
      entity_type,
      entity_id,
      entity_display_name,
      entity_data,
      timestamp: new Date().toISOString(),
      user_context: get_current_user_context(),
    };
    this.emit("entity_created", payload);
  }

  emit_entity_updated(
    entity_type: string,
    entity_id: string,
    entity_display_name: string,
    old_entity_data: Record<string, unknown>,
    new_entity_data: Record<string, unknown>,
    changed_fields: string[],
  ): void {
    const payload: EntityUpdatedPayload = {
      entity_type,
      entity_id,
      entity_display_name,
      entity_data: new_entity_data,
      old_entity_data,
      changed_fields,
      timestamp: new Date().toISOString(),
      user_context: get_current_user_context(),
    };
    this.emit("entity_updated", payload);
  }

  emit_entity_deleted(
    entity_type: string,
    entity_id: string,
    entity_display_name: string,
    entity_data: Record<string, unknown>,
  ): void {
    const payload: EntityDeletedPayload = {
      entity_type,
      entity_id,
      entity_display_name,
      entity_data,
      timestamp: new Date().toISOString(),
      user_context: get_current_user_context(),
    };
    this.emit("entity_deleted", payload);
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

interface UserContext {
  user_id: string;
  user_email: string;
  user_display_name: string;
}

let current_user_context: UserContext | undefined;

export function set_user_context(context: UserContext | undefined): void {
  current_user_context = context;
}

export function get_current_user_context(): UserContext | undefined {
  return current_user_context;
}

export function clear_user_context(): void {
  current_user_context = undefined;
}

export const EventBus = new EventBusImpl();
