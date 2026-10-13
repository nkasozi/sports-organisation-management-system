import { vi } from "vitest";

import type {
  CreateJerseyColorInput,
  JerseyColor,
} from "../entities/JerseyColor";
import type { JerseyColorRepository } from "../interfaces/ports";

export function create_mock_jersey_color_repository(): JerseyColorRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_holder: vi.fn(),
  } as JerseyColorRepository;
}

export function create_valid_jersey_color_input(
  overrides: Partial<CreateJerseyColorInput> = {},
): CreateJerseyColorInput {
  return {
    holder_type: "team",
    holder_id: "team-123",
    nickname: "Home Jersey",
    main_color: "#ff0000",
    secondary_color: "#ffffff",
    tertiary_color: "",
    status: "active",
    ...overrides,
  } as CreateJerseyColorInput;
}

export function create_test_jersey_color(
  overrides: Partial<JerseyColor> = {},
): JerseyColor {
  return {
    id: "jersey-123",
    ...create_valid_jersey_color_input(),
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as JerseyColor;
}
