import { EventBus } from "./EventBus";
import { EVENT_TYPE } from "./eventBusConstants";
import type { EntityChangedPayload } from "./EventBusTypes";
import {
  build_user_context_fields,
  create_event_timestamp,
} from "./EventBusUserContext";

type EntityChange = Omit<EntityChangedPayload, "timestamp" | "user_context">;

export function emit_entity_changed(change: EntityChange): boolean {
  const payload: EntityChangedPayload = {
    ...change,
    timestamp: create_event_timestamp(),
    ...build_user_context_fields(),
  };
  EventBus.emit(EVENT_TYPE.ENTITY_CHANGED, payload);
  return true;
}
