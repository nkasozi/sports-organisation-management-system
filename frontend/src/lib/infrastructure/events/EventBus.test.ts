import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  EventBus,
  set_user_context,
  clear_user_context,
  type EntityCreatedPayload,
  type EntityUpdatedPayload,
  type EntityDeletedPayload,
  type AccessDeniedPayload,
} from "./EventBus";

beforeEach(() => {
  EventBus.clear_all_handlers();
  EventBus.enable();
  clear_user_context();
});

describe("subscribe and emit", () => {
  it("delivers emitted payload to subscribed handler", () => {
    const received: unknown[] = [];
    EventBus.subscribe("entity_created", (payload) => received.push(payload));

    EventBus.emit("entity_created", { some: "data" });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ some: "data" });
  });

  it("delivers to multiple handlers for the same event type", () => {
    const calls_a: number[] = [];
    const calls_b: number[] = [];
    EventBus.subscribe("entity_created", () => calls_a.push(1));
    EventBus.subscribe("entity_created", () => calls_b.push(1));

    EventBus.emit("entity_created", {});

    expect(calls_a).toHaveLength(1);
    expect(calls_b).toHaveLength(1);
  });

  it("does not deliver to handlers subscribed to a different event type", () => {
    const received: unknown[] = [];
    EventBus.subscribe("entity_deleted", (payload) => received.push(payload));

    EventBus.emit("entity_created", { some: "data" });

    expect(received).toHaveLength(0);
  });
});

describe("unsubscribe", () => {
  it("stops delivering events after unsubscribe is called", () => {
    const received: unknown[] = [];
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
    const calls_a: number[] = [];
    const calls_b: number[] = [];
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
    const received: unknown[] = [];
    EventBus.subscribe("entity_created", (p) => received.push(p));

    EventBus.disable();
    EventBus.emit("entity_created", { blocked: true });

    expect(received).toHaveLength(0);
  });

  it("resumes delivery after re-enabling", () => {
    const received: unknown[] = [];
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
    const safe_calls: number[] = [];
    EventBus.subscribe("entity_created", () => {
      throw new Error("handler exploded");
    });
    EventBus.subscribe("entity_created", () => safe_calls.push(1));

    expect(() => EventBus.emit("entity_created", {})).not.toThrow();
    expect(safe_calls).toHaveLength(1);
  });
});

describe("clear_all_handlers", () => {
  it("removes all subscribed handlers", () => {
    const received: unknown[] = [];
    EventBus.subscribe("entity_created", (p) => received.push(p));
    EventBus.subscribe("entity_deleted", (p) => received.push(p));

    EventBus.clear_all_handlers();
    EventBus.emit("entity_created", {});
    EventBus.emit("entity_deleted", {});

    expect(received).toHaveLength(0);
  });
});

describe("user context in payloads", () => {
  it("emit_entity_created includes set user_context in payload", () => {
    const context = {
      user_id: "u-1",
      user_email: "alice@example.com",
      user_display_name: "Alice",
      organization_id: "org-1",
    };
    set_user_context(context);

    let captured_payload: EntityCreatedPayload | undefined;
    EventBus.subscribe<EntityCreatedPayload>("entity_created", (p) => {
      captured_payload = p;
    });

    EventBus.emit_entity_created("Team", "team-1", "Harare City", {});

    expect(captured_payload?.user_context?.user_id).toBe("u-1");
    expect(captured_payload?.user_context?.user_email).toBe("alice@example.com");
  });

  it("emit_entity_created has no user_context when context has been cleared", () => {
    clear_user_context();

    let captured_payload: EntityCreatedPayload | undefined;
    EventBus.subscribe<EntityCreatedPayload>("entity_created", (p) => {
      captured_payload = p;
    });

    EventBus.emit_entity_created("Team", "team-1", "Harare City", {});

    expect(captured_payload?.user_context).toBeUndefined();
  });
});

