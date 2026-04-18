import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_activity_sync } from "./ActivitySyncUseCases";

describe("ActivitySyncUseCases", () => {
  const activity_category_repository = {
    find_by_category_type: vi.fn(),
  };
  const activity_repository = {
    create: vi.fn(),
    find_by_source: vi.fn(),
    update: vi.fn(),
  };
  const competition_repository = {
    find_by_organization: vi.fn(),
  };
  const fixture_repository = {};
  const team_repository = {};

  beforeEach(() => {
    activity_category_repository.find_by_category_type.mockReset();
    activity_repository.create.mockReset();
    activity_repository.find_by_source.mockReset();
    activity_repository.update.mockReset();
    competition_repository.find_by_organization.mockReset();
  });

  it("creates competition activities when lookup reports a not-found failure", async () => {
    activity_category_repository.find_by_category_type.mockResolvedValue({
      success: true,
      data: { items: [{ id: "category-1" }] },
    });
    competition_repository.find_by_organization.mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            end_date: "2024-01-02T00:00:00.000Z",
            id: "competition-1",
            location: "Main Field",
            name: "Premier League",
            start_date: "2024-01-01T00:00:00.000Z",
          },
        ],
      },
    });
    activity_repository.find_by_source.mockResolvedValue({
      success: false,
      error:
        "Activity not found: source_type=competition, source_id=competition-1",
    });
    activity_repository.create.mockResolvedValue({
      success: true,
      data: { id: "activity-1" },
    });

    const use_cases = create_activity_sync(
      activity_repository as never,
      activity_category_repository as never,
      competition_repository as never,
      fixture_repository as never,
      team_repository as never,
    );

    const result = await use_cases.sync_competitions_to_activities(
      "organization-1" as never,
    );

    expect(result).toEqual({
      success: true,
      data: { created: 1, updated: 0 },
    });
    expect(activity_repository.create).toHaveBeenCalledOnce();
    expect(activity_repository.update).not.toHaveBeenCalled();
  });
});
