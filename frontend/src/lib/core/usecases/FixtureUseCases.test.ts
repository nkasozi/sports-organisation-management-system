import { describe, it, expect, vi, beforeEach } from "vitest";
import { create_fixture_use_cases } from "./FixtureUseCases";
import type { FixtureRepository } from "../interfaces/adapters/FixtureRepository";
import type {
  Fixture,
  CreateFixtureInput,
  GameEvent,
} from "../entities/Fixture";

function create_mock_repository(): FixtureRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_filter: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    find_by_competition: vi.fn(),
    find_by_team: vi.fn(),
    find_by_round: vi.fn(),
    find_upcoming: vi.fn(),
    create_many: vi.fn(),
    find_by_date_range: vi.fn(),
    find_by_ids: vi.fn(),
    count: vi.fn(),
  };
}

function create_test_fixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: "fixture-123",
    competition_id: "comp-123",
    home_team_id: "team-1",
    away_team_id: "team-2",
    venue: "venue-123",
    scheduled_date: "2024-06-15",
    scheduled_time: "15:00",
    round_number: 1,
    round_name: "Round 1",
    match_day: 1,
    status: "scheduled",
    home_team_score: 0,
    away_team_score: 0,
    game_events: [],
    assigned_officials: [],
    current_period: "pre_game" as const,
    current_minute: 0,
    notes: "",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_valid_input(
  overrides: Partial<CreateFixtureInput> = {},
): CreateFixtureInput {
  return {
    competition_id: "comp-123",
    home_team_id: "team-1",
    away_team_id: "team-2",
    venue: "venue-123",
    scheduled_date: "2024-06-15",
    scheduled_time: "15:00",
    round_number: 1,
    round_name: "Round 1",
    match_day: 1,
    status: "scheduled",
    assigned_officials: [],
    notes: "",
    ...overrides,
  };
}

