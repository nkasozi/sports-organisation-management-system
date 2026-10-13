import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { create_failure_result, create_success_result } from "../types/Result";
import { load_calendar_events } from "./ActivityCalendarEvents";
import { ensure_default_categories_exist } from "./ActivityCategoryDefaults";

const DATE_RANGE = { start_date: "2026-01-01", end_date: "2026-01-31" };

describe("Activity best-effort flows", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows calendar events with fallback categories when categories fail", async () => {
    const activity_repository = {
      find_all: vi.fn().mockResolvedValue(
        create_success_result({
          items: [{ id: "a1", title: "Training", category_id: "c1" }],
        }),
      ),
    };
    const category_repository = {
      find_by_organization: vi
        .fn()
        .mockResolvedValue(create_failure_result("offline")),
    };

    const result = await load_calendar_events(
      activity_repository as never,
      category_repository as never,
      { organization_id: "org-1", date_range: DATE_RANGE } as never,
    );

    expect(result.success && result.data[0]).toMatchObject({
      id: "a1",
      category_name: "Unknown",
    });
  });

  it("fails calendar loading when activities cannot be read", async () => {
    const result = await load_calendar_events(
      {
        find_all: vi.fn().mockResolvedValue(create_failure_result("offline")),
      } as never,
      { find_by_organization: vi.fn() } as never,
      { organization_id: "org-1", date_range: DATE_RANGE } as never,
    );

    expect(result).toEqual(create_failure_result("offline"));
  });

  it("counts only the default categories that were created", async () => {
    const repository = {
      find_by_organization: vi
        .fn()
        .mockResolvedValue(create_success_result({ items: [] })),
      create: vi
        .fn()
        .mockResolvedValueOnce(create_failure_result("write failed"))
        .mockResolvedValue(create_success_result({})),
    };

    const result = await ensure_default_categories_exist(
      repository as never,
      "org-1",
    );

    const attempted = repository.create.mock.calls.length;
    expect(result).toEqual(
      create_success_result({ categories_created: attempted - 1 }),
    );
  });
});
