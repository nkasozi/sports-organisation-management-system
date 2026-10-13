import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type DemoEntityBatch,
  describe_person,
  seed_demo_entity_batch,
} from "./demoEntityBatchSeeder";

const mocks = vi.hoisted(() => ({ emit: vi.fn() }));

vi.mock("./seedingUserSetup", () => ({
  emit_entity_created_events: mocks.emit,
}));

type WidgetBatch = DemoEntityBatch<{ id: string }> & {
  seed: ReturnType<typeof vi.fn>;
};

function create_batch(seed_result: unknown): WidgetBatch {
  return {
    plural_label: "widgets",
    entity_type: "widget",
    entities: [{ id: "w1" }, { id: "w2" }],
    seed: vi.fn().mockResolvedValue(seed_result),
    describe_entity: (entity: { id: string }) => entity.id,
  };
}

describe("seed_demo_entity_batch", () => {
  let log_spy: ReturnType<typeof vi.spyOn>;
  let error_spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mocks.emit.mockReset();
    log_spy = vi.spyOn(console, "log").mockImplementation(() => {});
    error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    log_spy.mockRestore();
    error_spy.mockRestore();
  });

  it("seeds, emits created events and returns the entity count", async () => {
    const batch = create_batch({ success: true, data: 2 });

    const result = await seed_demo_entity_batch(batch);

    expect(result).toEqual({ success: true, data: 2 });
    expect(batch.seed).toHaveBeenCalledWith(batch.entities);
    expect(mocks.emit).toHaveBeenCalledWith(
      "widget",
      batch.entities,
      batch.describe_entity,
    );
    expect(log_spy).toHaveBeenCalledWith("[Seeding] Demo batch seeded", {
      event: "demo_batch_seeded",
      entity_type: "widget",
      count: 2,
    });
  });

  it("returns a user-safe failure and logs the technical error", async () => {
    const result = await seed_demo_entity_batch(
      create_batch({ success: false, error: "boom" }),
    );

    expect(result).toEqual({
      success: false,
      error: "Failed to seed demo widgets",
    });
    expect(error_spy).toHaveBeenCalledWith(
      "[Seeding] Demo batch seeding failed",
      expect.objectContaining({
        event: "demo_batch_seeding_failed",
        error_code: "initialization_demo_seeding_failed",
        entity_type: "widget",
        error: "boom",
      }),
    );
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it("describes people by full name", () => {
    expect(describe_person({ first_name: "Ann", last_name: "Lee" })).toBe(
      "Ann Lee",
    );
  });
});
