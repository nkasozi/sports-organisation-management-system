import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { build_activity_not_found_by_source_error } from "../interfaces/ports/external/repositories/ActivityRepository";
import {
  create_repositories,
  create_sync,
  page,
} from "./ActivitySyncUseCases.test_support";

describe("ActivitySyncUseCases sync flows", () => {
  let repositories: ReturnType<typeof create_repositories>;

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    repositories = create_repositories();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fails competition sync without a category or competitions", async () => {
    repositories.category.find_by_category_type.mockResolvedValueOnce(page([]));
    repositories.competition.find_by_organization.mockResolvedValue({
      success: false,
      error: "no comps",
    });
    const sync = create_sync(repositories);

    expect(await sync.sync_competitions_to_activities("o1")).toEqual({
      success: false,
      error:
        "Competition category not found. Please ensure default categories are created.",
    });
    expect(await sync.sync_competitions_to_activities("o1")).toEqual({
      success: false,
      error: "no comps",
    });
  });

  it("updates existing, creates missing and skips failing competition lookups", async () => {
    repositories.competition.find_by_organization.mockResolvedValue(
      page([
        {
          id: "c1",
          name: "Cup",
          start_date: "s",
          end_date: "e",
          location: "L",
        },
        {
          id: "c2",
          name: "League",
          start_date: "s",
          end_date: "e",
          location: "",
        },
        {
          id: "c3",
          name: "Broken",
          start_date: "s",
          end_date: "e",
          location: "",
        },
      ]),
    );
    repositories.activity.find_by_source
      .mockResolvedValueOnce({ success: true, data: { id: "a1" } })
      .mockResolvedValueOnce({
        success: false,
        error: build_activity_not_found_by_source_error("competition", "c2"),
      })
      .mockResolvedValueOnce({ success: false, error: "db down" });

    const result =
      await create_sync(repositories).sync_competitions_to_activities("o1");

    expect(result).toEqual({ success: true, data: { created: 1, updated: 1 } });
    expect(repositories.activity.update).toHaveBeenCalledWith("a1", {
      title: "Cup",
      start_datetime: "s",
      end_datetime: "e",
      location: "L",
    });
    expect(repositories.activity.create).toHaveBeenCalledTimes(1);
  });

  it("does not count failed upserts", async () => {
    repositories.competition.find_by_organization.mockResolvedValue(
      page([
        { id: "c1", name: "Cup", start_date: "s", end_date: "e", location: "" },
      ]),
    );
    repositories.activity.find_by_source.mockResolvedValue({
      success: true,
      data: { id: "a1" },
    });
    repositories.activity.update.mockResolvedValue({
      success: false,
      error: "x",
    });

    expect(
      await create_sync(repositories).sync_competitions_to_activities("o1"),
    ).toEqual({
      success: true,
      data: { created: 0, updated: 0 },
    });
  });

  it("delegates activity lookups by source", async () => {
    repositories.activity.find_by_source.mockResolvedValue({
      success: true,
      data: { id: "a1" },
    });

    expect(
      await create_sync(repositories).find_activity_by_source("fixture", "f1"),
    ).toEqual({
      success: true,
      data: { id: "a1" },
    });
  });
});
