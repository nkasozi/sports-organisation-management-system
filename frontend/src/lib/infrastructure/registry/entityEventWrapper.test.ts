import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import { EventBus } from "$lib/infrastructure/events/EventBus";

import { wrap_use_cases_with_events } from "./entityEventWrapper";
import type { GenericEntityUseCases } from "./entityUseCasesRegistry";
import { REGISTRY_LOG_EVENT } from "./registryConstants";

const ENTITY = { id: "team-1", name: "City FC" } as unknown as BaseEntity;

function create_use_cases(
  get_by_id: GenericEntityUseCases["get_by_id"],
): GenericEntityUseCases {
  return {
    create: vi.fn(async () => create_success_result(ENTITY)),
    get_by_id,
    list: vi.fn(),
    update: vi.fn(async () =>
      create_success_result({ ...ENTITY, name: "Town FC" } as BaseEntity),
    ),
    delete: vi.fn(async () => create_success_result(true)),
  } as unknown as GenericEntityUseCases;
}

beforeEach(() => {
  EventBus.clear_all_handlers();
  EventBus.enable();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("wrap_use_cases_with_events", () => {
  it("emits an update event with the changed fields", async () => {
    const emit_spy = vi.spyOn(EventBus, "emit_entity_updated");
    const wrapped = wrap_use_cases_with_events(
      "team",
      create_use_cases(async () => create_success_result(ENTITY)),
    );

    const result = await wrapped.update("team-1", { name: "Town FC" });

    expect(result.success).toBe(true);

    expect(emit_spy).toHaveBeenCalledWith(
      "team",
      "team-1",
      expect.any(String),
      expect.any(Object),
      expect.any(Object),
      ["name"],
    );
  });

  it("logs a warning and still deletes when the previous entity is unavailable", async () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const emit_spy = vi.spyOn(EventBus, "emit_entity_deleted");
    const wrapped = wrap_use_cases_with_events(
      "team",
      create_use_cases(async () =>
        create_failure_result("Failed to load team"),
      ),
    );

    const result = await wrapped.delete("team-1");

    expect(result).toEqual({ success: true, data: true });
    expect(emit_spy).not.toHaveBeenCalled();
    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: REGISTRY_LOG_EVENT.PREVIOUS_ENTITY_UNAVAILABLE,
        entity_id: "team-1",
      }),
    );
  });
});
