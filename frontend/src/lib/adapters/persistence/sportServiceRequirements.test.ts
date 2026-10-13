import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Sport } from "../../core/entities/Sport";
import { sportService } from "./sportService";

const repo = vi.hoisted(() => ({
  create_sport: vi.fn(),
  delete_sport: vi.fn(),
  get_active_sports: vi.fn(),
  get_all_sports: vi.fn(),
  get_sport_by_code: vi.fn(),
  get_sport_by_id: vi.fn(),
  update_sport: vi.fn(),
}));

vi.mock("../repositories/InBrowserSportRepository", () => ({
  ...repo,
  is_sport_not_found_by_code_error: (error: string, code: string): boolean =>
    error === `Sport not found: code=${code.toLowerCase()}`,
}));

const NOT_FOUND_FAILURE = {
  success: false,
  error: "Entity with id 's1' not found",
};

describe("sportService deletes and requirements", () => {
  beforeEach(() => {
    Object.values(repo).forEach((mock) => mock.mockReset());
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deletes sports with validation and failure reporting", async () => {
    repo.delete_sport
      .mockResolvedValueOnce({ success: true, data: true })
      .mockResolvedValueOnce(NOT_FOUND_FAILURE);

    expect(await sportService.delete("")).toEqual({
      success: false,
      error: "Sport ID is required",
    });
    expect(await sportService.delete("s1")).toEqual({
      success: true,
      data: true,
    });
    expect(await sportService.delete("s1")).toEqual(NOT_FOUND_FAILURE);
    expect(console.error).toHaveBeenCalledWith(
      "[SportService] Failed to delete sport",
      expect.objectContaining({
        event: "sport_service_delete_sport_failed",
        sport_id: "s1",
      }),
    );
  });

  it("merges official requirement overrides and reports their source", () => {
    const sport = {
      official_requirements: [
        { role_id: "ref", minimum_count: 1 },
        { role_id: "judge", minimum_count: 1 },
      ],
    } as unknown as Sport;
    const overrides = [{ role_id: "ref", minimum_count: 2 }] as never[];

    expect(sportService.get_effective_official_requirements(sport)).toBe(
      sport.official_requirements,
    );
    expect(sportService.get_effective_official_requirements(sport, [])).toBe(
      sport.official_requirements,
    );
    expect(
      sportService.get_effective_official_requirements(sport, overrides),
    ).toEqual([
      { role_id: "ref", minimum_count: 2 },
      { role_id: "judge", minimum_count: 1 },
    ]);
    expect(sportService.get_official_requirement_source("ref", sport)).toBe(
      "sport",
    );
    expect(
      sportService.get_official_requirement_source("ref", sport, overrides),
    ).toBe("competition");
    expect(
      sportService.get_official_requirement_source("judge", sport, overrides),
    ).toBe("sport");
  });
});
