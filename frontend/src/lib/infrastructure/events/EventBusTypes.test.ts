import { describe, expectTypeOf, it } from "vitest";

import type {
  AccessDeniedPayload,
  EntityCreatedPayload,
  EntityDeletedPayload,
  EntityEventPayload,
  EntityUpdatedPayload,
  EventHandler,
  EventSubscription,
  EventType,
  PageViewedPayload,
  UserContext,
} from "./EventBusTypes";

describe("EventBusTypes", () => {
  it("exports the event bus type contracts", () => {
    expectTypeOf<EventType>().toEqualTypeOf<EventType>();
    expectTypeOf<EventHandler>().toEqualTypeOf<EventHandler>();
    expectTypeOf<EventSubscription>().toEqualTypeOf<EventSubscription>();
    expectTypeOf<EntityEventPayload>().toEqualTypeOf<EntityEventPayload>();
    expectTypeOf<EntityUpdatedPayload>().toEqualTypeOf<EntityUpdatedPayload>();
    expectTypeOf<EntityCreatedPayload>().toEqualTypeOf<EntityCreatedPayload>();
    expectTypeOf<EntityDeletedPayload>().toEqualTypeOf<EntityDeletedPayload>();
    expectTypeOf<AccessDeniedPayload>().toEqualTypeOf<AccessDeniedPayload>();
    expectTypeOf<PageViewedPayload>().toEqualTypeOf<PageViewedPayload>();
    expectTypeOf<UserContext>().toEqualTypeOf<UserContext>();
  });
});
