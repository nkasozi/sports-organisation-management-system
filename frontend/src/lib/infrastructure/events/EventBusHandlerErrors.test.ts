import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EventBus } from "./EventBus";
import { EVENT_BUS_LOG_EVENT, EVENT_TYPE } from "./eventBusConstants";

beforeEach(() => {
  EventBus.clear_all_handlers();
  EventBus.enable();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EventBus handler error logging", () => {
  it("logs a synchronous handler failure with the event type", () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    EventBus.subscribe(EVENT_TYPE.PAGE_VIEWED, () => JSON.parse("{invalid"));

    EventBus.emit(EVENT_TYPE.PAGE_VIEWED, {});

    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: EVENT_BUS_LOG_EVENT.HANDLER_ERROR,
        event_type: EVENT_TYPE.PAGE_VIEWED,
      }),
    );
  });

  it("logs a rejected async handler with the event type", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    EventBus.subscribe(EVENT_TYPE.ENTITY_DELETED, () =>
      Promise.reject(new Error("write failed")),
    );

    EventBus.emit(EVENT_TYPE.ENTITY_DELETED, {});
    await Promise.resolve();
    await Promise.resolve();

    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: EVENT_BUS_LOG_EVENT.ASYNC_HANDLER_ERROR,
        event_type: EVENT_TYPE.ENTITY_DELETED,
      }),
    );
  });
});
