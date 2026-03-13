import { beforeEach, describe, expect, it, vi } from "vitest";
import { create_competition_stage_lifecycle } from "./CompetitionStageLifecycle";
import type { CompetitionFormatRepository } from "../interfaces/ports";
import type { CompetitionStageRepository } from "../interfaces/ports";
import type { FixtureRepository } from "../interfaces/ports";
import type { CompetitionFormat } from "../entities/CompetitionFormat";

function create_mock_format_repository(): CompetitionFormatRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_format_type: vi.fn(),
    find_by_code: vi.fn(),
    find_active_formats: vi.fn(),
  };
}

function create_mock_stage_repository(): CompetitionStageRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_competition: vi.fn(),
  };
}

function create_mock_fixture_repository(): FixtureRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    create_many: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_competition: vi.fn(),
    find_by_team: vi.fn(),
    find_by_round: vi.fn(),
    find_upcoming: vi.fn(),
    find_by_date_range: vi.fn(),
  };
}

function create_test_format(
  overrides: Partial<CompetitionFormat> = {},
): CompetitionFormat {
  return {
    id: "format-123",
    name: "League",
    code: "league",
    description: "League format",
    format_type: "league",
    tie_breakers: ["goal_difference"],
    group_stage_config: null,
    knockout_stage_config: null,
    league_config: {
      number_of_rounds: 2,
      points_for_win: 3,
      points_for_draw: 1,
      points_for_loss: 0,
      promotion_spots: 0,
      relegation_spots: 0,
      playoff_spots: 0,
    },
    points_config: {
      points_for_win: 3,
      points_for_draw: 1,
      points_for_loss: 0,
    },
    stage_templates: [
      { name: "Round 1", stage_type: "league_stage", stage_order: 1 },
      { name: "Round 2", stage_type: "league_stage", stage_order: 2 },
    ],
    min_teams_required: 2,
    max_teams_allowed: 20,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

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
      data: {
        id: "stage-1",
        competition_id: "comp-123",
        name: "Round 1",
        stage_type: "league_stage",
        stage_order: 1,
        status: "active",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
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
        items: [
          {
            id: "stage-1",
            competition_id: "comp-123",
            name: "Round 1",
            stage_type: "league_stage",
            stage_order: 1,
            status: "active",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        ],
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
