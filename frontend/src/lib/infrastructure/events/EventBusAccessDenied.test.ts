import { beforeEach, describe, expect, it } from "vitest";

import {
  type AccessDeniedPayload,
  clear_user_context,
  type EntityCreatedPayload,
  EventBus,
  set_user_context,
} from "./EventBus";

beforeEach(() => {
  EventBus.clear_all_handlers();
  EventBus.enable();
  clear_user_context();
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
      "public_viewer",
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
      "team_manager",
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
      "team_manager",
    );

    expect(captured?.user_context?.role).toBe("team_manager");
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

    expect(captured?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
