import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";

import { build_activity_not_found_by_source_error } from "../interfaces/ports/external/repositories/ActivityRepository";
import { create_failure_result, create_success_result } from "../types/Result";
import { sync_sources_to_activities } from "./ActivitySourceSync";
import { ACTIVITY_SYNC_EVENT } from "./ActivityUseCaseConstants";

const NOT_FOUND_ERROR = (id: string): string =>
  build_activity_not_found_by_source_error("fixture", id);

describe("sync_sources_to_activities", () => {
  let error_spy: Mock;

  beforeEach(() => {
    error_spy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {}) as unknown as Mock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("counts creates and updates, and logs skipped sources", async () => {
    const activity_repository = {
      find_by_source: vi
        .fn()
        .mockResolvedValueOnce(create_failure_result(NOT_FOUND_ERROR("s1")))
        .mockResolvedValueOnce(create_success_result({ id: "a2" }))
        .mockResolvedValueOnce(create_failure_result("database offline"))
        .mockResolvedValueOnce(create_failure_result(NOT_FOUND_ERROR("s4"))),
      create: vi
        .fn()
        .mockResolvedValueOnce(create_success_result({ id: "a1" }))
        .mockResolvedValueOnce(create_failure_result("write failed")),
      update: vi.fn().mockResolvedValue(create_success_result({ id: "a2" })),
    };

    const counts = await sync_sources_to_activities(
      activity_repository as never,
      "fixture",
      [{ id: "s1" }, { id: "s2" }, { id: "s3" }, { id: "s4" }] as never,
      async () => ({ activity_input: {} as never, update_fields: {} }),
    );

    expect(counts).toEqual({ created: 1, updated: 1 });
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: ACTIVITY_SYNC_EVENT.SOURCE_LOOKUP_FAILED,
        source_id: "s3",
      }),
    );
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: ACTIVITY_SYNC_EVENT.UPSERT_FAILED,
        source_id: "s4",
      }),
    );
  });
});
