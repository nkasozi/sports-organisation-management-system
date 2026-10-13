import { vi } from "vitest";

import type {
  CreateOfficialPerformanceRatingInput,
  OfficialPerformanceRating,
} from "../entities/OfficialPerformanceRating";
import { type OfficialPerformanceRatingRepository } from "../interfaces/ports";

export function create_mock_repository(): OfficialPerformanceRatingRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_official: vi.fn(),
    find_by_fixture: vi.fn(),
    find_by_official_and_fixture: vi.fn(),
    find_existing_rating: vi.fn(),
  } as OfficialPerformanceRatingRepository;
}

export function create_test_rating(
  overrides: Partial<OfficialPerformanceRating> = {},
): OfficialPerformanceRating {
  return {
    id: "opr_001",
    organization_id: "org_1",
    official_id: "off_1",
    fixture_id: "fix_1",
    rater_user_id: "user_1",
    rater_role: "officials_manager",
    overall: 7,
    decision_accuracy: 7,
    game_control: 7,
    communication: 7,
    fitness: 7,
    notes: "",
    submitted_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as OfficialPerformanceRating;
}

export function create_valid_input(
  overrides: Partial<CreateOfficialPerformanceRatingInput> = {},
): CreateOfficialPerformanceRatingInput {
  return {
    organization_id: "org_1",
    official_id: "off_1",
    fixture_id: "fix_1",
    rater_user_id: "user_1",
    rater_role: "officials_manager",
    overall: 7,
    decision_accuracy: 7,
    game_control: 7,
    communication: 7,
    fitness: 7,
    notes: "",
    submitted_at: "",
    ...overrides,
  } as CreateOfficialPerformanceRatingInput;
}
