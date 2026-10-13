import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { create_failure_result, create_success_result } from "../types/Result";
import {
  check_stage_has_no_linked_fixtures,
  reorder_stages,
} from "./CompetitionStageOrdering";

describe("CompetitionStageOrdering", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks stage deletion when the linked fixture check fails", async () => {
    const fixture_repository = {
      find_all: vi.fn().mockResolvedValue(create_failure_result("offline")),
    };

    const result = await check_stage_has_no_linked_fixtures(
      fixture_repository as never,
      "stage-1",
    );

    expect(result).toEqual(
      create_failure_result(
        "Something went wrong while saving or loading data. Please try again.",
      ),
    );
  });

  it("allows stage deletion when no fixtures are linked", async () => {
    const fixture_repository = {
      find_all: vi
        .fn()
        .mockResolvedValue(
          create_success_result({ items: [], total_count: 0 }),
        ),
    };

    expect(
      await check_stage_has_no_linked_fixtures(
        fixture_repository as never,
        "stage-1",
      ),
    ).toEqual(create_success_result(true));
  });

  it("names the stage whose order could not be saved", async () => {
    const repository = {
      update: vi
        .fn()
        .mockResolvedValueOnce(create_success_result({}))
        .mockResolvedValueOnce(create_failure_result("write failed")),
    };

    const result = await reorder_stages(repository as never, "comp-1", [
      "stage-1",
      "stage-2",
    ]);

    expect(result).toEqual(
      create_failure_result(
        "Failed to update stage order for stage stage-2: write failed",
      ),
    );
  });
});
