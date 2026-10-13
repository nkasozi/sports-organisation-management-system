import { beforeEach, describe, expect, it } from "vitest";

import {
  clear_user_context,
  type EntityCreatedPayload,
  type EntityDeletedPayload,
  type EntityUpdatedPayload,
  EventBus,
  set_user_context,
} from "./EventBus";

beforeEach(() => {
  EventBus.clear_all_handlers();
  EventBus.enable();
  clear_user_context();
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
    expect(captured_payload?.user_context?.user_email).toBe(
      "alice@example.com",
    );
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