describe("emit_entity_created", () => {
  it("emits an entity_created event with correct fields", () => {
    let captured: EntityCreatedPayload | undefined;
    EventBus.subscribe<EntityCreatedPayload>("entity_created", (p) => {
      captured = p;
    });

    EventBus.emit_entity_created("Player", "player-1", "John Doe", {
      age: 25,
    });

    expect(captured?.entity_type).toBe("Player");
    expect(captured?.entity_id).toBe("player-1");
    expect(captured?.entity_display_name).toBe("John Doe");
    expect(captured?.entity_data).toEqual({ age: 25 });
    expect(captured?.timestamp).toBeTruthy();
  });
});

describe("emit_entity_updated", () => {
  it("emits entity_updated event with correct changed_fields and data", () => {
    let captured: EntityUpdatedPayload | undefined;
    EventBus.subscribe<EntityUpdatedPayload>("entity_updated", (p) => {
      captured = p;
    });

    EventBus.emit_entity_updated(
      "Team",
      "team-1",
      "City FC",
      { name: "Old Name" },
      { name: "New Name" },
      ["name"],
    );

    expect(captured?.entity_type).toBe("Team");
    expect(captured?.changed_fields).toEqual(["name"]);
    expect(captured?.old_entity_data).toEqual({ name: "Old Name" });
    expect(captured?.entity_data).toEqual({ name: "New Name" });
  });
});

describe("emit_entity_deleted", () => {
  it("emits entity_deleted event with correct fields", () => {
    let captured: EntityDeletedPayload | undefined;
    EventBus.subscribe<EntityDeletedPayload>("entity_deleted", (p) => {
      captured = p;
    });

    EventBus.emit_entity_deleted("Competition", "comp-1", "League Cup", {
      format: "knockout",
    });

    expect(captured?.entity_type).toBe("Competition");
    expect(captured?.entity_id).toBe("comp-1");
    expect(captured?.entity_display_name).toBe("League Cup");
  });
});

describe("emit_access_denied", () => {
  it("emits access_denied event with correct fields", () => {
    let captured: AccessDeniedPayload | undefined;
    EventBus.subscribe<AccessDeniedPayload>("access_denied", (p) => {
      captured = p;
    });

    EventBus.emit_access_denied(
      "Player",
      "player-99",
      "read",
      "player_data",
      "insufficient_permissions",
      "viewer",
      "attempted cross-org access",
    );

    expect(captured?.entity_type).toBe("Player");
    expect(captured?.attempted_action).toBe("read");
    expect(captured?.denial_reason).toBe("insufficient_permissions");
    expect(captured?.context).toBe("attempted cross-org access");
  });

  it("emit_access_denied without context omits context field", () => {
    let captured: AccessDeniedPayload | undefined;
    EventBus.subscribe<AccessDeniedPayload>("access_denied", (p) => {
      captured = p;
    });

    EventBus.emit_access_denied(
      "Team",
      "team-1",
      "delete",
      "team_data",
      "role_too_low",
      "editor",
    );

    expect(captured?.context).toBeUndefined();
  });

  it("includes role in user_context when set", () => {
    set_user_context({
      user_id: "u-2",
      user_email: "bob@example.com",
      user_display_name: "Bob",
      organization_id: "org-2",
    });

    let captured: AccessDeniedPayload | undefined;
    EventBus.subscribe<AccessDeniedPayload>("access_denied", (p) => {
      captured = p;
    });

    EventBus.emit_access_denied(
      "Team",
      "team-1",
      "delete",
      "team_data",
      "role_too_low",
      "editor",
    );

    expect(captured?.user_context?.role).toBe("editor");
    expect(captured?.user_context?.user_id).toBe("u-2");
  });
});

describe("emit adds a timestamp to convenience payloads", () => {
  it("timestamp is an ISO date string", () => {
    let captured: EntityCreatedPayload | undefined;
    EventBus.subscribe<EntityCreatedPayload>("entity_created", (p) => {
      captured = p;
    });

    EventBus.emit_entity_created("Sport", "sport-1", "Hockey", {});

    expect(captured?.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
  });
});
