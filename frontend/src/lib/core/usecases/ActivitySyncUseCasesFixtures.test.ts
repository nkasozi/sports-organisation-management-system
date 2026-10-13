import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { build_activity_not_found_by_source_error } from "../interfaces/ports/external/repositories/ActivityRepository";
import {
  create_repositories,
  create_sync,
  FIXTURE,
  page,
} from "./ActivitySyncUseCases.test_support";

describe("ActivitySyncUseCases fixture sync flows", () => {
  let repositories: ReturnType<typeof create_repositories>;

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    repositories = create_repositories();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fails fixture sync without a category or fixtures", async () => {
    repositories.category.find_by_category_type.mockResolvedValueOnce(page([]));
    repositories.fixture.find_by_competition.mockResolvedValue({
      success: false,
      error: "no fixtures",
    });
    const sync = create_sync(repositories);

    expect(await sync.sync_fixtures_to_activities("o1", "c1")).toEqual({
      success: false,
      error:
        "Fixture category not found. Please ensure default categories are created.",
    });
    expect(await sync.sync_fixtures_to_activities("o1", "c1")).toEqual({
      success: false,
      error: "no fixtures",
    });
  });

  it("creates fixture activities with team names and TBD fallbacks", async () => {
    repositories.fixture.find_all.mockResolvedValue(page([FIXTURE]));
    repositories.activity.find_by_source.mockResolvedValue({
      success: false,
      error: build_activity_not_found_by_source_error("fixture", "f1"),
    });

    const result = await create_sync(repositories).sync_fixtures_to_activities(
      "o1",
      "",
    );

    expect(result).toEqual({ success: true, data: { created: 1, updated: 0 } });
    expect(repositories.fixture.find_all).toHaveBeenCalledWith(
      {},
      { page_size: 1000 },
    );
    expect(repositories.activity.create.mock.calls[0][0]).toMatchObject({
      title: "Lions vs TBD",
      start_datetime: new Date("2024-05-01T00:00").toISOString(),
      team_ids: ["t1", "t2"],
      location: "Field",
    });
  });

  it("updates existing fixture activities including team ids", async () => {
    repositories.fixture.find_by_competition.mockResolvedValue(page([FIXTURE]));
    repositories.activity.find_by_source.mockResolvedValue({
      success: true,
      data: { id: "a9" },
    });

    const result = await create_sync(repositories).sync_fixtures_to_activities(
      "o1",
      "c1",
    );

    expect(result).toEqual({ success: true, data: { created: 0, updated: 1 } });
    expect(repositories.activity.update.mock.calls[0][1]).toMatchObject({
      title: "Lions vs TBD",
      team_ids: ["t1", "t2"],
      location: "Field",
    });
  });
});
