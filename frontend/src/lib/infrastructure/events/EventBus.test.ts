import { beforeEach, describe, expect, it } from "vitest";

import { clear_user_context, EventBus } from "./EventBus";

beforeEach(() => {
  EventBus.clear_all_handlers();
  EventBus.enable();
  clear_user_context();
});

describe("subscribe and emit", () => {
  it("delivers emitted payload to subscribed handler", () => {
    const received = [] as unknown[];
    EventBus.subscribe("entity_created", (payload) => received.push(payload));

    EventBus.emit("entity_created", { some: "data" });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ some: "data" });
  });

  it("delivers to multiple handlers for the same event type", () => {
    const calls_a = [] as number[];
    const calls_b = [] as number[];
    EventBus.subscribe("entity_created", () => calls_a.push(1));
    EventBus.subscribe("entity_created", () => calls_b.push(1));

    EventBus.emit("entity_created", {});

    expect(calls_a).toHaveLength(1);
    expect(calls_b).toHaveLength(1);
  });

  it("does not deliver to handlers subscribed to a different event type", () => {
    const received = [] as unknown[];
    EventBus.subscribe("entity_deleted", (payload) => received.push(payload));

    EventBus.emit("entity_created", { some: "data" });

    expect(received).toHaveLength(0);
  });
});

describe("unsubscribe", () => {
  it("stops delivering events after unsubscribe is called", () => {
    const received = [] as unknown[];
    const subscription = EventBus.subscribe("entity_updated", (p) =>
      received.push(p),
    );

    EventBus.emit("entity_updated", { first: true });
    subscription.unsubscribe();
    EventBus.emit("entity_updated", { second: true });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ first: true });
  });

  it("unsubscribing one handler does not affect other handlers for the same event", () => {
    const calls_a = [] as number[];
    const calls_b = [] as number[];
    const subscription_a = EventBus.subscribe("entity_created", () =>
      calls_a.push(1),
    );
    EventBus.subscribe("entity_created", () => calls_b.push(1));

    subscription_a.unsubscribe();
    EventBus.emit("entity_created", {});

    expect(calls_a).toHaveLength(0);
    expect(calls_b).toHaveLength(1);
  });
});

describe("enable and disable", () => {
  it("does not deliver events while bus is disabled", () => {
    const received = [] as unknown[];
    EventBus.subscribe("entity_created", (p) => received.push(p));

    EventBus.disable();
    EventBus.emit("entity_created", { blocked: true });

    expect(received).toHaveLength(0);
  });

  it("resumes delivery after re-enabling", () => {
    const received = [] as unknown[];
    EventBus.subscribe("entity_created", (p) => received.push(p));

    EventBus.disable();
    EventBus.emit("entity_created", { blocked: true });
    EventBus.enable();
    EventBus.emit("entity_created", { delivered: true });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ delivered: true });
  });
});

describe("handler error isolation", () => {
  it("continues delivering to remaining handlers when one handler throws", () => {
    const safe_calls = [] as number[];
    EventBus.subscribe("entity_created", () => JSON.parse("{invalid"));
    EventBus.subscribe("entity_created", () => safe_calls.push(1));

    expect(() => EventBus.emit("entity_created", {})).not.toThrow();
    expect(safe_calls).toHaveLength(1);
  });
});

describe("clear_all_handlers", () => {
  it("removes all subscribed handlers", () => {
    const received = [] as unknown[];
    EventBus.subscribe("entity_created", (p) => received.push(p));
    EventBus.subscribe("entity_deleted", (p) => received.push(p));

    EventBus.clear_all_handlers();
    EventBus.emit("entity_created", {});
    EventBus.emit("entity_deleted", {});

    expect(received).toHaveLength(0);
  });
});
