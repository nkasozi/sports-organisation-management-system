export type EventHandler<T = unknown> = (payload: T) => unknown;

export interface EventSubscription {
  unsubscribe: () => void;
}

export interface EntityEventPayload {
  entity_type: string;
  entity_id: string;
  entity_display_name: string;
  entity_data: Record<string, unknown>;
  timestamp: string;
  user_context?: UserContext;
}

export interface EntityUpdatedPayload extends EntityEventPayload {
  old_entity_data: Record<string, unknown>;
  changed_fields: string[];
}

export type EntityCreatedPayload = EntityEventPayload;
export type EntityDeletedPayload = EntityEventPayload;

export interface AccessDeniedPayload {
  entity_type: string;
  entity_id: string;
  attempted_action: string;
  data_category: string;
  denial_reason: string;
  context?: string;
  timestamp: string;
  user_context?: UserContext & { role: string };
}

export interface PageViewedPayload {
  page_path: string;
  page_title: string;
  timestamp: string;
  user_context?: UserContext;
}

export type EventType =
  | "entity_created"
  | "entity_updated"
  | "entity_deleted"
  | "access_denied"
  | "page_viewed";

export interface UserContext {
  user_id: string;
  user_email: string;
  user_display_name: string;
  organization_id: string;
}
