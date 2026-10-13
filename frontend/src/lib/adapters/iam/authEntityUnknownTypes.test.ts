import { describe, expect, it, vi } from "vitest";

import { select_actions_for_role } from "./authEntityActions";
import { evaluate_entity_permission } from "./authEntityCheck";

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_access_denied: vi.fn() },
}));

describe("entity types missing from the permission map", () => {
  it("allows no actions", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      select_actions_for_role("super_admin", "mysteryentity", "allowed"),
    ).toEqual([]);
  });

  it("is not authorized for any role", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      evaluate_entity_permission({
        role: "super_admin",
        entity_type: "mysteryentity",
        action: "read",
      }).is_authorized,
    ).toBe(false);
  });

  it("still allows known entity types", () => {
    expect(select_actions_for_role("super_admin", "team", "allowed")).toContain(
      "read",
    );
  });
});
