import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_basketball_sport_preset,
  create_football_sport_preset,
  type CreateSportInput,
  type Sport,
} from "../../core/entities/Sport";
import type { ScalarInput } from "../../core/types/DomainScalars";
import { get_sport_by_id, sportService } from "./sportService";

const {
  create_sport_mock,
  delete_sport_mock,
  get_active_sports_mock,
  get_all_sports_mock,
  get_sport_by_code_mock,
  get_sport_by_id_mock,
  update_sport_mock,
} = vi.hoisted(() => ({
  create_sport_mock: vi.fn(),
  delete_sport_mock: vi.fn(),
  get_active_sports_mock: vi.fn(),
  get_all_sports_mock: vi.fn(),
  get_sport_by_code_mock: vi.fn(),
  get_sport_by_id_mock: vi.fn(),
  update_sport_mock: vi.fn(),
}));

vi.mock("../repositories/InBrowserSportRepository", () => ({
  create_sport: create_sport_mock,
  delete_sport: delete_sport_mock,
  get_active_sports: get_active_sports_mock,
  get_all_sports: get_all_sports_mock,
  get_sport_by_code: get_sport_by_code_mock,
  get_sport_by_id: get_sport_by_id_mock,
  is_sport_not_found_by_code_error: (error: string, code: string): boolean =>
    error === `Sport not found: code=${code.toLowerCase()}`,
  update_sport: update_sport_mock,
}));

function create_test_sport(overrides: Partial<ScalarInput<Sport>> = {}): Sport {
  const base_sport = create_football_sport_preset();

  return {
    id: "sport-123",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...base_sport,
    ...overrides,
  } as Sport;
}

function create_valid_input(
  overrides: Partial<CreateSportInput> = {},
): CreateSportInput {
  return {
    ...create_basketball_sport_preset(),
    ...overrides,
  } as CreateSportInput;
}

describe("sportService", () => {
  beforeEach(() => {
    create_sport_mock.mockReset();
    delete_sport_mock.mockReset();
    get_active_sports_mock.mockReset();
    get_all_sports_mock.mockReset();
    get_sport_by_code_mock.mockReset();
    get_sport_by_id_mock.mockReset();
    update_sport_mock.mockReset();
  });

  it("returns a failure result when repository get_by_id fails", async () => {
    get_sport_by_id_mock.mockResolvedValue({
      success: false,
      error: "Sport not found: id=sport-123",
    });

    await expect(get_sport_by_id("sport-123")).resolves.toEqual({
      success: false,
      error: "Sport not found: id=sport-123",
    });
  });

  it("creates a sport when the repository code lookup reports not found", async () => {
    const input = create_valid_input({ code: "BB" });

    get_sport_by_code_mock.mockResolvedValue({
      success: false,
      error: "Sport not found: code=bb",
    });
    create_sport_mock.mockResolvedValue({
      success: true,
      data: create_test_sport({
        name: "Basketball",
        code: "BB",
      }),
    });

    const result = await sportService.create(input);

    expect(result.success).toBe(true);
    if (!result.success || !result.data) {
      return;
    }

    expect(result.data.code).toBe("BB");
  });

  it("updates a sport when duplicate-code lookup reports not found", async () => {
    get_sport_by_id_mock.mockResolvedValue({
      success: true,
      data: create_test_sport({ id: "sport-123", code: "FB" }),
    });
    get_sport_by_code_mock.mockResolvedValue({
      success: false,
      error: "Sport not found: code=bb",
    });
    update_sport_mock.mockResolvedValue({
      success: true,
      data: create_test_sport({
        id: "sport-123",
        name: "Basketball",
        code: "BB",
      }),
    });

    const result = await sportService.update("sport-123", {
      code: "BB",
      name: "Basketball",
    });

    expect(result.success).toBe(true);
    if (!result.success || !result.data) {
      return;
    }

    expect(result.data.code).toBe("BB");
  });
});
