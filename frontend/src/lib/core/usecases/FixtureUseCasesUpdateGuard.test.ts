import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FixtureRepository } from "../interfaces/ports";
import { create_fixture_use_cases } from "./FixtureUseCases";
import {
  create_mock_repository,
  create_test_fixture,
} from "./FixtureUseCases.test_support";

describe("fixture generic update respects the game lifecycle", () => {
  let repository: FixtureRepository;

  beforeEach(() => {
    repository = create_mock_repository();
    vi.mocked(repository.find_by_id).mockResolvedValue({
      success: true,
      data: create_test_fixture({ status: "in_progress", home_team_score: 1 }),
    });
    vi.mocked(repository.update).mockImplementation(async (_id, updates) => ({
      success: true,
      data: create_test_fixture(updates as never),
    }));
  });

  it("saves editable details and leaves unchanged live fields untouched", async () => {
    const result = await create_fixture_use_cases(repository).update(
      "fixture-123",
      { venue: "Annex", status: "in_progress", home_team_score: 1 },
    );
    expect(result.success).toBe(true);
    expect(repository.update).toHaveBeenCalledWith("fixture-123", {
      venue: "Annex",
    });
  });

  it("refuses to complete a game through a plain edit", async () => {
    const result = await create_fixture_use_cases(repository).update(
      "fixture-123",
      { status: "completed" },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/live game/i);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("refuses to overwrite the score through a plain edit", async () => {
    const result = await create_fixture_use_cases(repository).update(
      "fixture-123",
      { home_team_score: 5 },
    );
    expect(result.success).toBe(false);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("fails with a friendly message when the fixture cannot be found", async () => {
    vi.mocked(repository.find_by_id).mockResolvedValue({
      success: false,
      error: "missing",
    });
    const result = await create_fixture_use_cases(repository).update(
      "fixture-123",
      { venue: "Annex" },
    );
    expect(result.success).toBe(false);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("refuses to create a fixture that has already started", async () => {
    const result = await create_fixture_use_cases(repository).create({
      ...create_test_fixture(),
      status: "completed",
    } as never);
    expect(result.success).toBe(false);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
