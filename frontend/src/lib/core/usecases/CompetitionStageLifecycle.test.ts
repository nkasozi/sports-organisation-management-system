import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CompetitionFormatRepository } from "../interfaces/ports";
import type { CompetitionStageRepository } from "../interfaces/ports";
import type { FixtureRepository } from "../interfaces/ports";
import { create_competition_stage_lifecycle } from "./CompetitionStageLifecycle";
import {
  create_mock_fixture_repository,
  create_mock_format_repository,
  create_mock_stage_repository,
  create_test_format,
  create_test_stage,
} from "./CompetitionStageLifecycle.test_support";

describe("CompetitionStageLifecycle", () => {
  let format_repository: CompetitionFormatRepository;
  let stage_repository: CompetitionStageRepository;
  let fixture_repository: FixtureRepository;
  let lifecycle: ReturnType<typeof create_competition_stage_lifecycle>;

  beforeEach(() => {
    format_repository = create_mock_format_repository();
    stage_repository = create_mock_stage_repository();
    fixture_repository = create_mock_fixture_repository();
    lifecycle = create_competition_stage_lifecycle(
      format_repository,
      stage_repository,
      fixture_repository,
    );
  });

  it("creates stages from format templates when competition has none", async () => {
    vi.mocked(stage_repository.find_by_competition).mockResolvedValue({
      success: true,
      data: {
        items: [],
        total_count: 0,
        page_number: 1,
        page_size: 100,
        total_pages: 0,
      },
    });
    vi.mocked(format_repository.find_by_id).mockResolvedValue({
      success: true,
      data: create_test_format(),
    });
    vi.mocked(stage_repository.create).mockResolvedValue({
      success: true,
      data: create_test_stage(),
    });

    const result = await lifecycle.ensure_stages_for_competition(
      "comp-123",
      "format-123",
    );

    expect(result.success).toBe(true);
    expect(stage_repository.create).toHaveBeenCalledTimes(2);
    expect(stage_repository.create).toHaveBeenNthCalledWith(1, {
      competition_id: "comp-123",
      name: "Round 1",
      stage_type: "league_stage",
      stage_order: 1,
      status: "active",
    });
  });

  it("does not recreate stages when competition already has them", async () => {
    vi.mocked(stage_repository.find_by_competition).mockResolvedValue({
      success: true,
      data: {
        items: [create_test_stage()],
        total_count: 1,
        page_number: 1,
        page_size: 100,
        total_pages: 1,
      },
    });

    const result = await lifecycle.ensure_stages_for_competition(
      "comp-123",
      "format-123",
    );

    expect(result.success).toBe(true);
    expect(stage_repository.create).not.toHaveBeenCalled();
  });

  it("blocks replacing stages when fixtures already exist", async () => {
    vi.mocked(fixture_repository.find_by_competition).mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            id: "fixture-1",
          },
        ] as never[],
        total_count: 1,
        page_number: 1,
        page_size: 1,
        total_pages: 1,
      },
    });

    const result = await lifecycle.replace_stages_for_competition(
      "comp-123",
      "format-123",
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Cannot change competition format");
    }
  });
});
