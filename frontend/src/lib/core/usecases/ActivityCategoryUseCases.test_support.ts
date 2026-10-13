import { vi } from "vitest";

import type {
  ActivityCategory,
  CreateActivityCategoryInput,
} from "../entities/ActivityCategory";
import type { ActivityCategoryRepository } from "../interfaces/ports";
import type { ScalarInput } from "../types/DomainScalars";

export function make_mock_repository(): ActivityCategoryRepository {
  return {
    find_all: vi
      .fn()
      .mockResolvedValue({ success: true, data: { items: [], total: 0 } }),
    find_by_id: vi.fn().mockResolvedValue({ success: true, data: undefined }),
    create: vi.fn().mockResolvedValue({ success: true, data: undefined }),
    update: vi.fn().mockResolvedValue({ success: true, data: undefined }),
    delete_by_id: vi.fn().mockResolvedValue({ success: true, data: true }),
    find_by_organization: vi
      .fn()
      .mockResolvedValue({ success: true, data: { items: [], total: 0 } }),
  } as unknown as ActivityCategoryRepository;
}

export function make_category(
  overrides: Partial<ScalarInput<ActivityCategory>> = {},
): ActivityCategory {
  return {
    id: "cat-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    name: "Competition",
    description: "Default competition category",
    organization_id: "org-1",
    category_type: "competition",
    color: "#3B82F6",
    icon: "trophy",
    is_system_generated: false,
    ...overrides,
  } as unknown as ActivityCategory;
}

export function make_create_input(
  overrides: Partial<CreateActivityCategoryInput> = {},
): CreateActivityCategoryInput {
  return {
    name: "Custom Events",
    description: "Custom event category",
    organization_id: "org-1",
    category_type: "custom",
    color: "#8B5CF6",
    icon: "star",
    is_system_generated: false,
    ...overrides,
  } as CreateActivityCategoryInput;
}
