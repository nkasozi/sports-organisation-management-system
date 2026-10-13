import { describe, expect, it, vi } from "vitest";

import { evaluate_entity_permission } from "./authEntityCheck";

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_access_denied: vi.fn() },
}));

describe("entity permissions scoped to the caller's own records", () => {
  it("authorizes players to open create and delete for identifications", () => {
    for (const action of ["create", "update", "delete"] as const)
      expect(
        evaluate_entity_permission({
          role: "player",
          entity_type: "identification",
          action,
        }).is_authorized,
      ).toBe(true);
  });

  it("keeps denying roles without identification write rights", () => {
    expect(
      evaluate_entity_permission({
        role: "official",
        entity_type: "identification",
        action: "create",
      }).is_authorized,
    ).toBe(false);
  });
});