describe("FixtureUseCases", () => {
  let mock_repository: FixtureRepository;
  let use_cases: ReturnType<typeof create_fixture_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_fixture_use_cases(mock_repository);
  });

  describe("list", () => {
    it("should return all fixtures when no filter", async () => {
      const fixtures = [
        create_test_fixture({ id: "1" }),
        create_test_fixture({ id: "2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: true,
        data: {
          items: fixtures,
          total_count: 2,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("should apply filter when provided", async () => {
      const filter = { competition_id: "comp-123" };
      vi.mocked(mock_repository.find_by_filter).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_fixture()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list(filter);

      expect(mock_repository.find_by_filter).toHaveBeenCalledWith(
        filter,
        undefined,
      );
    });
  });

  describe("get_by_id", () => {
    it("should return fixture when found", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture(),
      });

      const result = await use_cases.get_by_id("fixture-123");

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      expect(result.error_message).toBe("Fixture ID is required");
    });
  });

  describe("create", () => {
    it("should create with valid input", async () => {
      const input = create_valid_input();
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_fixture(),
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
    });

    it("should fail for missing competition_id", async () => {
      const input = create_valid_input({ competition_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });

    it("should fail when home and away team are same", async () => {
      const input = create_valid_input({
        home_team_id: "team-1",
        away_team_id: "team-1",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
    });
  });

  describe("list_fixtures_by_competition", () => {
    it("should return fixtures for competition", async () => {
      vi.mocked(mock_repository.find_by_competition).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_fixture()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_fixtures_by_competition("comp-123");

      expect(result.success).toBe(true);
      expect(mock_repository.find_by_competition).toHaveBeenCalledWith(
        "comp-123",
        undefined,
      );
    });

    it("should fail for empty competition_id", async () => {
      const result = await use_cases.list_fixtures_by_competition("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_fixtures_by_team", () => {
    it("should return fixtures for team", async () => {
      vi.mocked(mock_repository.find_by_team).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_fixture()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_fixtures_by_team("team-1");

      expect(result.success).toBe(true);
    });

    it("should fail for empty team_id", async () => {
      const result = await use_cases.list_fixtures_by_team("");

      expect(result.success).toBe(false);
    });
  });

  describe("list_fixtures_by_round", () => {
    it("should return fixtures for round", async () => {
      vi.mocked(mock_repository.find_by_round).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_fixture()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.list_fixtures_by_round("comp-123", 1);

      expect(result.success).toBe(true);
    });

    it("should fail for empty competition_id", async () => {
      const result = await use_cases.list_fixtures_by_round("", 1);

      expect(result.success).toBe(false);
    });

    it("should fail for round less than 1", async () => {
      const result = await use_cases.list_fixtures_by_round("comp-123", 0);

      expect(result.success).toBe(false);
    });
  });

  describe("generate_fixtures", () => {
    it("should generate fixtures with valid config", async () => {
      vi.mocked(mock_repository.create_many).mockResolvedValue({
        success: true,
        data: {
          items: [create_test_fixture()],
          total_count: 1,
          page_number: 1,
          page_size: 10,
          total_pages: 1,
        },
      });

      const result = await use_cases.generate_fixtures({
        competition_id: "comp-123",
        team_ids: ["team-1", "team-2", "team-3", "team-4"],
        start_date: "2024-06-01",
        match_days_per_week: [0, 3, 6],
        default_time: "15:00",
        venue_rotation: "home_away",
        rounds: 1,
      });

      expect(result.success).toBe(true);
    });

    it("should fail for missing competition_id", async () => {
      const result = await use_cases.generate_fixtures({
        competition_id: "",
        team_ids: ["team-1", "team-2"],
        start_date: "2024-06-01",
        match_days_per_week: [0, 3, 6],
        default_time: "15:00",
        venue_rotation: "home_away",
        rounds: 1,
      });

      expect(result.success).toBe(false);
    });

    it("should fail for less than 2 teams", async () => {
      const result = await use_cases.generate_fixtures({
        competition_id: "comp-123",
        team_ids: ["team-1"],
        start_date: "2024-06-01",
        match_days_per_week: [0, 3, 6],
        default_time: "15:00",
        venue_rotation: "home_away",
        rounds: 1,
      });

      expect(result.success).toBe(false);
    });

    it("should fail for missing start_date", async () => {
      const result = await use_cases.generate_fixtures({
        competition_id: "comp-123",
        team_ids: ["team-1", "team-2"],
        start_date: "",
        match_days_per_week: [0, 3, 6],
        default_time: "15:00",
        venue_rotation: "home_away",
        rounds: 1,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("update_fixture_score", () => {
    it("should update score", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_fixture({ home_team_score: 2, away_team_score: 1 }),
      });

      const result = await use_cases.update_fixture_score("fixture-123", 2, 1);

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update_fixture_score("", 1, 0);

      expect(result.success).toBe(false);
    });

    it("should fail for negative scores", async () => {
      const result = await use_cases.update_fixture_score("fixture-123", -1, 0);

      expect(result.success).toBe(false);
    });
  });

  describe("start_fixture", () => {
    it("should start fixture", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_fixture({ status: "in_progress" }),
      });

      const result = await use_cases.start_fixture("fixture-123");

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        "fixture-123",
        expect.objectContaining({
          status: "in_progress",
          current_period: "first_half",
        }),
      );
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.start_fixture("");

      expect(result.success).toBe(false);
    });
  });

  describe("record_game_event", () => {
    it("should record goal event and update score", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture({
          home_team_score: 0,
          away_team_score: 0,
          game_events: [],
        }),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_fixture({ home_team_score: 1 }),
      });

      const event: GameEvent = {
        id: "event-1",
        event_type: "goal",
        minute: 25,
        stoppage_time_minute: null,
        team_side: "home",
        player_name: "Player 1",
        secondary_player_name: "",
        description: "",
        recorded_at: new Date().toISOString(),
      };

      const result = await use_cases.record_game_event("fixture-123", event);

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        "fixture-123",
        expect.objectContaining({
          home_team_score: 1,
        }),
      );
    });

    it("should record own goal and credit opponent", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: create_test_fixture({
          home_team_score: 0,
          away_team_score: 0,
          game_events: [],
        }),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_fixture({ away_team_score: 1 }),
      });

      const event: GameEvent = {
        id: "event-2",
        event_type: "own_goal",
        minute: 30,
        stoppage_time_minute: null,
        team_side: "home",
        player_name: "Player 1",
        secondary_player_name: "",
        description: "",
        recorded_at: new Date().toISOString(),
      };

      const result = await use_cases.record_game_event("fixture-123", event);

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        "fixture-123",
        expect.objectContaining({
          away_team_score: 1,
        }),
      );
    });

    it("should fail for empty id", async () => {
      const event: GameEvent = {
        id: "event-3",
        event_type: "goal",
        minute: 10,
        stoppage_time_minute: null,
        team_side: "home",
        player_name: "Player 1",
        secondary_player_name: "",
        description: "",
        recorded_at: new Date().toISOString(),
      };
      const result = await use_cases.record_game_event("", event);

      expect(result.success).toBe(false);
    });
  });

  describe("update_period", () => {
    it("should update period", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_fixture({ current_period: "second_half" }),
      });

      const result = await use_cases.update_period(
        "fixture-123",
        "second_half",
        45,
      );

      expect(result.success).toBe(true);
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.update_period("", "second_half", 45);

      expect(result.success).toBe(false);
    });
  });

  describe("end_fixture", () => {
    it("should end fixture", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_fixture({ status: "completed" }),
      });

      const result = await use_cases.end_fixture("fixture-123");

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        "fixture-123",
        expect.objectContaining({
          status: "completed",
          current_period: "finished",
        }),
      );
    });

    it("should fail for empty id", async () => {
      const result = await use_cases.end_fixture("");

      expect(result.success).toBe(false);
    });
  });
});
