import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SportRepository } from "../interfaces/ports";
import { create_sport_use_cases } from "./SportUseCases";
import {
  create_mock_repository,
  create_test_sport,
  create_valid_input,
} from "./SportUseCases.test_support";

const LINEUP_TOO_BIG =
  "Maximum players per fixture must be <= maximum squad size";

describe("SportUseCases validation", () => {
  let mock_repository: SportRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("refuses to create a sport whose lineup is bigger than its squad", async () => {
    const result = await create_sport_use_cases(mock_repository).create(
      create_valid_input({ max_players_per_fixture: 30 }),
    );

    expect(result).toEqual({ success: false, error: LINEUP_TOO_BIG });
    expect(mock_repository.create).not.toHaveBeenCalled();
  });

  it("checks an update against the sport as it will be saved", async () => {
    vi.mocked(mock_repository.find_by_id).mockResolvedValue({
      success: true,
      data: create_test_sport({ max_squad_size: 12 }),
    });

    const result = await create_sport_use_cases(mock_repository).update(
      "sport-123",
      { max_players_per_fixture: 18 },
    );

    expect(result).toEqual({ success: false, error: LINEUP_TOO_BIG });
    expect(mock_repository.update).not.toHaveBeenCalled();
  });
});
