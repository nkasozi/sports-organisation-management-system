export const EVENT_TYPE = {
  ENTITY_CREATED: "entity_created",
  ENTITY_UPDATED: "entity_updated",
  ENTITY_DELETED: "entity_deleted",
  ENTITY_CHANGED: "entity_changed",
  ACCESS_DENIED: "access_denied",
  PAGE_VIEWED: "page_viewed",
} as const;

export const EVENT_BUS_LOG_EVENT = {
  HANDLER_ERROR: "event_bus_handler_error",
  ASYNC_HANDLER_ERROR: "event_bus_async_handler_error",
} as const;
