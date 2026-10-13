import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_basketball_sport_preset,
  type CreateSportInput,
  type Sport,
} from "../../core/entities/Sport";
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

const SPORT = {
  ...create_basketball_sport_preset(),
  id: "s1",
  code: "HOCKEY",
} as unknown as Sport;
const NOT_FOUND = (code: string): { success: false; error: string } => ({
  success: false,
  error: `Sport not found: code=${code.toLowerCase()}`,
});
const STORAGE_FAILURE = { success: false, error: "Failed to fetch entities" };

function valid_input(): CreateSportInput {
  return create_basketball_sport_preset() as CreateSportInput;
}

describe("sportService operations", () => {
  beforeEach(() => {
    Object.values(repo).forEach((mock) => mock.mockReset());
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists all and active sports or reports retrieval failures", async () => {
    repo.get_all_sports
      .mockResolvedValueOnce({ success: true, data: [SPORT] })
      .mockResolvedValueOnce(STORAGE_FAILURE);
    repo.get_active_sports
      .mockResolvedValueOnce({ success: true, data: [SPORT] })
      .mockResolvedValueOnce(STORAGE_FAILURE);

    expect(await sportService.get_all()).toEqual({
      success: true,
      data: [SPORT],
    });
    expect(await sportService.get_all()).toEqual(STORAGE_FAILURE);
    expect(await sportService.get_active()).toEqual({
      success: true,
      data: [SPORT],
    });
    expect(await sportService.get_active()).toEqual(STORAGE_FAILURE);
  });

  it("reads sports by id and code with input validation", async () => {
    repo.get_sport_by_code
      .mockResolvedValueOnce({ success: true, data: SPORT })
      .mockResolvedValueOnce({ success: false, error: "missing" })
      .mockResolvedValueOnce(STORAGE_FAILURE);
    repo.get_sport_by_id.mockResolvedValueOnce(STORAGE_FAILURE);

    expect(await sportService.get_by_id(" ")).toEqual({
      success: false,
      error: "Sport ID is required",
    });
    expect(await sportService.get_by_id("s1")).toEqual(STORAGE_FAILURE);
    expect(await sportService.get_by_code("")).toEqual({
      success: false,
      error: "Sport code is required",
    });
    expect(await sportService.get_by_code("H")).toEqual({
      success: true,
      data: SPORT,
    });
    expect(await sportService.get_by_code("H")).toEqual({
      success: false,
      error: "missing",
    });
    expect(await sportService.get_by_code("H")).toEqual(STORAGE_FAILURE);
  });

  it("rejects invalid, duplicate or unverifiable sports on create", async () => {
    const input = valid_input();
    repo.get_sport_by_code
      .mockResolvedValueOnce({ success: true, data: SPORT })
      .mockResolvedValueOnce({ success: false, error: "db down" })
      .mockResolvedValueOnce(NOT_FOUND(input.code));
    repo.create_sport.mockResolvedValueOnce({
      success: false,
      error: "write failed",
    });

    expect((await sportService.create({ ...input, name: "" })).success).toBe(
      false,
    );
    expect(await sportService.create(input)).toEqual({
      success: false,
      error: `Sport with code '${input.code}' already exists`,
    });
    expect(await sportService.create(input)).toEqual({
      success: false,
      error: "db down",
    });
    expect(await sportService.create(input)).toEqual({
      success: false,
      error: "write failed",
    });
  });

  it("validates update ids and existence", async () => {
    repo.get_sport_by_id
      .mockResolvedValueOnce({ success: false, error: "no sport" })
      .mockResolvedValueOnce(STORAGE_FAILURE);

    expect(await sportService.update("", {})).toEqual({
      success: false,
      error: "Sport ID is required",
    });
    expect(await sportService.update("s1", {})).toEqual({
      success: false,
      error: "no sport",
    });
    expect(await sportService.update("s1", {})).toEqual(STORAGE_FAILURE);
  });

  it("guards code changes against duplicates on update", async () => {
    repo.get_sport_by_id.mockResolvedValue({ success: true, data: SPORT });
    repo.get_sport_by_code
      .mockResolvedValueOnce({ success: true, data: { ...SPORT, id: "s2" } })
      .mockResolvedValueOnce({ success: false, error: "db down" })
      .mockResolvedValueOnce({ success: true, data: SPORT });
    repo.update_sport
      .mockResolvedValueOnce({ success: true, data: SPORT })
      .mockResolvedValueOnce({ success: false, error: "write failed" });

    expect(await sportService.update("s1", { code: "NEW" })).toEqual({
      success: false,
      error: "Sport with code 'NEW' already exists",
    });
    expect(await sportService.update("s1", { code: "NEW" })).toEqual({
      success: false,
      error: "db down",
    });
    expect(await sportService.update("s1", { code: "NEW" })).toEqual({
      success: true,
      data: SPORT,
    });
    expect(await sportService.update("s1", { code: "HOCKEY" })).toEqual({
      success: false,
      error: "write failed",
    });
    expect(repo.get_sport_by_code).toHaveBeenCalledTimes(3);
  });
});
