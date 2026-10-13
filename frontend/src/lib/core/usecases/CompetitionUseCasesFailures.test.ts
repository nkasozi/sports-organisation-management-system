import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CompetitionRepository } from "../interfaces/ports";
import { create_failure_result, create_success_result } from "../types/Result";
import { COMPETITION_EVENT } from "./CompetitionConstants";
import {
  type CompetitionStageLifecyclePort,
  create_competition_use_cases_with_stage_lifecycle,
} from "./CompetitionUseCases";
import {
  create_mock_repository,
  create_mock_stage_lifecycle,
  create_test_competition,
  create_valid_input,
} from "./CompetitionUseCases.test_support";

const mocks = vi.hoisted(() => ({ emit_entity_deleted: vi.fn() }));

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_deleted: mocks.emit_entity_deleted },
}));

describe("CompetitionUseCases failure handling", () => {
  let repository: CompetitionRepository;
  let stage_lifecycle: CompetitionStageLifecyclePort;
  let error_spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    repository = create_mock_repository();
    stage_lifecycle = create_mock_stage_lifecycle();
    mocks.emit_entity_deleted.mockReset();
    error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function use_cases(): ReturnType<
    typeof create_competition_use_cases_with_stage_lifecycle
  > {
    return create_competition_use_cases_with_stage_lifecycle(
      repository,
      stage_lifecycle,
    );
  }

  it("logs a failed rollback and still reports the stage setup failure", async () => {
    vi.mocked(repository.create).mockResolvedValue(
      create_success_result(create_test_competition()),
    );
    vi.mocked(stage_lifecycle.ensure_stages_for_competition).mockResolvedValue(
      create_failure_result("Competition format not found"),
    );
    vi.mocked(repository.delete_by_id).mockResolvedValue(
      create_failure_result("Failed to delete competition"),
    );

    const result = await use_cases().create(create_valid_input());

    expect(result).toEqual(
      create_failure_result("Competition format not found"),
    );
    expect(repository.delete_by_id).toHaveBeenCalledWith("comp-123");
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: COMPETITION_EVENT.CREATE_ROLLBACK_FAILED,
        competition_id: "comp-123",
      }),
    );
  });

  it("returns a friendly not-found message when updating a missing competition", async () => {
    vi.mocked(repository.find_by_id).mockResolvedValue(
      create_failure_result("Entity with id 'comp-123' not found"),
    );

    const result = await use_cases().update("comp-123", { name: "Renamed" });

    expect(result).toEqual(create_failure_result("Competition not found"));
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("does not update when stage replacement is blocked", async () => {
    vi.mocked(repository.find_by_id).mockResolvedValue(
      create_success_result(create_test_competition()),
    );
    vi.mocked(
      stage_lifecycle.can_replace_stages_for_competition,
    ).mockResolvedValue(create_failure_result("Cannot change format"));

    const result = await use_cases().update("comp-123", {
      competition_format_id: "format-new",
    });

    expect(result).toEqual(create_failure_result("Cannot change format"));
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("emits deletions only for competitions that could be looked up", async () => {
    vi.mocked(repository.find_by_id)
      .mockResolvedValueOnce(create_success_result(create_test_competition()))
      .mockResolvedValueOnce(create_failure_result("missing"));
    vi.mocked(repository.delete_by_ids).mockResolvedValue(
      create_success_result(2),
    );

    const result = await use_cases().delete_competitions(["comp-123", "gone"]);

    expect(result).toEqual(create_success_result(2));
    expect(mocks.emit_entity_deleted).toHaveBeenCalledTimes(1);
  });

  it("emits nothing when the bulk delete fails", async () => {
    vi.mocked(repository.find_by_id).mockResolvedValue(
      create_success_result(create_test_competition()),
    );
    vi.mocked(repository.delete_by_ids).mockResolvedValue(
      create_failure_result("Failed to delete competitions"),
    );

    const result = await use_cases().delete_competitions(["comp-123"]);

    expect(result).toEqual(
      create_failure_result("Failed to delete competitions"),
    );
    expect(mocks.emit_entity_deleted).not.toHaveBeenCalled();
  });
});
